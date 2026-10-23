import { ORPCError } from '@orpc/server'
import { and, asc, eq, exists, inArray, ne, notExists, or, sql } from 'drizzle-orm'
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core'
import type { JJDrizzleDatabase } from '../../../db/db.ts'
import { schedulesTable, streamParticipantsTable, streamsTable, } from '../../../db/schema/jj-schema.ts'
import { editSchedulesTable } from '../../../db/schema/edit-schedules-schema.ts'
import { editStreamsTable } from '../../../db/schema/edit-streams-schema.ts'
import { editStreamTagsTable } from '../../../db/schema/edit-stream-tags-schema.ts'
import { editStreamParticipantsTable } from '../../../db/schema/edit-stream-participants-schema.ts'
import { streamTagsTable, tags } from '../../../db/schema/tags-schema.ts'
import { userDisplayView } from '../../../db/schema/views-schema.ts'
import { createSlug } from '../../../../functions/slug.ts'
import { scheduleAccess, scheduleAccessQuery } from './access.ts'

// Type describing the result of loadDraftSnapshot
export type LoadDraftSnapshotResult = {
  schedule: Awaited<ReturnType<typeof getScheduleMeta>>
  streams: Array<typeof editStreamsTable.$inferSelect>
  tagsByStream: Record<
    string,
    Array<{ id: number; slug: string; name: string }>
  >
  participantsByStream: Record<
    string,
    Array<
      Pick<
        typeof userDisplayView.$inferSelect,
        | 'userId'
        | 'primaryLiveStream'
        | 'createdAt'
        | 'username'
        | 'profileImage'
        | 'twitchLogin'
        | 'tiltifySlug'
        | 'tiltifyUrl'
        | 'primaryColor'
        | 'accentColor'
      >
    >
  >
}

function scheduleMetaQuery(db: JJDrizzleDatabase, scheduleId: number) {
  return db
    .select({
      id: schedulesTable.id,
      title: schedulesTable.title,
      slug: schedulesTable.slug,
      year: schedulesTable.year,
      visible: schedulesTable.visible,
      updatedAt: schedulesTable.updatedAt,
    })
    .from(schedulesTable)
    .where(eq(schedulesTable.id, scheduleId))
}

export async function getScheduleMeta(
  db: JJDrizzleDatabase,
  scheduleId: number,
) {
  const schedule = await scheduleMetaQuery(db, scheduleId).get()
  if (!schedule)
    throw new ORPCError('NOT_FOUND', { message: 'Schedule not found' })
  return schedule
}

/** A draft that is not discarded exists: its edit_* rows are the editors' working copy. */
const draftSeeded = (db: JJDrizzleDatabase, scheduleId: number) =>
  exists(
    db
      .select({ scheduleId: editSchedulesTable.scheduleId })
      .from(editSchedulesTable)
      .where(
        and(
          eq(editSchedulesTable.scheduleId, scheduleId),
          ne(editSchedulesTable.status, 'discarded'),
        ),
      ),
  )

const draftHasStreams = (db: JJDrizzleDatabase, scheduleId: number) =>
  exists(
    db
      .select({ id: editStreamsTable.id })
      .from(editStreamsTable)
      .where(eq(editStreamsTable.scheduleId, scheduleId)),
  )

/**
 * The statements that make sure the draft copy of a schedule exists when an editor opens it, for
 * one `db.batch()` (atomic, one round trip). Callers may append their own statements to the same
 * batch. Only the open paths use these; edits and publish use `draftCopyStatements` alone.
 *
 * 1. Reads the "seeded" flag before anything is written; `draftCreatedFrom` turns its rows
 *    into `draftCreated`.
 * 2. A published draft without streams was emptied by an older publish (it used to delete
 *    the draft rows): it is marked discarded, so it is copied again from the schedule. This
 *    runs on open only: once the editor is open, an empty published draft means the editors
 *    deleted every stream, and an edit or a publish must keep it empty.
 * 3. The draft copy itself (`draftCopyStatements`).
 */
export function draftSeedStatements(
  db: JJDrizzleDatabase,
  scheduleId: number,
  editorId: number,
) {
  const status = editSchedulesTable.status
  return [
    db
      .select({ seeded: sql<number>`1` })
      .from(editSchedulesTable)
      .where(
        and(
          eq(editSchedulesTable.scheduleId, scheduleId),
          ne(status, 'discarded'),
          or(ne(status, 'published'), draftHasStreams(db, scheduleId)),
        ),
      ),
    db
      .update(editSchedulesTable)
      .set({ status: 'discarded' })
      .where(
        and(
          eq(editSchedulesTable.scheduleId, scheduleId),
          eq(status, 'published'),
          notExists(
            db
              .select({ id: editStreamsTable.id })
              .from(editStreamsTable)
              .where(eq(editStreamsTable.scheduleId, scheduleId)),
          ),
        ),
      ),
    ...draftCopyStatements(db, scheduleId, editorId),
  ] as const
}

/**
 * The draft copy, for one `db.batch()`: four statements.
 *
 * 1–3. Copy streams, tags and participants from the published schedule, only when no draft
 *    exists or it was discarded. A draft whose streams were all deleted stays empty.
 * 4. Creates the draft row, or reopens a discarded one (status active, draft title, slug,
 *    year and visible cleared). An existing draft is only written when the editor changed:
 *    then `editor_id` and `updated_at` move.
 */
export function draftCopyStatements(
  db: JJDrizzleDatabase,
  scheduleId: number,
  editorId: number,
) {
  // The schedule id to copy from, or NULL once a draft exists: the copies look it up in the
  // schedule_id index, so an existing draft costs no row of the published schedule.
  const copyFrom = sql<number>`(select ${scheduleId} where not ${draftSeeded(db, scheduleId)})`
  const status = editSchedulesTable.status
  const unlessDiscarded = (column: SQLiteColumn) =>
    sql`case when ${status} = 'discarded' then null else ${column} end`

  return [
    db
      .insert(editStreamsTable)
      .select(
        db
          .select({
            id: streamsTable.id,
            scheduleId: streamsTable.scheduleId,
            createdBy: streamsTable.createdBy,
            title: streamsTable.title,
            visible: streamsTable.visible,
            subtitle: streamsTable.subtitle,
            description: streamsTable.description,
            youtubeVodUrl: streamsTable.youtubeVodUrl,
            twitchVodUrl: streamsTable.twitchVodUrl,
            start: streamsTable.start,
            end: streamsTable.end,
            updatedAt: sql<Date>`(unixepoch())`.as('updated_at'),
          })
          .from(streamsTable)
          .where(eq(streamsTable.scheduleId, copyFrom)),
      )
      .onConflictDoNothing(),
    db
      .insert(editStreamTagsTable)
      .select(
        db
          .select({
            streamId: streamTagsTable.streamId,
            scheduleId: streamTagsTable.scheduleId,
            tagId: streamTagsTable.tagId,
            addedAt: streamTagsTable.addedAt,
          })
          .from(streamTagsTable)
          .where(eq(streamTagsTable.scheduleId, copyFrom)),
      )
      .onConflictDoNothing(),
    db
      .insert(editStreamParticipantsTable)
      .select(
        db
          .select({
            streamId: streamParticipantsTable.streamId,
            scheduleId: streamParticipantsTable.scheduleId,
            userId: streamParticipantsTable.userId,
          })
          .from(streamParticipantsTable)
          .where(eq(streamParticipantsTable.scheduleId, copyFrom)),
      )
      .onConflictDoNothing(),
    db
      .insert(editSchedulesTable)
      .values({ scheduleId, editorId })
      .onConflictDoUpdate({
        target: editSchedulesTable.scheduleId,
        set: {
          editorId: sql`excluded.editor_id`,
          status: sql`case when ${status} = 'discarded' then 'active' else ${status} end`,
          title: unlessDiscarded(editSchedulesTable.title),
          slug: unlessDiscarded(editSchedulesTable.slug),
          year: unlessDiscarded(editSchedulesTable.year),
          visible: unlessDiscarded(editSchedulesTable.visible),
          updatedAt: sql`(unixepoch())`,
        },
        setWhere: sql`${status} = 'discarded' or ${editSchedulesTable.editorId} is not excluded.editor_id`,
      }),
  ] as const
}

/** `draftCreated` from the first result of a batch that starts with `draftSeedStatements`. */
export const draftCreatedFrom = (seededRows: readonly unknown[]) =>
  seededRows.length === 0

/**
 * Makes sure the draft copy exists when an editor opens it (see `draftSeedStatements`); true
 * when it was created now.
 */
export async function ensureDraftInitialized(
  db: JJDrizzleDatabase,
  scheduleId: number,
  editorId: number,
): Promise<boolean> {
  const [seeded] = await db.batch(
    draftSeedStatements(db, scheduleId, editorId),
  )
  return draftCreatedFrom(seeded)
}

/** Makes sure the draft copy exists before an edit (see `draftCopyStatements`). */
export async function ensureDraftCopied(
  db: JJDrizzleDatabase,
  scheduleId: number,
  editorId: number,
) {
  await db.batch(draftCopyStatements(db, scheduleId, editorId))
}

/**
 * The draft snapshot an editor gets when the socket subscribes, if `userId` may still edit the
 * schedule (`access.ts`); null when not, or when the schedule doesn't exist. One round trip: the
 * access statement also reads the schedule row the snapshot needs.
 *
 * Title, slug, year and visible are the draft's where it set them, else the published ones: the
 * values `publishDraft` applies. A discarded draft counts as none, as in `draftCopyStatements`,
 * which clears its fields before a publish (F-67).
 */
export async function loadDraftSnapshotFor(
  db: JJDrizzleDatabase,
  scheduleId: number,
  userId: number,
): Promise<LoadDraftSnapshotResult | null> {
  // Orders: streams by id, tags and participants by (stream, tag / user), the order the
  // primary-key indexes gave before the ORDER BYs were added.
  const [accessRows, draftRows, streams, tagRows, partRows] = await db.batch([
    scheduleAccessQuery(db, scheduleId, userId),
    db
      .select({
        title: editSchedulesTable.title,
        slug: editSchedulesTable.slug,
        year: editSchedulesTable.year,
        visible: editSchedulesTable.visible,
      })
      .from(editSchedulesTable)
      .where(
        and(
          eq(editSchedulesTable.scheduleId, scheduleId),
          ne(editSchedulesTable.status, 'discarded'),
        ),
      ),
    db
      .select()
      .from(editStreamsTable)
      .where(eq(editStreamsTable.scheduleId, scheduleId))
      .orderBy(asc(editStreamsTable.id)),
    db
      .select({
        streamId: editStreamTagsTable.streamId,
        id: editStreamTagsTable.tagId,
        slug: tags.slug,
        name: tags.name,
      })
      .from(editStreamTagsTable)
      .innerJoin(tags, eq(editStreamTagsTable.tagId, tags.id))
      .where(eq(editStreamTagsTable.scheduleId, scheduleId))
      .orderBy(
        asc(editStreamTagsTable.streamId),
        asc(editStreamTagsTable.tagId),
      ),
    db
      .select({
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
      .innerJoin(
        userDisplayView,
        eq(editStreamParticipantsTable.userId, userDisplayView.userId),
      )
      .where(eq(editStreamParticipantsTable.scheduleId, scheduleId))
      .orderBy(
        asc(editStreamParticipantsTable.streamId),
        asc(editStreamParticipantsTable.userId),
      ),
  ])

  const access = scheduleAccess(accessRows[0], userId)
  if (access.status !== 'ok') return null
  const { id, title, slug, year, visible, updatedAt } = access.schedule
  const draft = draftRows[0]
  const schedule = {
    id,
    title: draft?.title ?? title,
    slug: draft?.slug ?? slug,
    year: draft?.year ?? year,
    visible: draft?.visible ?? visible,
    updatedAt,
  }

  const tagsByStream: Record<
    string,
    Array<{ id: number; slug: string; name: string }>
  > = {}
  for (const r of tagRows) {
    const key = String(r.streamId)
    tagsByStream[key] = tagsByStream[key] || []
    tagsByStream[key].push({ id: r.id, slug: r.slug, name: r.name })
  }

  const participantsByStream: LoadDraftSnapshotResult['participantsByStream'] =
    {}
  for (const { streamId, ...rest } of partRows) {
    const key = String(streamId)
    participantsByStream[key] = participantsByStream[key] || []
    participantsByStream[key].push(rest)
  }

  return { schedule, streams, tagsByStream, participantsByStream }
}

export async function resolveTag(db: JJDrizzleDatabase, search: string) {
  const slug = createSlug(search)
  let tag = await db.select().from(tags).where(eq(tags.slug, slug)).get()
  if (!tag) {
    tag = await db.select().from(tags).where(eq(tags.name, search)).get()
  }
  if (!tag) throw new ORPCError('NOT_FOUND', { message: 'Tag not found' })
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
