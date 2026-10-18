import { CACHE_POLICY } from './cachePolicy.ts'

/** The public profile shows this many related users. */
export const PROFILE_RELATED_USERS_LIMIT = 3

const relatedUsersKey = (userId: number, limit: number) =>
  `relatedUsers:${userId}:limit=${limit}`

/** The cached related-users list as JSON text, or null. */
export function getCachedRelatedUsers(env: Env, userId: number, limit: number) {
  return env.KV.get(relatedUsersKey(userId, limit), { cacheTtl: 300 })
}

// Empty lists are cached too: users without (shared) tags are the common case.
// A failed put is logged only: the cache must not fail the profile page.
export async function setCachedRelatedUsers(
  env: Env,
  userId: number,
  limit: number,
  data: unknown[],
) {
  try {
    await env.KV.put(relatedUsersKey(userId, limit), JSON.stringify(data), {
      expirationTtl: CACHE_POLICY.relatedUsers.ttl,
    })
  } catch (e) {
    console.error('setCachedRelatedUsers', e)
  }
}

// A block hides users from each other's lists; drop both profile lists instead of waiting for the TTL.
export async function forgetRelatedUsers(env: Env, userIds: number[]) {
  try {
    await Promise.all(
      userIds.map((id) =>
        env.KV.delete(relatedUsersKey(id, PROFILE_RELATED_USERS_LIMIT)),
      ),
    )
  } catch (e) {
    console.error('forgetRelatedUsers', e)
  }
}
