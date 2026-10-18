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
 * every input the answer depends on and nothing per viewer (Twitch `userId`, session). Never use it
 * on a procedure that reads `locals.user`.
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
      const entry = await edgeCached({
        key: edgeCacheKey(context.request.url, [
          entity,
          path.join('.'),
          key(input),
        ]),
        policy,
        waitUntil: context.locals?.cfContext?.waitUntil.bind(
          context.locals.cfContext,
        ),
        load: async () => {
          try {
            return { value: (await next()).output }
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
