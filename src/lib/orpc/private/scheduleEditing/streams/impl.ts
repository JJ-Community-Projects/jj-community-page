import { implement } from '@orpc/server'
import { dbMiddleware } from '../../../middleware/dbMiddleware.ts'
import { authMiddleware } from '../../../middleware/authMiddleware.ts'
import { contracts } from './contract.ts'
import { scheduleOwnerOrEditorMiddleware } from '../middleware.ts'
import { scheduleEditingEventPublisher } from '../eventPublisher.ts'
import { ensureDraftInitialized } from '../utils.ts'
import {
  assertStreamLockAvailableOrOwned,
  lockStreamEditing,
  unlockStreamEditing,
} from '../streamEditingLock.ts'
import { and, count, eq, gte, inArray, lt, sql } from 'drizzle-orm'
import { editStreamsTable } from '../../../../db/schema/edit-streams-schema.ts'
import { editStreamParticipantsTable } from '../../../../db/schema/edit-stream-participants-schema.ts'
import { editStreamTagsTable } from '../../../../db/schema/edit-stream-tags-schema.ts'
import { tags as tagsTable } from '../../../../db/schema/tags-schema.ts'
import { userDisplayView } from '../../../../db/schema/views-schema.ts'
import type { BatchItem } from 'drizzle-orm/batch'
import type { StreamUpdatedWithDetailPayload } from '../scheduleEditingTypes.ts'

const os = implement(contracts).use(dbMiddleware)

export const addStream = os.addStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const {
      scheduleId,
      title,
      start,
      end,
      visible,
      subtitle,
      description,
      youtubeVodUrl,
      twitchVodUrl,
    } = input

    await ensureDraftInitialized(db, scheduleId, editorId)

    const existingIds = await db
      .select({ id: editStreamsTable.id })
      .from(editStreamsTable)
      .where(eq(editStreamsTable.scheduleId, scheduleId))
      .all()
    const nonNegSet = new Set(
      existingIds
        .map((r: any) => Number(r.id))
        .filter((id) => Number.isFinite(id) && id >= 0),
    )

    let smallestAvailable = 0
    while (nonNegSet.has(smallestAvailable)) {
      smallestAvailable += 1
    }
    const id = smallestAvailable
    const stream = {
      id,
      scheduleId,
      createdBy: editorId,
      title: title.length === 0 ? `Stream ${id}` : title,
      start,
      end,
      visible: visible ?? false,
      subtitle: subtitle ?? null,
      description: description ?? null,
      youtubeVodUrl: youtubeVodUrl ?? null,
      twitchVodUrl: twitchVodUrl ?? null,
      lockedBy: null,
    }
    await db.insert(editStreamsTable).values(stream).run()

    scheduleEditingEventPublisher.streamAdded(scheduleId, editorId, stream)
    return { id }
  })

export const updateStream = os.updateStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, id, patch } = input

    // Lock check: stream must be unlocked or locked by current user
    await assertStreamLockAvailableOrOwned(
      context.env,
      scheduleId,
      id,
      editorId,
    )

    const allowed: any = {}
    const keys = [
      'title',
      'visible',
      'subtitle',
      'description',
      'youtubeVodUrl',
      'twitchVodUrl',
      'start',
      'end',
    ] as const
    for (const k of keys) {
      if (k in patch && (patch as any)[k] !== undefined)
        (allowed as any)[k] = (patch as any)[k]
    }
    ;(allowed as any).updatedAt = sql`(unixepoch()
                                     )`

    const res = await db
      .update(editStreamsTable)
      .set(allowed)
      .where(
        and(
          eq(editStreamsTable.scheduleId, scheduleId),
          eq(editStreamsTable.id, id),
        ),
      )
      .run()

    if ((res as any).rowsAffected === 0) {
      throw new Error('Draft stream not found')
    }

    scheduleEditingEventPublisher.streamUpdated(scheduleId, editorId, id, {
      id,
      patch: allowed,
    })

    const row = await db
      .select({ updatedAt: editStreamsTable.updatedAt })
      .from(editStreamsTable)
      .where(
        and(
          eq(editStreamsTable.scheduleId, scheduleId),
          eq(editStreamsTable.id, id),
        ),
      )
      .get()

    return { updatedAt: row?.updatedAt ?? new Date() }
  })

export const deleteStream = os.deleteStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, id } = input

    // Lock check: stream must be unlocked or locked by current user
    await assertStreamLockAvailableOrOwned(
      context.env,
      scheduleId,
      id,
      editorId,
    )

    const res = await db
      .delete(editStreamsTable)
      .where(
        and(
          eq(editStreamsTable.scheduleId, scheduleId),
          eq(editStreamsTable.id, id),
        ),
      )
      .run()

    if ((res as any).rowsAffected === 0) {
      throw new Error('Draft stream not found')
    }

    scheduleEditingEventPublisher.streamDeleted(scheduleId, editorId, id)
    return { ok: true as const }
  })

export const updateStreams = os.updateStreamsContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, updates } = input

    const results: { id: number; updatedAt: Date }[] = []

    for (const { id, patch } of updates) {
      // Lock check per stream
      await assertStreamLockAvailableOrOwned(
        context.env,
        scheduleId,
        id,
        editorId,
      )

      const allowed: any = {}
      const keys = [
        'title',
        'visible',
        'subtitle',
        'description',
        'youtubeVodUrl',
        'twitchVodUrl',
        'start',
        'end',
      ] as const
      for (const k of keys) {
        if (k in patch && (patch as any)[k] !== undefined)
          (allowed as any)[k] = (patch as any)[k]
      }
      ;(allowed as any).updatedAt = sql`(unixepoch()
                                        )`

      const res = await db
        .update(editStreamsTable)
        .set(allowed)
        .where(
          and(
            eq(editStreamsTable.scheduleId, scheduleId),
            eq(editStreamsTable.id, id),
          ),
        )
        .run()

      if ((res as any).rowsAffected === 0) {
        throw new Error('Draft stream not found')
      }

      // Publish per-item update event
      scheduleEditingEventPublisher.streamUpdated(scheduleId, editorId, id, {
        id,
        patch: allowed,
      })

      const row = await db
        .select({ updatedAt: editStreamsTable.updatedAt })
        .from(editStreamsTable)
        .where(
          and(
            eq(editStreamsTable.scheduleId, scheduleId),
            eq(editStreamsTable.id, id),
          ),
        )
        .get()

      results.push({ id, updatedAt: row?.updatedAt ?? new Date() })
    }

    return { updated: results }
  })

export const deleteStreams = os.deleteStreamsContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, ids } = input

    const deletedIds: number[] = []

    for (const id of ids) {
      // Lock check per stream
      await assertStreamLockAvailableOrOwned(
        context.env,
        scheduleId,
        id,
        editorId,
      )

      const res = await db
        .delete(editStreamsTable)
        .where(
          and(
            eq(editStreamsTable.scheduleId, scheduleId),
            eq(editStreamsTable.id, id),
          ),
        )
        .run()

      if ((res as any).rowsAffected === 0) {
        throw new Error('Draft stream not found')
      }

      scheduleEditingEventPublisher.streamDeleted(scheduleId, editorId, id)
      deletedIds.push(id)
    }

    return { ok: true as const, deletedIds }
  })

export const lockStream = os.lockStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const { scheduleId, streamId } = input
    const userId = context.userId
    await lockStreamEditing(context.env, scheduleId, streamId, userId)
    // Publish lock event to SSE subscribers
    scheduleEditingEventPublisher.lock(scheduleId, userId, streamId, userId)
    return { ok: true as const }
  })

export const unlockStream = os.unlockStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const { scheduleId, streamId } = input
    const userId = context.userId
    await unlockStreamEditing(context.env, scheduleId, streamId, userId)
    // Publish unlock event to SSE subscribers
    scheduleEditingEventPublisher.unlock(scheduleId, userId, streamId, userId)
    return { ok: true as const }
  })

/*
export const addStreamWithDetails = os.addStreamWithDetailsContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const editorId = context.userId
    const {
      scheduleId,
      title,
      start,
      end,
      visible,
      subtitle,
      description,
      youtubeVodUrl,
      twitchVodUrl,
      participants,
      tags,
    } = input

    // Initialize draft state if needed
    await ensureDraftInitialized(db, scheduleId, editorId)

    // Compute smallest non-negative ID (same as addStream)
    const existingIds = await db.select({id: editStreamsTable.id})
      .from(editStreamsTable)
      .where(eq(editStreamsTable.scheduleId, scheduleId))
      .all()
    const nonNegSet = new Set(
      existingIds.map((r: any) => Number(r.id)).filter((id) => Number.isFinite(id) && id >= 0)
    )
    let newId = 0
    while (nonNegSet.has(newId)) newId += 1

    const stream = {
      id: newId,
      scheduleId,
      createdBy: editorId,
      title: title.length === 0 ? `Stream ${newId}` : title,
      start,
      end,
      visible: visible ?? false,
      subtitle: subtitle ?? null,
      description: description ?? null,
      youtubeVodUrl: youtubeVodUrl ?? null,
      twitchVodUrl: twitchVodUrl ?? null,
      lockedBy: null,
    }


    await db.insert(editStreamsTable).values(stream).run()

    // Emit stream_added so clients can create the stream shell before details
    scheduleEditingEventPublisher.streamAdded(scheduleId, editorId, stream)

    // Attach participants
    const participantsAdded: number[] = []
    if (participants?.length) {
      for (const userId of participants) {
        await db.insert(editStreamParticipantsTable)
          .values({scheduleId, streamId: newId, userId})
          .onConflictDoNothing()
          .run()
        participantsAdded.push(userId)
      }
    }

    // Attach tags
    const tagsAdded: Array<{ id: number; slug: string; name: string }> = []
    if (tags?.length) {
      for (const t of tags) {
        const tag = await resolveTag(db, t.value, editorId, !!t.createIfMissing)
        await db.insert(editStreamTagsTable)
          .values({scheduleId, streamId: newId, id: tag.id})
          .onConflictDoNothing()
          .run()
        scheduleEditingEventPublisher.tagAdded(scheduleId, editorId, newId, tag.id, {
          streamId: newId,
          id: tag.id,
          slug: tag.slug,
          name: tag.name,
        })
        tagsAdded.push({id: tag.id, slug: tag.slug, name: tag.name})
      }
    }

    return {id: newId, participantsAdded, tagsAdded}
  })
*/

export const canAddStream = os.canAddStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const { scheduleId, date } = input
    // Compute UTC day start/end
    const y = date.getUTCFullYear()
    const m = date.getUTCMonth()
    const d = date.getUTCDate()
    const startOfDay = new Date(Date.UTC(y, m, d, 0, 0, 0, 0))
    const endOfDay = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0))

    const res = await db
      .select({ c: count() })
      .from(editStreamsTable)
      .where(
        and(
          eq(editStreamsTable.scheduleId, scheduleId),
          gte(editStreamsTable.start, startOfDay as any),
          lt(editStreamsTable.start, endOfDay as any),
        ),
      )
      .get()
    const streams = (res?.c as number) ?? 0
    return { canAdd: streams < 8, streams, date }
  })

export const updateStreamWithDetails = os.updateStreamWithDetailsContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, id: streamId, patch, participants, tags } = input

    // Lock check: stream must be unlocked or locked by current user
    await assertStreamLockAvailableOrOwned(
      context.env,
      scheduleId,
      streamId,
      editorId,
    )

    const batch: BatchItem<'sqlite'>[] = []

    // Build allowed patch for base fields
    let allowedPatch: Record<string, unknown> | undefined
    if (patch && Object.keys(patch).length > 0) {
      const allowed: any = {}
      const keys = [
        'title',
        'visible',
        'subtitle',
        'description',
        'youtubeVodUrl',
        'twitchVodUrl',
        'start',
        'end',
      ] as const
      for (const k of keys) {
        if (k in patch && (patch as any)[k] !== undefined) {
          ;(allowed as any)[k] = (patch as any)[k]
        }
      }
      if (Object.keys(allowed).length > 0) {
        allowedPatch = { ...allowed }
        ;(allowed as any).updatedAt = sql`(unixepoch()
                                          )`
        batch.push(
          db
            .update(editStreamsTable)
            .set(allowed)
            .where(
              and(
                eq(editStreamsTable.scheduleId, scheduleId),
                eq(editStreamsTable.id, streamId),
              ),
            ),
        )
      }
    }

    // 2) Synchronize participants if desired set provided
    if (participants !== undefined) {
      const currentRows = await db
        .select({ userId: editStreamParticipantsTable.userId })
        .from(editStreamParticipantsTable)
        .where(
          and(
            eq(editStreamParticipantsTable.scheduleId, scheduleId),
            eq(editStreamParticipantsTable.streamId, streamId),
          ),
        )
        .all()
      const current = new Set(currentRows.map((r) => r.userId))
      const desired = new Set(participants)

      const toRemove = [...current].filter((u) => !desired.has(u))
      const toAdd = participants.filter((u) => !current.has(u))

      // Removals first
      for (const userId of toRemove) {
        batch.push(
          db
            .delete(editStreamParticipantsTable)
            .where(
              and(
                eq(editStreamParticipantsTable.scheduleId, scheduleId),
                eq(editStreamParticipantsTable.streamId, streamId),
                eq(editStreamParticipantsTable.userId, userId),
              ),
            ),
        )
      }

      // Additions next
      for (const userId of toAdd) {
        batch.push(
          db
            .insert(editStreamParticipantsTable)
            .values({ scheduleId, streamId: streamId, userId })
            .onConflictDoNothing(),
        )
      }
    }

    // 3) Synchronize tags if desired set provided
    if (tags !== undefined) {
      // 'tags' is a list of existing tag IDs. Regular users cannot create tags here.
      const existing = await db
        .select({ id: editStreamTagsTable.tagId })
        .from(editStreamTagsTable)
        .where(
          and(
            eq(editStreamTagsTable.scheduleId, scheduleId),
            eq(editStreamTagsTable.streamId, streamId),
          ),
        )
        .all()

      const currentids = new Set(existing.map((r) => r.id))
      const desiredids = new Set(tags)

      console.log('currentids', currentids)
      console.log('desiredids', desiredids)

      // Validate all desired tag IDs actually exist
      const desiredIdsArr = Array.from(desiredids)
      if (desiredIdsArr.length > 0) {
        const rows = await db
          .select({ id: tagsTable.id })
          .from(tagsTable)
          .where(inArray(tagsTable.id, desiredIdsArr))
          .all()
        const foundIds = new Set(rows.map((r) => r.id))
        const unknown = desiredIdsArr.filter((id_) => !foundIds.has(id_))
        if (unknown.length > 0) {
          throw new Error(`Unknown tag IDs: ${unknown.join(', ')}`)
        }
      }

      const idsToRemove = [...currentids].filter((id_) => !desiredids.has(id_))
      const idsToAdd = desiredIdsArr.filter((id_) => !currentids.has(id_))

      console.log('idsToRemove', idsToRemove)
      console.log('idsToAdd', idsToAdd)
      // Removals first
      for (const id of idsToRemove) {
        batch.push(
          db
            .delete(editStreamTagsTable)
            .where(
              and(
                eq(editStreamTagsTable.scheduleId, scheduleId),
                eq(editStreamTagsTable.streamId, streamId),
                eq(editStreamTagsTable.tagId, id),
              ),
            ),
        )
      }

      // Additions next
      for (const id of idsToAdd) {
        batch.push(
          db
            .insert(editStreamTagsTable)
            .values({ scheduleId, streamId: streamId, tagId: id })
            .onConflictDoNothing(),
        )
      }
    }

    // Execute batch if there is any operation
    try {
      if (batch.length > 0) {
        await db.batch(batch as any)
      }
    } catch (e) {
      console.error('updateStreamWithDetails', 'batch', e)
    }

    // Publish consolidated update event for UI
    const payload: StreamUpdatedWithDetailPayload = { id: streamId }
    if (allowedPatch && Object.keys(allowedPatch).length > 0)
      payload.patch = allowedPatch

    if (tags !== undefined) {
      const finalTags = await db
        .select({
          id: tagsTable.id,
          name: tagsTable.name,
          slug: tagsTable.slug,
        })
        .from(editStreamTagsTable)
        .innerJoin(tagsTable, eq(editStreamTagsTable.tagId, tagsTable.id))
        .where(
          and(
            eq(editStreamTagsTable.scheduleId, scheduleId),
            eq(editStreamTagsTable.streamId, streamId),
          ),
        )
        .all()
      payload.tags = finalTags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
      }))
    }

    if (participants !== undefined) {
      payload.participants = await db
        .select({
          userId: userDisplayView.userId,
          primaryLiveStream: userDisplayView.primaryLiveStream,
          createdAt: userDisplayView.createdAt,
          username: userDisplayView.username,
          profileImage: userDisplayView.profileImage,
          twitchLogin: userDisplayView.twitchLogin,
          tiltifySlug: userDisplayView.tiltifySlug,
          tiltifyUrl: userDisplayView.tiltifyUrl,
          primaryColor: userDisplayView.primaryColor,
          accentColor: userDisplayView.accentColor,
        })
        .from(editStreamParticipantsTable)
        .innerJoin(
          userDisplayView,
          eq(editStreamParticipantsTable.userId, userDisplayView.userId),
        )
        .where(
          and(
            eq(editStreamParticipantsTable.scheduleId, scheduleId),
            eq(editStreamParticipantsTable.streamId, streamId),
          ),
        )
        .all()
    }

    console.log('payload', payload)

    scheduleEditingEventPublisher.streamUpdatedWithDetails(
      scheduleId,
      editorId,
      payload,
    )
  })

export const streamsRouter = {
  addStream,
  updateStream,
  updateStreams,
  deleteStream,
  deleteStreams,
  lockStream,
  unlockStream,
  // addStreamWithDetails,
  updateStreamWithDetails,

  // Limit-checks
  canAddStream,
}
