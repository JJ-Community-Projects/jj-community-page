import {defineMiddleware, sequence} from "astro:middleware";
import {env} from "cloudflare:workers";
import {deleteSessionTokenCookie, setSessionTokenCookie, validateSessionToken} from "./functions/session.ts";
import {loggableError} from "./lib/db/loggableError.ts";

/** API routes that never read `locals.user` / `locals.session`. */
const SESSIONLESS_PREFIXES = [
  '/api/public/',
  '/api/private/jj/',
  '/api/private/yogs/',
  '/api/jj-data/',
];

/**
 * Login, dashboards and fragments (overlays, embeds, PWA shell, schedule placeholder): noindex on
 * prod too. The same paths are disallowed in robots.txt.
 */
const NOINDEX_PREFIXES = [
  '/login',
  '/auth-error',
  '/dashboard',
  '/admin',
  '/overlays',
  '/embed',
  '/pwa',
  '/yogs/placeholder',
];

function isNoindexPath(path: string) {
  // Whole segments only: `/loginator` is a profile.
  return NOINDEX_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * Keeps non-prod deployments (beta, dev) out of search indexes: every response that passes through
 * here gets `X-Robots-Tag: noindex, nofollow`, including redirects, error pages and API routes.
 * On prod only the NOINDEX_PREFIXES paths get it. Asset-layer files (prerendered pages, robots.txt)
 * never reach it.
 */
const robotsTag = defineMiddleware(async (context, next) => {
  const response = await next();
  // WebSocket upgrades (101) can't be copied, and the header means nothing on them.
  if (response.status === 101) return response;
  if (env.ENVIRONMENT === 'PROD' && !isNoindexPath(new URL(context.request.url).pathname)) return response;
  try {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  } catch {
    // Immutable headers (`Response.redirect()`, a passed-through fetch): set it on a copy.
    const copy = new Response(response.body, response);
    copy.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return copy;
  }
});

/**
 * Middleware that handles session validation and user authentication.
 *
 * This middleware:
 * 1. Checks for a session cookie
 * 2. Validates the session token if present
 * 3. Sets the user and session in context.locals
 * 4. Refreshes the session cookie when the session was extended
 *
 * @param {AstroContext} context - The Astro context object
 * @param {Function} next - The function to call to continue to the next middleware or route handler
 * @returns {Promise<Response>} The response from the next middleware or route handler
 */
const session = defineMiddleware(async (context, next) => {
  const path = new URL(context.request.url).pathname;
  if (
    path.startsWith('/_astro/') ||
    path.startsWith('/fonts/') ||
    path === '/favicon.ico' ||
    path === '/robots.txt' ||
    path === '/site.webmanifest' ||
    /\.(js|css|png|jpg|jpeg|svg|gif|ico|woff2?|ttf|webp|avif)$/.test(path)
  ) {
    return next();
  }

  // Routes that never read the viewer: no session lookup (KV, maybe D1) for logged-in polls.
  // The overlays keep it, so a logged-in creator's preview refreshes the edge cache.
  if (SESSIONLESS_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    context.locals.session = null;
    context.locals.user = null;
    return next();
  }

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
    return next()
  }

  try {
    if (token === null) {
      context.locals.session = null;
      context.locals.user = null;
      return next();
    }
    const {user, session, extended} = await validateSessionToken(context, token);
    if (session === null) {
      deleteSessionTokenCookie(context);
    } else if (extended) {
      // Only when the expiry moved: a Set-Cookie on every response makes them all uncacheable.
      setSessionTokenCookie(context, token, session.expiresAt);
    }
    context.locals.session = session;
    context.locals.user = user;
  } catch (e) {
    console.error('middleware', loggableError(e)); // F-32
    // Ensure locals are set to null in case of error
    context.locals.session = null;
    context.locals.user = null;
  }


  return next();
});

export const onRequest = sequence(robotsTag, session);
