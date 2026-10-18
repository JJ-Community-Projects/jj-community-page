import { hasAstroContext } from './hasAstroContext.ts'

/**
 * cacheMiddleware
 *
 * Purpose:
 * - Adds an HTTP Cache-Control header to responses produced by oRPC procedures.
 * - Meant to be composed on routes where you want browser/CDN caching.
 *
 * Requirements:
 * - The oRPC ResponseHeadersPlugin must be installed on the handler so that
 *   context.resHeaders is available. If it isn't, optional chaining keeps this
 *   middleware safe (it will simply do nothing).
 *
 * Configuration:
 * - maxAge: seconds for browser caches (Cache-Control: max-age)
 * - sMaxAge: seconds for shared caches/CDN (Cache-Control: s-maxage)
 * - staleWhileRevalidate: seconds a cache may serve stale content while revalidating
 *
 * Defaults (if not provided):
 * - max-age: 60s
 * - s-maxage: 300s
 * - stale-while-revalidate: 60s
 *
 * Note:
 * - This middleware composes on top of hasAstroContext to ensure the Astro
 *   context is present and to get resHeaders from the plugin.
 * - The header is only set on success, so errors (429, 404) are never cached by browsers,
 *   and a cache hit returned by a later middleware (`cached`) still gets it.
 */
export const cacheMiddleware = (cacheControl: {
  // maxAge: Number of seconds browsers (private caches) may cache the response.
  // Maps to the Cache-Control "max-age" directive. Typical use: short values for
  // rapidly changing data so end users do not see stale content for long.
  maxAge?: number
  // sMaxAge: Number of seconds shared caches/CDNs (public caches) may cache the response.
  // Maps to the Cache-Control "s-maxage" directive. Often set higher than maxAge to let
  // your CDN cache content longer while browsers revalidate more frequently.
  sMaxAge?: number
  // staleWhileRevalidate: Window (in seconds) during which caches may serve a stale
  // response while they asynchronously fetch a fresh copy in the background. Useful to
  // hide latency spikes and keep responses instant while updates happen.
  staleWhileRevalidate?: number
}) =>
  // Ensure we have Astro context and (via ResponseHeadersPlugin) a resHeaders setter
  hasAstroContext.concat(async ({ context, next }) => {
    // Continue to the next middleware/handler without modifying the context
    // (we still return it explicitly for clarity).
    const result = await next({
      context: context,
    })

    // Set the Cache-Control header with sensible defaults; optional chaining here
    // keeps things safe if the plugin wasn't installed.
    context.resHeaders?.set(
      'Cache-Control',
      `public, max-age=${cacheControl.maxAge ?? 60}, s-maxage=${cacheControl.sMaxAge ?? 300}, stale-while-revalidate=${cacheControl.staleWhileRevalidate ?? 60}`,
    )
    return result
  })
