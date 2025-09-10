import {implement} from '@orpc/server'
import {dbMiddleware} from '../../../middleware/dbMiddleware.ts'
import {authMiddleware} from '../../../middleware/authMiddleware.ts'
import {
  discardDraftContract,
  getDraftSnapshotContract,
  publishDraftContract,
  startEditingSessionContract,
  upsertScheduleMetaContract
} from './contract.ts'
import {scheduleOwnerOrEditorMiddleware} from '../middleware.ts'
import {scheduleEditingEventPublisher} from '../eventPublisher.ts'
import {ensureDraftInitialized} from '../utils.ts'
import {and, eq, inArray, sql} from 'drizzle-orm'
import {schedulesTable, streamParticipantsTable, streamsTable} from '../../../../db/schema/jj-schema.ts'
import {editSchedulesTable} from '../../../../db/schema/edit-schedules-schema.ts'
import {editStreamsTable} from '../../../../db/schema/edit-streams-schema.ts'
import {editStreamParticipantsTable} from '../../../../db/schema/edit-stream-participants-schema.ts'
import {editStreamTagsTable} from '../../../../db/schema/edit-stream-tags-schema.ts'
import {streamTagsTable} from '../../../../db/schema/tags-schema.ts'

const os = implement({
  startEditingSessionContract,
  getDraftSnapshotContract,
  upsertScheduleMetaContract,
  publishDraftContract,
  discardDraftContract,
}).use(dbMiddleware)

const startEditingSession = os.startEditingSessionContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({context, input}) => {
    const editorId = context.userId
    const {scheduleId} = input
    const draftCreated = await ensureDraftInitialized(context.db, scheduleId, editorId)
    // scheduleEditingEventPublisher.scheduleUpdated(scheduleId, editorId, { draftCreated })
    return { scheduleId, editorId, draftCreated }
  })

/*
const getDraftSnapshot = os.getDraftSnapshotContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const {scheduleId} = input
    await ensureDraftInitialized(db, scheduleId, context.userId)
    const snapshot = await loadDraftSnapshot(db, scheduleId)
    return snapshot
  })
*/

const upsertScheduleMeta = os.upsertScheduleMetaContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, title, slug, year, visible } = input

    await db.insert(editSchedulesTable)
      .values({ scheduleId, editorId })
      .onConflictDoNothing()
      .run()

    const patch: Record<string, any> = { editorId, updatedAt: sql`(unixepoch())` }
    if (title !== undefined) patch.title = title
    if (slug !== undefined) patch.slug = slug
    if (year !== undefined) patch.year = year
    if (visible !== undefined) patch.visible = visible

    await db.update(editSchedulesTable)
      .set(patch as any)
      .where(eq(editSchedulesTable.scheduleId, scheduleId))
      .run()

    scheduleEditingEventPublisher.scheduleUpdated(scheduleId, editorId, { patch })

    const row = await db.select({ updatedAt: editSchedulesTable.updatedAt })
      .from(editSchedulesTable)
      .where(eq(editSchedulesTable.scheduleId, scheduleId))
      .get()

    return { updatedAt: row?.updatedAt ?? new Date() }
  })

const publishDraft = os.publishDraftContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId } = input

    const draftMeta = await db.select().from(editSchedulesTable).where(eq(editSchedulesTable.scheduleId, scheduleId)).get()
    if (draftMeta) {
      const metaPatch: Record<string, any> = {}
      if (draftMeta.title != null) metaPatch.title = draftMeta.title
      if (draftMeta.slug != null) metaPatch.slug = draftMeta.slug
      if (draftMeta.year != null) metaPatch.year = draftMeta.year
      if (draftMeta.visible != null) metaPatch.visible = draftMeta.visible
      if (Object.keys(metaPatch).length > 0) {
        await db.update(schedulesTable).set(metaPatch as any).where(eq(schedulesTable.id, scheduleId)).run()
      }
    }

    const draftStreams = await db.select().from(editStreamsTable).where(eq(editStreamsTable.scheduleId, scheduleId)).all()
    const canonStreams = await db.select().from(streamsTable).where(eq(streamsTable.scheduleId, scheduleId)).all()

    const canonIdSet = new Set(canonStreams.map(s => s.id))
    const maxCanonId = canonStreams.reduce((m, s) => Math.max(m, s.id), 0)

    const idMap = new Map<number, number>()
    let nextId = maxCanonId + 1
    for (const ds of draftStreams) {
      if (ds.id <= 0) {
        idMap.set(ds.id, nextId++)
      } else {
        idMap.set(ds.id, ds.id)
      }
    }

    const finalIds = new Set(Array.from(idMap.values()))

    let created = 0, updated = 0, deleted = 0

    for (const ds of draftStreams) {
      const finalId = idMap.get(ds.id)!
      const exists = canonIdSet.has(finalId)
      const values = {
        id: finalId,
        scheduleId,
        createdBy: ds.createdBy,
        title: ds.title,
        visible: ds.visible,
        subtitle: ds.subtitle ?? null,
        description: ds.description ?? null,
        youtubeVodUrl: ds.youtubeVodUrl ?? null,
        twitchVodUrl: ds.twitchVodUrl ?? null,
        start: ds.start,
        end: ds.end,
      }
      if (exists) {
        const res = await db.update(streamsTable)
          .set(values as any)
          .where(and(eq(streamsTable.scheduleId, scheduleId), eq(streamsTable.id, finalId)))
          .run()
        if ((res as any).rowsAffected > 0) updated++
      } else {
        await db.insert(streamsTable).values(values as any).run()
        canonIdSet.add(finalId)
        created++
      }
    }

    const toDelete = canonStreams.filter(s => !finalIds.has(s.id)).map(s => s.id)
    if (toDelete.length > 0) {
      await db.delete(streamsTable)
        .where(and(eq(streamsTable.scheduleId, scheduleId), inArray(streamsTable.id, toDelete)))
        .run()
      deleted += toDelete.length
    }

    const prevParticipants = await db.select({u: streamParticipantsTable.userId})
      .from(streamParticipantsTable)
      .where(eq(streamParticipantsTable.scheduleId, scheduleId))
      .all()
    let removedParticipants = prevParticipants.length

    await db.delete(streamParticipantsTable).where(eq(streamParticipantsTable.scheduleId, scheduleId)).run()

    const draftParts = await db.select().from(editStreamParticipantsTable).where(eq(editStreamParticipantsTable.scheduleId, scheduleId)).all()
    let addedParticipants = 0
    if (draftParts.length > 0) {
      const values = draftParts.map(p => ({
        scheduleId,
        streamId: idMap.get(p.streamId)!,
        userId: p.userId,
      }))
      for (const chunk of [values]) {
        if (chunk.length > 0) {
          await db.insert(streamParticipantsTable).values(chunk as any).run()
          addedParticipants += chunk.length
        }
      }
    }

    const prevTags = await db.select({t: streamTagsTable.tagId})
      .from(streamTagsTable)
      .where(eq(streamTagsTable.scheduleId, scheduleId))
      .all()
    let removedTags = prevTags.length

    await db.delete(streamTagsTable).where(eq(streamTagsTable.scheduleId, scheduleId)).run()

    const draftTags = await db.select().from(editStreamTagsTable).where(eq(editStreamTagsTable.scheduleId, scheduleId)).all()
    let addedTags = 0
    if (draftTags.length > 0) {
      const tagValues = draftTags.map(t => ({
        scheduleId,
        streamId: idMap.get(t.streamId)!,
        tagId: t.tagId,
        addedAt: t.addedAt,
      }))
      for (const chunk of [tagValues]) {
        if (chunk.length > 0) {
          await db.insert(streamTagsTable).values(chunk).run()
          addedTags += chunk.length
        }
      }
    }

    await db.update(schedulesTable).set({ updatedAt: sql`(unixepoch())` } as any).where(eq(schedulesTable.id, scheduleId)).run()

    await db.update(editSchedulesTable).set({ status: 'published', updatedAt: sql`(unixepoch())` } as any)
      .where(eq(editSchedulesTable.scheduleId, scheduleId)).run()
    await db.delete(editStreamParticipantsTable).where(eq(editStreamParticipantsTable.scheduleId, scheduleId)).run()
    await db.delete(editStreamTagsTable).where(eq(editStreamTagsTable.scheduleId, scheduleId)).run()
    await db.delete(editStreamsTable).where(eq(editStreamsTable.scheduleId, scheduleId)).run()

    const publishedAt = new Date()
    scheduleEditingEventPublisher.published(scheduleId, editorId, { })

    return {
      publishedAt,
      changes: {
        streams: { created, updated, deleted },
        participants: { added: addedParticipants, removed: removedParticipants },
        tags: { added: addedTags, removed: removedTags },
      }
    }
  })

const discardDraft = os.discardDraftContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId } = input

    await db.update(editSchedulesTable)
      .set({ status: 'discarded', updatedAt: sql`(unixepoch())` } as any)
      .where(eq(editSchedulesTable.scheduleId, scheduleId))
      .run()

    await db.delete(editStreamParticipantsTable).where(eq(editStreamParticipantsTable.scheduleId, scheduleId)).run()
    await db.delete(editStreamTagsTable).where(eq(editStreamTagsTable.scheduleId, scheduleId)).run()
    await db.delete(editStreamsTable).where(eq(editStreamsTable.scheduleId, scheduleId)).run()

    scheduleEditingEventPublisher.discarded(scheduleId, editorId)
    return { ok: true as const }
  })

export const scheduleMetaRouter = {
  startEditingSession,
  // getDraftSnapshot,
  upsertScheduleMeta,
  publishDraft,
  discardDraft,
}
