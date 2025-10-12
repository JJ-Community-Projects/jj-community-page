import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../../middleware/dbMiddleware.ts'
import { authMiddleware } from '../../../middleware/authMiddleware.ts'
import {
  addStreamContract,
  canAddStreamContract,
  deleteStreamContract,
  deleteStreamsContract,
  lockStreamContract,
  unlockStreamContract,
  updateStreamContract,
  updateStreamsContract,
  updateStreamsWithDetailsContract,
  updateStreamWithDetailsContract,
} from './contract.ts'
import { scheduleOwnerOrEditorMiddleware } from '../middleware.ts'
import { ensureDraftInitialized } from '../utils.ts'
import {
  assertStreamLockAvailableOrOwned,
  lockStreamEditing,
  unlockStreamEditing,
} from '../streamEditingLock.ts'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { editStreamsTable } from '../../../../db/schema/edit-streams-schema.ts'
import { editStreamParticipantsTable } from '../../../../db/schema/edit-stream-participants-schema.ts'
import { editStreamTagsTable } from '../../../../db/schema/edit-stream-tags-schema.ts'
import { tags as tagsTable } from '../../../../db/schema/tags-schema.ts'
import { userDisplayView } from '../../../../db/schema/views-schema.ts'
import type { BatchItem } from 'drizzle-orm/batch'
import type { StreamUpdatedWithDetailPayload } from '../scheduleEditingTypes.ts'
import { scheduleEditingChannels } from '../channels.ts'
import { checkCanAddStreamOnDate } from '../../util/limits.ts'

const os = implement({
  addStreamContract,
  updateStreamContract,
  updateStreamsContract,
  deleteStreamContract,
  deleteStreamsContract,
  lockStreamContract,
  unlockStreamContract,
  updateStreamWithDetailsContract,
  updateStreamsWithDetailsContract,
  canAddStreamContract,
}).use(dbMiddleware)

function getScheduleEditingStub(env: Env, scheduleId: number) {
  const channelId = scheduleEditingChannels.edit(scheduleId)
  const DO = env.ScheduleEditingObject
  return DO.get(DO.idFromName(channelId))
}

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

    // Enforce per-date stream limit for the day of `start`
    const dateLimit = await checkCanAddStreamOnDate(db, scheduleId, new Date(start))
    if (!dateLimit.canAdd) {
      throw new ORPCError('FORBIDDEN', {
        message: 'Daily stream limit reached',
        ...dateLimit,
      } as any)
    }

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
    while (nonNegSet.has(smallestAvailable)) smallestAvailable += 1

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

    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    await stub.publishStreamAdded(scheduleId, editorId, stream)
    return { id }
  })

export const updateStream = os.updateStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, id, patch } = input

    await assertStreamLockAvailableOrOwned(
      context.env as any,
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
    for (const k of keys)
      if (k in patch && (patch as any)[k] !== undefined)
        (allowed as any)[k] = (patch as any)[k]
    ;(allowed as any).updatedAt = sql`(unixepoch())`

    // If changing start, enforce per-date stream limit for the new date
    if ((allowed as any).start) {
      const newDate = new Date((allowed as any).start)
      const limit = await checkCanAddStreamOnDate(db, scheduleId, newDate)
      if (!limit.canAdd) {
        throw new ORPCError('FORBIDDEN', {
          message: 'Daily stream limit reached',
          ...limit,
        } as any)
      }
    }

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

    if ((res as any).rowsAffected === 0)
      throw new Error('Draft stream not found')

    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    await stub.publishStreamUpdated(scheduleId, editorId, {
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

    if ((res as any).rowsAffected === 0)
      throw new Error('Draft stream not found')

    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    await stub.publishStreamDeleted(scheduleId, editorId, { id })
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
      await assertStreamLockAvailableOrOwned(
        context.env as any,
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
      for (const k of keys)
        if (k in patch && (patch as any)[k] !== undefined)
          (allowed as any)[k] = (patch as any)[k]
      ;(allowed as any).updatedAt = sql`(unixepoch())`

      // If changing start, enforce per-date stream limit for the new date
      if ((allowed as any).start) {
        const newDate = new Date((allowed as any).start)
        const limit = await checkCanAddStreamOnDate(db, scheduleId, newDate)
        if (!limit.canAdd) {
          throw new ORPCError('FORBIDDEN', {
            message: `Daily stream limit reached for ${newDate.toISOString().slice(0,10)} (${limit.streams}/${limit.maxStreams}).`,
            ...limit,
          } as any)
        }
      }

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

      if ((res as any).rowsAffected === 0)
        throw new Error('Draft stream not found')

      const stub = getScheduleEditingStub(context.env as any, scheduleId)
      await stub.publishStreamUpdated(scheduleId, editorId, {
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
      await assertStreamLockAvailableOrOwned(
        context.env as any,
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
      if ((res as any).rowsAffected === 0)
        throw new Error('Draft stream not found')
      const stub = getScheduleEditingStub(context.env as any, scheduleId)
      await stub.publishStreamDeleted(scheduleId, editorId, { id })
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
    await lockStreamEditing(context.env as any, scheduleId, streamId, userId)
    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    await stub.publishLock(scheduleId, userId, { streamId, userId })
    return { ok: true as const }
  })

export const unlockStream = os.unlockStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const { scheduleId, streamId } = input
    const userId = context.userId
    await unlockStreamEditing(context.env as any, scheduleId, streamId, userId)
    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    await stub.publishUnlock(scheduleId, userId, { streamId, userId })
    return { ok: true as const }
  })

export const updateStreamWithDetails = os.updateStreamWithDetailsContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, id: streamId, patch, participants, tags } = input

    await assertStreamLockAvailableOrOwned(
      context.env as any,
      scheduleId,
      streamId,
      editorId,
    )

    const batch: BatchItem<'sqlite'>[] = []

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
      for (const k of keys)
        if (k in patch && (patch as any)[k] !== undefined)
          (allowed as any)[k] = (patch as any)[k]
      if (Object.keys(allowed).length > 0) {
        allowedPatch = { ...allowed }
        ;(allowed as any).updatedAt = sql`(unixepoch())`
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
      for (const userId of toAdd) {
        batch.push(
          db
            .insert(editStreamParticipantsTable)
            .values({ scheduleId, streamId, userId })
            .onConflictDoNothing(),
        )
      }
    }

    if (tags !== undefined) {
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
      const desiredIdsArr = Array.from(desiredids)
      if (desiredIdsArr.length > 0) {
        const rows = await db
          .select({ id: tagsTable.id })
          .from(tagsTable)
          .where(inArray(tagsTable.id, desiredIdsArr))
          .all()
        const foundIds = new Set(rows.map((r) => r.id))
        const unknown = desiredIdsArr.filter((id_) => !foundIds.has(id_))
        if (unknown.length > 0)
          throw new Error(`Unknown tag IDs: ${unknown.join(', ')}`)
      }
      const idsToRemove = [...currentids].filter((id_) => !desiredids.has(id_))
      const idsToAdd = desiredIdsArr.filter((id_) => !currentids.has(id_))
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
      for (const id of idsToAdd) {
        batch.push(
          db
            .insert(editStreamTagsTable)
            .values({ scheduleId, streamId, tagId: id })
            .onConflictDoNothing(),
        )
      }
    }

    if (batch.length > 0) {
      try {
        await db.batch(batch as any)
      } catch (e) {
        console.error('updateStreamWithDetails', 'batch', e)
      }
    }

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

    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    await stub.publishStreamUpdatedWithDetails(scheduleId, editorId, payload)
  })

export const updateStreamsWithDetails = os.updateStreamsWithDetailsContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId

    const { scheduleId, streams } = input

    const payloads = []

    const batch: BatchItem<'sqlite'>[] = []

    for (const stream of streams) {
      const { id: streamId, patch, participants, tags } = stream

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
        for (const k of keys)
          if (k in patch && (patch as any)[k] !== undefined)
            (allowed as any)[k] = (patch as any)[k]
        if (Object.keys(allowed).length > 0) {
          allowedPatch = { ...allowed }
          ;(allowed as any).updatedAt = sql`(unixepoch())`
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
        for (const userId of toAdd) {
          batch.push(
            db
              .insert(editStreamParticipantsTable)
              .values({ scheduleId, streamId, userId })
              .onConflictDoNothing(),
          )
        }
      }

      if (tags !== undefined) {
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
        const desiredIdsArr = Array.from(desiredids)
        if (desiredIdsArr.length > 0) {
          const rows = await db
            .select({ id: tagsTable.id })
            .from(tagsTable)
            .where(inArray(tagsTable.id, desiredIdsArr))
            .all()
          const foundIds = new Set(rows.map((r) => r.id))
          const unknown = desiredIdsArr.filter((id_) => !foundIds.has(id_))
          if (unknown.length > 0)
            throw new Error(`Unknown tag IDs: ${unknown.join(', ')}`)
        }
        const idsToRemove = [...currentids].filter(
          (id_) => !desiredids.has(id_),
        )
        const idsToAdd = desiredIdsArr.filter((id_) => !currentids.has(id_))
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
        for (const id of idsToAdd) {
          batch.push(
            db
              .insert(editStreamTagsTable)
              .values({ scheduleId, streamId, tagId: id })
              .onConflictDoNothing(),
          )
        }
      }

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

      payloads.push(payload)
    }

    if (batch.length > 0) {
      try {
        await db.batch(batch as any)
      } catch (e) {
        console.error('updateStreamWithDetails', 'batch', e)
      }
    }
    const stub = getScheduleEditingStub(context.env, scheduleId)
    for (const payload of payloads) {
      await stub.publishStreamUpdatedWithDetails(scheduleId, editorId, payload)
    }
  })

export const canAddStream = os.canAddStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const { db } = context
    const { scheduleId, date } = input
    return checkCanAddStreamOnDate(db, scheduleId, date)
  })

export const streamsRouter = {
  addStream,
  updateStream,
  updateStreams,
  deleteStream,
  deleteStreams,
  lockStream,
  unlockStream,
  updateStreamWithDetails,
  updateStreamsWithDetails,
  // Limit-checks
  canAddStream,
}
