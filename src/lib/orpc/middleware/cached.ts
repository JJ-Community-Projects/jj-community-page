import { ORPCError, os } from '@orpc/server'
import type { ResponseHeadersPluginContext } from '@orpc/server/plugins'
import {
  CACHE_POLICY,
  type CacheEntity,
  type CachePolicy,
} from '../../services/cachePolicy.ts'
import { edgeCached, edgeCacheKey } from '../../services/edgeCache.ts'

interface ORPCContext extends ResponseHeadersPluginContext {
  locals?: App.Locals
  request?: Request
}

/**
 * Edge cache (`caches.default`) around a public procedure: on a hit nothing after this middleware
 * runs (rate limiter, KV, DOs, D1). The key is the procedure path plus `key(input)`, so it must hold
 * every input the answer depends on and nothing per viewer (Twitch `userId`, session).
 * The procedure always runs without the viewer (`locals.user` / `locals.session` are null), so what
 * gets stored is the anonymous answer. A logged-in request skips the read and stores a fresh answer:
 * a creator sees their own edit at once and refreshes the entry for their data center.
 * NOT_FOUND answers are cached for the policy's `negativeTtl` (none: not cached) and rethrown
 * with the same message; any other error is not cached.
 */
export const cached = <TInput>(
  entity: CacheEntity,
  key: (input: TInput) => string,
  overrides: Partial<CachePolicy> = {},
) => {
  const policy: CachePolicy = { ...CACHE_POLICY[entity], ...overrides }
  return os
    .$context<ORPCContext>()
    .middleware(async ({ context, next, path }, input: TInput, output) => {
      if (!context.request) return next()
      const locals = context.locals
      const entry = await edgeCached({
        key: edgeCacheKey(context.request.url, [
          entity,
          path.join('.'),
          key(input),
        ]),
        policy,
        refresh: Boolean(locals?.user),
        waitUntil: locals?.cfContext?.waitUntil.bind(locals.cfContext),
        load: async () => {
          try {
            const result = await next({
              context: { locals: locals && withoutViewer(locals) },
            })
            return { value: result.output }
          } catch (e) {
            if (e instanceof ORPCError && e.code === 'NOT_FOUND') {
              return { notFound: true, message: e.message }
            }
            throw e
          }
        },
      })
      if ('notFound' in entry) {
        throw new ORPCError('NOT_FOUND', { message: entry.message })
      }
      return output(entry.value)
    })
}

/** Key from the whole input (object keys sorted), for answers that depend on every field. */
export const byInput = (input: unknown) => stableJson(input) ?? ''

function stableJson(value: unknown): string | undefined {
  return JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : v,
  )
}

// The request's locals with the viewer hidden. A prototype instead of a copy, so Astro's own
// getters on locals are not read here.
function withoutViewer(locals: App.Locals): App.Locals {
  return Object.create(locals, {
    user: { value: null, enumerable: true },
    session: { value: null, enumerable: true },
  })
}
