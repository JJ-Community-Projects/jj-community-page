import type {APIRoute} from "astro";
import {drizzle} from "drizzle-orm/d1";
import {accounts, users} from "../../../../lib/db/schema/auth-schema.ts";
import {and, eq} from "drizzle-orm";
import {Configuration, UserApi} from "../../../../lib/externalAPI/tiltify/api/src";
import {getTiltifyTokenFromCode, getTiltifyUser, type TiltifyUserResponse} from "../../../../functions/tiltify.ts";
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

  // region get tiltify token
  let tokenData
  try {
    tokenData = await getTiltifyTokenFromCode(ctx)
    if (!tokenData) {
      return ctx.redirect('/auth-error?error=token-exchange-failed');
    }
  } catch (e) {
    console.error('api/auth/tiltify/callback', e);
    return ctx.redirect('/auth-error?error=token-exchange-failed');
  }

  let tiltifyUser: TiltifyUserResponse
  try {
    const resp = await getTiltifyUser(tokenData.accessToken) // userAPI.v5ApiWebPublicUserControllerCurrentUser()
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
    return ctx.redirect(`/admin`);
  }

  const sessionToken = generateSessionToken();
  const session = await createNewUserSession(ctx, sessionToken, tiltifyUser.data, tokenData);
  if (!session) {
    return ctx.redirect('/auth-error?error=session-creation-failed');
  }
  setSessionTokenCookie(ctx, sessionToken, session.expiresAt);
  const DO = ctx.locals.runtime.env.UserDO
  const doId = DO.idFromName(`${session.userId}`)

  return ctx.redirect(`/admin`);

}
