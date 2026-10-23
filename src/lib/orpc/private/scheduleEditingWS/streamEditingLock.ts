import {ORPCError} from "@orpc/server";
import {scheduleEditingChannels} from "./channels.ts";

// Stream edit locks live in the schedule's ScheduleEditingObject (KV-30): strongly consistent and
// atomic, released by unlockStream, by the holder's last editor socket closing, or after
// STREAM_LOCK_TTL_MS without renewal (see the object).

function lockObject(env: Env, scheduleId: number) {
  const DO = env.ScheduleEditingObject
  return DO.get(DO.idFromName(scheduleEditingChannels.edit(scheduleId)))
}

/**
 * Check whether a given stream currently has an edit lock.
 * Returns true if any user holds the lock; false otherwise.
 */
export async function isStreamLockedEditing(env: Env, scheduleId: number, streamId: number): Promise<boolean> {
  // @ts-ignore
  const holder: number | null = await lockObject(env, scheduleId).streamLockHolder(streamId, -1)
  return holder !== null
}

/**
 * Attempt to acquire an exclusive edit lock for a stream.
 * - If no lock exists, acquires the lock for the given userId (`acquired: true`).
 * - If the same user already holds the lock, renews it (idempotent, `acquired: false`).
 * - If another user holds the lock, throws FORBIDDEN.
 */
export async function lockStreamEditing(env: Env, scheduleId: number, streamId: number, userId: number) {
  // @ts-ignore
  const result: { status: 'acquired' | 'renewed' | 'held' } = await lockObject(env, scheduleId).acquireStreamLock(scheduleId, streamId, userId)
  if (result.status === 'held') {
    throw new ORPCError('FORBIDDEN', {
      message: 'Stream is already locked'
    })
  }
  return { ok: true as const, acquired: result.status === 'acquired' }
}

/**
 * Release an edit lock for a stream.
 * - Only the lock owner can release; otherwise throws FORBIDDEN.
 * - If no lock exists, this is a no-op (treated as success).
 */
export async function unlockStreamEditing(env: Env, scheduleId: number, streamId: number, userId: number) {
  // @ts-ignore
  const result: 'released' | 'none' | 'held' = await lockObject(env, scheduleId).releaseStreamLock(streamId, userId)
  if (result === 'held') {
    throw new ORPCError('FORBIDDEN', {
      message: 'Stream is locked by another user'
    })
  }
  return { ok: true as const }
}

/**
 * Assert that the stream is either unlocked, or already locked by userId (which renews the lock).
 * Throws FORBIDDEN if it is locked by another user.
 */
export async function assertStreamLockAvailableOrOwned(env: Env, scheduleId: number, streamId: number, userId: number) {
  // @ts-ignore
  const holder: number | null = await lockObject(env, scheduleId).streamLockHolder(streamId, userId)
  if (holder !== null && holder !== userId) {
    throw new ORPCError('FORBIDDEN', { message: 'Stream is locked by another user' })
  }
}
