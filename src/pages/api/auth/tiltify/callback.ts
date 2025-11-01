import type {APIRoute} from "astro";
import {drizzle} from "drizzle-orm/d1";
import {accounts, users, userSocials} from "../../../../lib/db/schema/auth-schema.ts";
import {and, eq} from "drizzle-orm";
import {Configuration, UserApi} from "../../../../lib/externalAPI/tiltify/api/src";
import {TiltifyAPI, type TiltifyUserResponse} from "../../../../lib/TiltifyAPI.ts";
import {TwitchAPI} from "../../../../lib/twitchAPI.ts";
import {twitchChannelSchema} from "../../../../lib/db/schema/twitch-channel-schema.ts";
import {
  createNewUserSession,
  createSession,
  generateSessionToken,
  setSessionTokenCookie
} from "../../../../functions/session.ts";
import {getDB} from "../../../../lib/db/db.ts";

export const GET: APIRoute = async (ctx) => {
  const {locals, request} = ctx

  // region auth state check
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = ctx.url.searchParams.get("state");
  const storedState = ctx.cookies.get("tiltify_oauth_state")?.value ?? null;
  if (!code) {
    return ctx.redirect('/auth-error?error=missing-code');
  }
  if (!state || !storedState) {
    return ctx.redirect('/auth-error?error=missing-state');
  }
  if (storedState != state) {
    return ctx.redirect('/auth-error?error=state-mismatch');
  }
  // endregion

  const tiltifyAPI = new TiltifyAPI(ctx.locals.runtime.env);
  // region get tiltify token
  let tokenData
  try {
    tokenData = await tiltifyAPI.getTokenFromCode(ctx)
    if (!tokenData) {
      return ctx.redirect('/auth-error?error=token-exchange-failed');
    }
  } catch (e) {
    console.error('api/auth/tiltify/callback', e);
    return ctx.redirect('/auth-error?error=token-exchange-failed');
  }

  let tiltifyUser: TiltifyUserResponse
  try {
    const resp = await tiltifyAPI.getUser(tokenData.accessToken) // userAPI.v5ApiWebPublicUserControllerCurrentUser()
    if (!resp) {
      return ctx.redirect('/auth-error?error=user-fetch-failed');
    }
    tiltifyUser = resp
  } catch (e) {
    console.error('api/auth/tiltify/callback', e);
    return ctx.redirect('/auth-error?error=user-fetch-failed');
  }
  // endregion

  const tiltifyId = tiltifyUser.data.id;
  const tiltifyUsername = tiltifyUser.data.username;

  const db = getDB(ctx)
  let existingAccount = await db.select()
    .from(accounts)
    .where(and(eq(accounts.provider, "tiltify"), eq(accounts.providerId, tiltifyId)))
    .get();

  if (existingAccount) {
    const sessionToken = generateSessionToken();
    const session = await createSession(ctx, sessionToken, existingAccount.userId);
    setSessionTokenCookie(ctx, sessionToken, session.expiresAt);
    return ctx.redirect(`/dashboard`);
  }

  const sessionToken = generateSessionToken();
  const session = await createNewUserSession(ctx, sessionToken, tiltifyUser.data, tokenData);
  if (!session) {
    return ctx.redirect('/auth-error?error=session-creation-failed');
  }

  // If Tiltify profile includes Twitch, handle like manual addSocial (also store Twitch profile)
  try {
    const twitchValue = tiltifyUser?.data?.social?.twitch;
    if (twitchValue) {
      // Normalize to URL
      const twitchUrl = twitchValue.startsWith('http')
        ? twitchValue
        : `https://twitch.tv/${twitchValue}`;

      // Extract username
      const parts = twitchUrl.split('/');
      const username = parts[parts.length - 1];

      // Resolve Twitch channel and upsert channel profile
      const twitchAPI = new TwitchAPI(ctx.locals.runtime.env);
      const { data, error } = await twitchAPI.fetchUserByLogin(username);
      if (!error && data && data.length > 0) {
        const channel = data[0];
        await db
          .insert(twitchChannelSchema)
          .values({
            userId: session.userId,
            id: channel.id,
            login: channel.login,
            displayName: channel.display_name,
            description: channel.description,
            profileImageUrl: channel.profile_image_url,
            offlineImageUrl: channel.offline_image_url,
          })
          .onConflictDoUpdate({
            target: [twitchChannelSchema.id],
            set: {
              id: channel.id,
              login: channel.login,
              displayName: channel.display_name,
              description: channel.description,
              profileImageUrl: channel.profile_image_url,
              offlineImageUrl: channel.offline_image_url,
            },
          });
      }

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
        });
    }
  } catch (e) {
    console.error('Tiltify signup Twitch handling failed', e);
    // Do not block signup on Twitch enrichment failure
  }

  setSessionTokenCookie(ctx, sessionToken, session.expiresAt);
  // const stub = await getRPCUserDO(ctx, session.userId)
  return ctx.redirect(`/dashboard`);

}
