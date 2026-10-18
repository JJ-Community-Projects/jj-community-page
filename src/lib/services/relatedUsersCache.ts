import { CACHE_POLICY } from './cachePolicy.ts'
import { putCache } from './kvCache.ts'

/** The public profile shows this many related users. */
export const PROFILE_RELATED_USERS_LIMIT = 3

const relatedUsersKey = (userId: number, limit: number) =>
  `relatedUsers:${userId}:limit=${limit}`

/** The cached related-users list as JSON text, or null. */
export function getCachedRelatedUsers(env: Env, userId: number, limit: number) {
  return env.KV.get(relatedUsersKey(userId, limit), { cacheTtl: 300 })
}

// Empty lists are cached too: users without (shared) tags are the common case.
export async function setCachedRelatedUsers(
  env: Env,
  userId: number,
  limit: number,
  data: unknown[],
) {
  await putCache(env.KV, relatedUsersKey(userId, limit), JSON.stringify(data), {
    expirationTtl: CACHE_POLICY.relatedUsers.ttl,
  })
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
