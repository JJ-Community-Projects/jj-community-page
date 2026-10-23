import {
  DurableIteratorObject,
  toDurableIteratorWebsocket,
} from '@orpc/experimental-durable-iterator/durable-object'
import type {
  DraftDiscardedPayload,
  DraftPublishedPayload,
  EditChannelMessage,
  InitPayload,
  LockPayload,
  ParticipantAddedPayload,
  ParticipantRemovedPayload,
  ScheduleUpdatedPayload,
  StreamAddedPayload,
  StreamDeletedPayload,
  StreamUpdatedPayload,
  StreamUpdatedWithDetailPayload,
  TagAddedPayload,
  TagRemovedPayload,
  UnlockPayload,
} from '../scheduleEditingTypes.ts'
import { normalizeInitPayloadDates } from '../scheduleEditingTypes.ts'
import { getDB } from '../../../../db/db.ts'
import { loadDraftSnapshotFor } from '../utils.ts'

/** Close code (private range) for a socket whose user may no longer edit the schedule. */
const ACCESS_REVOKED_CLOSE_CODE = 4403

type SocketAttachment = { allowed?: boolean }

/** Only sockets whose access was checked on subscribe get broadcasts. */
const notAllowed = (websocket: WebSocket) =>
  (websocket.deserializeAttachment() as SocketAttachment | null)?.allowed !==
  true

/** A stream edit lock: held by one user, renewed by the holder's lockStream and saves (F-64). */
type StreamLock = { userId: number; scheduleId: number; renewedAt: number }

/**
 * A lock nobody renewed for this long is released by the next lock call on the schedule (KV-30).
 * The open Edit dialog renews it every minute; a closed tab releases it at once (`webSocketClose`).
 * Lazy, not an alarm: tests freeze `Date.now()`, so an alarm set from it would lie in the past.
 */
export const STREAM_LOCK_TTL_MS = 3 * 60_000
const LOCK_PREFIX = 'lock:'

/** The user a socket's token was issued to (`streamDraftWS` att), or null. */
const socketUserId = (websocket: WebSocket) => {
  try {
    const att = toDurableIteratorWebsocket(websocket)['~orpc'].deserializeTokenPayload().att
    return (att as { userId?: number } | undefined)?.userId ?? null
  } catch {
    return null
  }
}

/**
 * Durable Object for Schedule Editing WebSocket stream.
 * Stores latest init snapshot and publishes events to connected clients via DEI.
 *
 * Access: every subscribe, including each reconnect with a still-valid token, checks in
 * D1 that the token's user may still edit the schedule. Without access the socket gets one
 * `access_revoked` event, no snapshot, and is closed. Tokens live 5 minutes (`streamDraftWS`)
 * and the client renews them through the same access check, so an open socket of a removed
 * editor stops receiving events at the latest when its token expires.
 */
export class ScheduleEditingObject extends DurableIteratorObject<EditChannelMessage> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {
      signingKey: env.ORPC_DEI_SIGNING_KEY,
      onSubscribed: async (websocket, lastEventId) => {
        const att = websocket['~orpc'].deserializeTokenPayload().att
        if (!att) return
        const { userId, scheduleId } = att as any
        if (!scheduleId || !userId) return

        const db = getDB(env)
        const snapshot = await loadDraftSnapshotFor(db, scheduleId, userId)
        if (!snapshot) {
          this.publishEvent(
            {
              scheduleId,
              editorId: userId,
              event: 'access_revoked',
              payload: {},
            },
            { targets: [websocket] },
          )
          websocket.close(ACCESS_REVOKED_CLOSE_CODE, 'Access revoked')
          return
        }
        websocket.serializeAttachment({ allowed: true } satisfies SocketAttachment)
        // The locks held right now, so a new editor sees who is editing what (F-64)
        const locks = await this.liveLocks()
        const initPayload = normalizeInitPayloadDates({
          ...snapshot,
          // Ensure streams include lock metadata required by DraftStreamSchema
          streams: snapshot.streams.map((s: any) => ({
            ...s,
            lockedBy: locks.get(s.id)?.userId ?? s.lockedBy ?? null,
          })),
        } as any)
        this.publishEvent(
          { scheduleId, editorId: userId, event: 'init', payload: initPayload },
          {
            targets: [websocket],
          },
        )
      },
    })
  }

  public async publishInit(
    scheduleId: number,
    editorId: number,
    payload: InitPayload,
  ): Promise<Response> {
    await this.writeSnapshot(payload)
    return this.publish({ scheduleId, editorId, event: 'init', payload })
  }

  async publishScheduleUpdated(
    scheduleId: number,
    editorId: number,
    payload: ScheduleUpdatedPayload,
  ) {
    return this.publish({
      scheduleId,
      editorId,
      event: 'schedule_updated',
      payload,
    })
  }

  async publishStreamAdded(
    scheduleId: number,
    editorId: number,
    payload: StreamAddedPayload,
  ) {
    return this.publish({
      scheduleId,
      editorId,
      event: 'stream_added',
      payload,
    })
  }

  async publishStreamUpdated(
    scheduleId: number,
    editorId: number,
    payload: StreamUpdatedPayload,
  ) {
    return this.publish({
      scheduleId,
      editorId,
      event: 'stream_updated',
      payload,
    })
  }

  async publishStreamUpdatedWithDetails(
    scheduleId: number,
    editorId: number,
    payload: StreamUpdatedWithDetailPayload,
  ) {
    return this.publish({
      scheduleId,
      editorId,
      event: 'stream_updated_with_details',
      payload,
    })
  }

  /** One `stream_updated_with_details` event per payload, in order (one RPC for a bulk save). */
  async publishStreamsUpdatedWithDetails(
    scheduleId: number,
    editorId: number,
    payloads: StreamUpdatedWithDetailPayload[],
  ) {
    let response = new Response('ok')
    for (const payload of payloads) {
      const res = await this.publishStreamUpdatedWithDetails(
        scheduleId,
        editorId,
        payload,
      )
      if (!res.ok) response = res
    }
    return response
  }

  async publishStreamDeleted(
    scheduleId: number,
    editorId: number,
    payload: StreamDeletedPayload,
  ) {
    return this.publish({
      scheduleId,
      editorId,
      event: 'stream_deleted',
      payload,
    })
  }

  async publishTagAdded(
    scheduleId: number,
    editorId: number,
    payload: TagAddedPayload,
  ) {
    return this.publish({ scheduleId, editorId, event: 'tag_added', payload })
  }

  async publishTagRemoved(
    scheduleId: number,
    editorId: number,
    payload: TagRemovedPayload,
  ) {
    return this.publish({ scheduleId, editorId, event: 'tag_removed', payload })
  }

  async publishParticipantAdded(
    scheduleId: number,
    editorId: number,
    payload: ParticipantAddedPayload,
  ) {
    return this.publish({
      scheduleId,
      editorId,
      event: 'participant_added',
      payload,
    })
  }

  async publishParticipantRemoved(
    scheduleId: number,
    editorId: number,
    payload: ParticipantRemovedPayload,
  ) {
    return this.publish({
      scheduleId,
      editorId,
      event: 'participant_removed',
      payload,
    })
  }

  async publishDraftPublished(
    scheduleId: number,
    editorId: number,
    payload: DraftPublishedPayload,
  ) {
    return this.publish({
      scheduleId,
      editorId,
      event: 'draft_published',
      payload,
    })
  }

  async publishDraftDiscarded(
    scheduleId: number,
    editorId: number,
    payload: DraftDiscardedPayload,
  ) {
    return this.publish({
      scheduleId,
      editorId,
      event: 'draft_discarded',
      payload,
    })
  }

  async publishLock(
    scheduleId: number,
    editorId: number,
    payload: LockPayload,
  ) {
    return this.publish({ scheduleId, editorId, event: 'lock', payload })
  }

  async publishUnlock(
    scheduleId: number,
    editorId: number,
    payload: UnlockPayload,
  ) {
    return this.publish({ scheduleId, editorId, event: 'unlock', payload })
  }

  // Stream edit locks (F-64, KV-30). The object is single-threaded and its storage strongly
  // consistent, so each method below is atomic; storage calls don't let other requests in.

  /**
   * Takes the lock, or renews it when the user holds it already. Another user's lock is
   * reported as `held` with its holder.
   */
  async acquireStreamLock(
    scheduleId: number,
    streamId: number,
    userId: number,
  ): Promise<{ status: 'acquired' | 'renewed' } | { status: 'held'; holder: number }> {
    const lock = (await this.liveLocks()).get(streamId)
    if (lock && lock.userId !== userId) return { status: 'held', holder: lock.userId }
    await this.storage.put<StreamLock>(LOCK_PREFIX + streamId, {
      userId,
      scheduleId,
      renewedAt: Date.now(),
    })
    return { status: lock ? 'renewed' : 'acquired' }
  }

  /** Releases the user's lock: `none` when the stream is unlocked, `held` when another user has it. */
  async releaseStreamLock(
    streamId: number,
    userId: number,
  ): Promise<'released' | 'none' | 'held'> {
    const lock = (await this.liveLocks()).get(streamId)
    if (!lock) return 'none'
    if (lock.userId !== userId) return 'held'
    await this.storage.delete(LOCK_PREFIX + streamId)
    return 'released'
  }

  /** The user holding the stream's lock, or null. A check by the holder (a save) renews it. */
  async streamLockHolder(streamId: number, userId: number): Promise<number | null> {
    const lock = (await this.liveLocks()).get(streamId)
    if (!lock) return null
    if (lock.userId === userId)
      await this.storage.put<StreamLock>(LOCK_PREFIX + streamId, {
        ...lock,
        renewedAt: Date.now(),
      })
    return lock.userId
  }

  /** A closed tab: the user's last socket releases their locks at once (KV-30). */
  async webSocketClose(
    websocket: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ) {
    super.webSocketClose(websocket, code, reason, wasClean)
    await this.releaseLocksOfClosed(websocket)
  }

  async webSocketError(websocket: WebSocket) {
    await this.releaseLocksOfClosed(websocket)
  }

  private get storage() {
    return this.ctx['~orpc'].original.storage
  }

  /** The unexpired locks by stream id. Expired ones are released, each with an `unlock` event. */
  private async liveLocks() {
    const now = Date.now()
    const locks = new Map<number, StreamLock>()
    for (const [key, lock] of await this.storage.list<StreamLock>({
      prefix: LOCK_PREFIX,
    })) {
      const streamId = Number(key.slice(LOCK_PREFIX.length))
      if (now - lock.renewedAt >= STREAM_LOCK_TTL_MS)
        await this.releaseWithEvent(streamId, lock)
      else locks.set(streamId, lock)
    }
    return locks
  }

  private async releaseWithEvent(streamId: number, lock: StreamLock) {
    await this.storage.delete(LOCK_PREFIX + streamId)
    await this.publish({
      scheduleId: lock.scheduleId,
      editorId: lock.userId,
      event: 'unlock',
      payload: { streamId, userId: lock.userId },
    })
  }

  /** Releases the locks of the closed socket's user, unless they still have another socket open. */
  private async releaseLocksOfClosed(closed: WebSocket) {
    const userId = socketUserId(closed)
    if (userId === null) return
    const stillOpen = this.ctx
      .getWebSockets()
      .some(
        (ws) =>
          ws['~orpc'].original !== closed &&
          ws.readyState === WebSocket.OPEN &&
          socketUserId(ws) === userId,
      )
    if (stillOpen) return
    for (const [streamId, lock] of await this.liveLocks())
      if (lock.userId === userId) await this.releaseWithEvent(streamId, lock)
  }

  private async writeSnapshot(snapshot: InitPayload) {
    await this.ctx['~orpc'].original.storage.put('snapshot', snapshot)
    await this.ctx['~orpc'].original.storage.put(
      'snapshotUpdatedAt',
      Date.now(),
    )
  }

  private async publish(event: EditChannelMessage): Promise<Response> {
    try {
      this.publishEvent(event, { exclude: notAllowed })
      return new Response('ok')
    } catch (err) {
      console.warn('[ScheduleEditingObject] publish failed', err)
      return new Response('error', { status: 500 })
    }
  }
}
