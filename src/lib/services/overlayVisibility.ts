import { isolateCached } from './isolateCache.ts'

/**
 * `content:visibility` KV flag gating the overlays and community/teams/yogs pages.
 * Value `'hidden' | 'visible'`; a missing or unrecognised value defaults to
 * `'hidden'` (previous hardcoded behaviour, fails closed).
 */
export const CONTENT_VISIBILITY_KV_KEY = 'content:visibility'

export type ContentVisibility = 'hidden' | 'visible'

export async function readContentVisibility(
  env: Env,
): Promise<ContentVisibility> {
  const value = await env.KV.get(CONTENT_VISIBILITY_KV_KEY)
  return value === 'visible' ? 'visible' : 'hidden'
}

/**
 * `readContentVisibility` kept per isolate for the public pages and overlays, which read it on every
 * request. A flip reaches them within about a minute (KV's own edge cache is 60 s). The admin view
 * reads KV directly.
 */
export function readContentVisibilityCached(
  env: Env,
): Promise<ContentVisibility> {
  return isolateCached('content-visibility', 30_000, () =>
    readContentVisibility(env),
  )
}
