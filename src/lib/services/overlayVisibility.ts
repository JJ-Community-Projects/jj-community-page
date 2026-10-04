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
