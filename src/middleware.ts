import {defineMiddleware} from "astro:middleware";
import {initializeLucia} from "./lib/auth.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const lucia = initializeLucia(context.locals.runtime.env.DB);
  const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) {
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }
  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }
  context.locals.session = session;
  context.locals.user = user;
  return next();
});
