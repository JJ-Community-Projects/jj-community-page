import {defineMiddleware} from "astro:middleware";
import {deleteSessionTokenCookie, setSessionTokenCookie, validateSessionToken} from "./functions/session.ts";
import type {AstroContext} from "./lib/AstroContext.ts";
import {createRepos} from "./lib/db/repos/createRepos.ts";

/**
 * Middleware that handles session validation and user authentication.
 *
 * This middleware:
 * 1. Checks for a session cookie
 * 2. Validates the session token if present
 * 3. Sets the user and session in context.locals
 * 4. Refreshes the session cookie if needed
 *
 * @param {AstroContext} context - The Astro context object
 * @param {Function} next - The function to call to continue to the next middleware or route handler
 * @returns {Promise<Response>} The response from the next middleware or route handler
 */
export const onRequest = defineMiddleware(async (context, next) => {

  const token = context.cookies.get("session")?.value ?? null;
  const upgradeHeader = context.request.headers.get("upgrade");
  if (upgradeHeader && upgradeHeader.toLowerCase() === "websocket") {
    if (token) {
      // Create a new request with the token in the header
      const newRequest = new Request(context.request.url, {
        method: context.request.method,
        headers: new Headers(context.request.headers),
        body: context.request.body,
        redirect: context.request.redirect,
        signal: context.request.signal,
      });

      // Add the token to the request header
      newRequest.headers.set('token', `${token}`);

      // Replace the original request with the new one
      context.request = newRequest;
    }
    // Bypass middleware for WebSocket upgrade requests
    console.log('middleware', 'websocket')
    return next()
  }
  try {
    if (token === null) {
      context.locals.session = null;
      context.locals.user = null;
      return next();
    }
    const {user, session} = await validateSessionToken(context, token);
    if (session !== null) {
      setSessionTokenCookie(context, token, session.expiresAt);
    } else {
      deleteSessionTokenCookie(context);
    }
    context.locals.session = session;
    context.locals.user = user;
  } catch (e) {
    console.error('middleware', e);
    // Ensure locals are set to null in case of error
    context.locals.session = null;
    context.locals.user = null;
  }

  try {
    context.locals.repos = createRepos(context);
  } catch (e) {
    console.error('middleware', 'createRepos', e);
  }

  return next();
});
