import { env } from 'cloudflare:workers'
import type { APIRoute } from 'astro'
import { accounts, userSocials } from '../../../../lib/db/schema/auth-schema.ts'
import { and, eq } from 'drizzle-orm'
import { TiltifyAPI, type TiltifyUserResponse, } from '../../../../lib/TiltifyAPI.ts'
import { TwitchAPI } from '../../../../lib/twitchAPI.ts'
import { linkTwitchChannel } from '../../../../lib/services/twitchChannels.ts'
import {
  createNewUserSession,
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from '../../../../functions/session.ts'
import { getDB } from '../../../../lib/db/db.ts'
import { loggableError } from '../../../../lib/db/loggableError.ts'

export const GET: APIRoute = async (ctx) => {
  const { locals, request } = ctx

  // region auth state check
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = ctx.url.searchParams.get('state')
  const storedState = ctx.cookies.get('tiltify_oauth_state')?.value ?? null
  // Single use: the state is cleared on every outcome, so it can't pass the check again (F-24)
  ctx.cookies.delete('tiltify_oauth_state', { path: '/' })
  if (!code) {
    return ctx.redirect('/auth-error?error=missing-code')
  }
  if (!state || !storedState) {
    return ctx.redirect('/auth-error?error=missing-state')
  }
  if (storedState != state) {
    return ctx.redirect('/auth-error?error=state-mismatch')
  }
  // endregion

  const tiltifyAPI = new TiltifyAPI(env)
  // region get tiltify token
  let tokenData
  try {
    tokenData = await tiltifyAPI.getTokenFromCode(ctx)
    if (!tokenData) {
      return ctx.redirect('/auth-error?error=token-exchange-failed')
    }
  } catch (e) {
    console.error('api/auth/tiltify/callback', loggableError(e)) // F-32
    return ctx.redirect('/auth-error?error=token-exchange-failed')
  }

  let tiltifyUser: TiltifyUserResponse
  try {
    const resp = await tiltifyAPI.getUser(tokenData.accessToken) // userAPI.v5ApiWebPublicUserControllerCurrentUser()
    if (!resp) {
      return ctx.redirect('/auth-error?error=user-fetch-failed')
    }
    tiltifyUser = resp
  } catch (e) {
    console.error('api/auth/tiltify/callback', loggableError(e)) // F-32
    return ctx.redirect('/auth-error?error=user-fetch-failed')
  }
  // endregion

  const tiltifyId = tiltifyUser.data.id
  const tiltifyUsername = tiltifyUser.data.username

  const db = getDB(ctx)
  let existingAccount = await db
    .select()
    .from(accounts)
    .where(
      and(eq(accounts.provider, 'tiltify'), eq(accounts.providerId, tiltifyId)),
    )
    .get()

  if (existingAccount) {
    const sessionToken = generateSessionToken()
    const session = await createSession(
      ctx,
      sessionToken,
      existingAccount.userId,
    )
    setSessionTokenCookie(ctx, sessionToken, session.expiresAt)
    return ctx.redirect(`/dashboard`)
  }

  const sessionToken = generateSessionToken()
  const session = await createNewUserSession(
    ctx,
    sessionToken,
    tiltifyUser.data,
    tokenData,
  )
  if (!session) {
    return ctx.redirect('/auth-error?error=session-creation-failed')
  }

  // If Tiltify profile includes Twitch, handle like manual addSocial (also store Twitch profile)
  try {
    const twitchValue = tiltifyUser?.data?.social?.twitch
    if (twitchValue) {
      // Normalize to URL
      const twitchUrl = twitchValue.startsWith('http')
        ? twitchValue
        : `https://twitch.tv/${twitchValue}`

      // Extract username
      const parts = twitchUrl.split('/')
      const username = parts[parts.length - 1]

      // Resolve Twitch channel and upsert channel profile
      const twitchAPI = new TwitchAPI(env)
      const { data, error } = await twitchAPI.fetchUserByLogin(username)
      if (error){
        console.error('api/auth/tiltify/callback', 'twitch.error', error)
      }
      // Another account's channel: the new user gets neither the channel nor a Twitch social (F-12)
      if (
        data &&
        data.length > 0 &&
        (await linkTwitchChannel(db, session.userId, data[0])) === 'linked'
      ) {
        // Upsert social link
        await db
          .insert(userSocials)
          .values({
            userId: session.userId,
            provider: 'twitch',
            url: twitchUrl,
          })
          .onConflictDoUpdate({
            target: [userSocials.userId, userSocials.provider],
            set: { url: twitchUrl },
          })
      }
    }
  } catch (e) {
    console.error(
      'api/auth/tiltify/callback',
      'Tiltify signup Twitch handling failed',
      loggableError(e), // F-32
    )
    // Do not block signup on Twitch enrichment failure
  }

  setSessionTokenCookie(ctx, sessionToken, session.expiresAt)
  // const stub = await getRPCUserDO(ctx, session.userId)
  return ctx.redirect(`/dashboard`)
}
