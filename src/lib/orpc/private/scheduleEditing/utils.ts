import {ORPCError} from '@orpc/server'
import {and, eq, inArray, sql} from 'drizzle-orm'
import type {JJDrizzleDatabase} from '../../../db/db.ts'
import {schedulesTable, streamParticipantsTable, streamsTable} from '../../../db/schema/jj-schema.ts'
import {editSchedulesTable} from '../../../db/schema/edit-schedules-schema.ts'
import {editStreamsTable} from '../../../db/schema/edit-streams-schema.ts'
import {editStreamTagsTable} from '../../../db/schema/edit-stream-tags-schema.ts'
import {editStreamParticipantsTable} from '../../../db/schema/edit-stream-participants-schema.ts'
import {streamTagsTable, tags} from '../../../db/schema/tags-schema.ts'
import {userDisplayView} from '../../../db/schema/views-schema.ts'
import {createSlug} from '../../../../functions/slug.ts'

// Type describing the result of loadDraftSnapshot
export type LoadDraftSnapshotResult = {
  schedule: Awaited<ReturnType<typeof getScheduleMeta>>
  streams: Array<typeof editStreamsTable.$inferSelect>
  tagsByStream: Record<string, Array<{ id: number; slug: string; name: string }>>
  participantsByStream: Record<string, Array<Pick<
    typeof userDisplayView.$inferSelect,
    'userId' | 'primaryLiveStream' | 'createdAt' | 'username' | 'profileImage' | 'twitchLogin' | 'tiltifySlug' | 'tiltifyUrl' | 'primaryColor' | 'accentColor'
  >>>
}

export async function getScheduleMeta(db: JJDrizzleDatabase, scheduleId: number) {
  const schedule = await db.select({
    id: schedulesTable.id,
    title: schedulesTable.title,
    slug: schedulesTable.slug,
    year: schedulesTable.year,
    visible: schedulesTable.visible,
    updatedAt: schedulesTable.updatedAt,
  }).from(schedulesTable)
    .where(eq(schedulesTable.id, scheduleId))
    .get()
  if (!schedule) throw new ORPCError('NOT_FOUND', {message: 'Schedule not found'})
  return schedule
}

export async function ensureDraftInitialized(db: JJDrizzleDatabase, scheduleId: number, editorId: number): Promise<boolean> {
  const existing = await db.select({id: editStreamsTable.id})
    .from(editStreamsTable)
    .where(eq(editStreamsTable.scheduleId, scheduleId))
    .limit(1)
    .all()
  if (existing.length > 0) {
    await db.insert(editSchedulesTable)
      .values({scheduleId, editorId})
      .onConflictDoNothing()
      .run()
    await db.update(editSchedulesTable)
      .set({ editorId, updatedAt: sql`(unixepoch())` } as any)
      .where(eq(editSchedulesTable.scheduleId, scheduleId))
      .run()
    return false
  }

  await db.insert(editSchedulesTable)
    .values({ scheduleId, editorId })
    .onConflictDoUpdate({
      target: editSchedulesTable.scheduleId,
      set: { editorId, updatedAt: sql`(unixepoch())` }
    })
    .run()

  const canonicalStreams = await db.select().from(streamsTable).where(eq(streamsTable.scheduleId, scheduleId)).all()
  if (canonicalStreams.length > 0) {
    await db.insert(editStreamsTable).values(canonicalStreams.map(s => ({
      id: s.id,
      scheduleId: s.scheduleId,
      createdBy: s.createdBy,
      title: s.title,
      visible: s.visible,
      subtitle: s.subtitle ?? null,
      description: s.description ?? null,
      youtubeVodUrl: s.youtubeVodUrl ?? null,
      twitchVodUrl: s.twitchVodUrl ?? null,
      start: s.start,
      end: s.end,
    }))).run()
  }

  const canonicalTags = await db.select().from(streamTagsTable).where(eq(streamTagsTable.scheduleId, scheduleId)).all()
  if (canonicalTags.length > 0) {
    await db.insert(editStreamTagsTable).values(canonicalTags.map(t => ({
      scheduleId: t.scheduleId,
      streamId: t.streamId,
      tagId: t.tagId,
      addedAt: t.addedAt,
    }))).run()
  }

  const canonicalParts = await db.select().from(streamParticipantsTable).where(eq(streamParticipantsTable.scheduleId, scheduleId)).all()
  if (canonicalParts.length > 0) {
    await db.insert(editStreamParticipantsTable).values(canonicalParts.map(p => ({
      scheduleId: p.scheduleId,
      streamId: p.streamId,
      userId: p.userId,
    }))).run()
  }

  return true
}

export async function loadDraftSnapshot(db: JJDrizzleDatabase, scheduleId: number): Promise<LoadDraftSnapshotResult> {
  const schedule = await getScheduleMeta(db, scheduleId)
  const streams = await db.select().from(editStreamsTable).where(eq(editStreamsTable.scheduleId, scheduleId)).all()

  const tagRows = await db.select({
    streamId: editStreamTagsTable.streamId,
    id: editStreamTagsTable.tagId,
    slug: tags.slug,
    name: tags.name,
  })
    .from(editStreamTagsTable)
    .innerJoin(tags, eq(editStreamTagsTable.tagId, (tags as any).id))
    .where(eq(editStreamTagsTable.scheduleId, scheduleId))
    .all()
  const tagsByStream: Record<string, Array<{id: number, slug: string, name: string}>> = {}
  for (const r of tagRows) {
    const key = String(r.streamId)
    tagsByStream[key] = tagsByStream[key] || []
    tagsByStream[key].push({ id: r.id, slug: r.slug, name: r.name })
  }

  const partRows = await db.select({
    streamId: editStreamParticipantsTable.streamId,
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
    .innerJoin(userDisplayView, eq(editStreamParticipantsTable.userId, userDisplayView.userId))
    .where(eq(editStreamParticipantsTable.scheduleId, scheduleId))
    .all()
  const participantsByStream: Record<string, any[]> = {}
  for (const r of partRows) {
    const key = String(r.streamId)
    participantsByStream[key] = participantsByStream[key] || []
    const {streamId, ...rest} = r as any
    participantsByStream[key].push(rest)
  }

  return { schedule, streams, tagsByStream, participantsByStream }
}

export async function resolveTag(db: JJDrizzleDatabase, search: string, creatorUserId: number, allowCreate: boolean) {
  const slug = createSlug(search)
  let tag = await db.select().from(tags).where(eq(tags.slug, slug)).get()
  if (!tag) {
    tag = await db.select().from(tags).where(eq(tags.name, search)).get()
  }
  if (!tag && allowCreate) {
    const inserted = await db.insert(tags).values({ name: search, slug, createdBy: creatorUserId }).returning().get()
    tag = inserted
  }
  if (!tag) throw new ORPCError('NOT_FOUND', {message: 'Tag not found'})
  return tag
}

export const reexports = {
  schedulesTable,
  streamsTable,
  streamParticipantsTable,
  editSchedulesTable,
  editStreamsTable,
  editStreamTagsTable,
  editStreamParticipantsTable,
  streamTagsTable,
  tags,
  userDisplayView,
  and,
  eq,
  inArray,
  sql,
}
