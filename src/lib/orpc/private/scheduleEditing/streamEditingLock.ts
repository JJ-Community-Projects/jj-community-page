import {ORPCError} from "@orpc/server";

/**
 * Check whether a given stream currently has an edit lock.
 * Returns true if any user holds the lock; false otherwise.
 */
export async function isStreamLockedEditing(env: Env, scheduleId: number, streamId: number): Promise<boolean> {
  const KV = env.KV
  const key = `ScheduleLock-${scheduleId}-${streamId}`
  const lock = await KV.get<string>(key)
  return lock !== null
}

/**
 * Attempt to acquire an exclusive edit lock for a stream.
 * - If no lock exists, acquires the lock for the given userId.
 * - If the same user already holds the lock, this is a no-op (idempotent).
 * - If another user holds the lock, throws FORBIDDEN.
 */
export async function lockStreamEditing(env: Env, scheduleId: number, streamId: number, userId: number) {
  const KV = env.KV
  const key = `ScheduleLock-${scheduleId}-${streamId}`
  const lock = await KV.get<string>(key)
  if (!lock) {
    await KV.put(key, String(userId))
    return { ok: true as const }
  }
  if (lock === String(userId)) {
    // already locked by this user; treat as success
    return { ok: true as const }
  }
  throw new ORPCError('FORBIDDEN', {
    message: 'Stream is already locked'
  })
}

/**
 * Release an edit lock for a stream.
 * - Only the lock owner can release; otherwise throws FORBIDDEN.
 * - If no lock exists, this is a no-op (treated as success).
 */
export async function unlockStreamEditing(env: Env, scheduleId: number, streamId: number, userId: number) {
  const KV = env.KV
  const key = `ScheduleLock-${scheduleId}-${streamId}`
  const lock = await KV.get<string>(key)
  if (lock === null) return { ok: true as const }
  if (lock === String(userId)) {
    await KV.delete(key)
    return { ok: true as const }
  }
  throw new ORPCError('FORBIDDEN', {
    message: 'Stream is locked by another user'
  })
}

/**
 * Assert that the stream is either unlocked, or already locked by userId.
 * Throws FORBIDDEN if it is locked by another user.
 */
export async function assertStreamLockAvailableOrOwned(env: Env, scheduleId: number, streamId: number, userId: number) {
  const KV = env.KV
  const key = `ScheduleLock-${scheduleId}-${streamId}`
  const lock = await KV.get<string>(key)
  if (lock && lock !== String(userId)) {
    throw new ORPCError('FORBIDDEN', { message: 'Stream is locked by another user' })
  }
}
