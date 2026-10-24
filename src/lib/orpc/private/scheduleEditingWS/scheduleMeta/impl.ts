import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../../middleware/dbMiddleware.ts'
import { authMiddleware } from '../../../middleware/authMiddleware.ts'
import {
  discardDraftContract,
  publishDraftContract,
  startEditingSessionContract,
  upsertScheduleMetaContract,
} from './contract.ts'
import { scheduleOwnerOrEditorMiddleware } from '../middleware.ts'
import { draftCopyStatements, ensureDraftInitialized } from '../utils.ts'
import { and, eq, exists, not, notExists, or, sql, type SQL } from 'drizzle-orm'
import { alias, type SQLiteColumn, type SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { JJDrizzleDatabase } from '../../../../db/db.ts'
import {
  schedulesTable,
  streamParticipantsTable,
  streamsTable,
} from '../../../../db/schema/jj-schema.ts'
import { editSchedulesTable } from '../../../../db/schema/edit-schedules-schema.ts'
import { editStreamsTable } from '../../../../db/schema/edit-streams-schema.ts'
import { editStreamParticipantsTable } from '../../../../db/schema/edit-stream-participants-schema.ts'
import { editStreamTagsTable } from '../../../../db/schema/edit-stream-tags-schema.ts'
import { streamTagsTable } from '../../../../db/schema/tags-schema.ts'
import { scheduleEditingChannels } from '../channels.ts'

const os = implement({
  startEditingSessionContract,
  upsertScheduleMetaContract,
  publishDraftContract,
  discardDraftContract,
}).use(dbMiddleware)

function getScheduleEditingStub(env: Env, scheduleId: number) {
  const channelId = scheduleEditingChannels.edit(scheduleId)
  const DO = env.ScheduleEditingObject
  return DO.get(DO.idFromName(channelId))
}

const startEditingSession = os.startEditingSessionContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const editorId = context.userId
    const { scheduleId } = input
    const draftCreated = await ensureDraftInitialized(
      context.db,
      scheduleId,
      editorId,
    )
    return { scheduleId, editorId, draftCreated }
  })

const upsertScheduleMeta = os.upsertScheduleMetaContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, title, slug, year, visible } = input

    const patch: Record<string, any> = {}
    if (title !== undefined) patch.title = title
    if (slug !== undefined) patch.slug = slug
    if (year !== undefined) patch.year = year
    if (visible !== undefined) patch.visible = visible

    // One round trip: the draft is created (or reopened) first if needed, so the draft row
    // never exists without its copied streams; then only the given fields are written.
    // `editor_id` is rewritten only when another editor made the last change. The four draft
    // statements come first, the meta update is the fifth.
    const [, , , , updated] = await db.batch([
      ...draftCopyStatements(db, scheduleId, editorId),
      db
        .update(editSchedulesTable)
        .set({ ...patch, updatedAt: sql`(unixepoch())` })
        .where(eq(editSchedulesTable.scheduleId, scheduleId))
        .returning({ updatedAt: editSchedulesTable.updatedAt }),
    ])

    // WS publish schedule meta change
    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    // @ts-ignore
    await stub.publishScheduleUpdated(scheduleId, editorId, { patch })

    return { updatedAt: updated[0]?.updatedAt ?? new Date() }
  })

// The stream columns publish compares and copies (never id or schedule_id: they are the key).
const STREAM_COLUMNS = [
  'createdBy',
  'title',
  'visible',
  'subtitle',
  'description',
  'youtubeVodUrl',
  'twitchVodUrl',
  'start',
  'end',
] as const
type StreamColumns = Record<(typeof STREAM_COLUMNS)[number], SQLiteColumn>
const streamRow = (t: StreamColumns) =>
  sql`(${sql.join(
    STREAM_COLUMNS.map((c) => t[c]),
    sql`, `,
  )})`

/** A draft meta field that is set and differs from the published one. */
const metaDiffers = (draftColumn: SQLiteColumn, column: SQLiteColumn) =>
  sql`(${draftColumn} is not null and ${draftColumn} is not ${column})`

/**
 * The statements that copy the draft's differences into the published tables, for one
 * `db.batch()` after the draft copy. Only rows that differ are written:
 *
 * 1. `updated_at` (and the title) when anything differs. It must run first: once the other
 *    statements ran, nothing differs any more.
 * 2. slug, then year and visible, each only when it changed: setting a column to its own value
 *    still writes its index entries (the slug has a unique index, year and visible are in two).
 * 3. Removed tags and participants, then removed streams. Their own deletes come before the
 *    stream delete, so their counts include the rows of deleted streams (a foreign key cascade
 *    is not counted in `changes`).
 * 4. Changed streams, then new streams, tags and participants (streams first: foreign keys).
 *
 * Every statement filters by `schedule_id`, a prefix of each table's primary key.
 */
function publishStatements(db: JJDrizzleDatabase, scheduleId: number) {
  const m = alias(editSchedulesTable, 'm')
  const d = alias(editStreamsTable, 'd')
  const p = alias(streamsTable, 'p')
  const dt = alias(editStreamTagsTable, 'dt')
  const dp = alias(editStreamParticipantsTable, 'dp')
  const one = { one: sql`1` }

  const draftHas = {
    stream: (t: { id: SQLiteColumn }) =>
      exists(
        db
          .select(one)
          .from(d)
          .where(and(eq(d.scheduleId, scheduleId), eq(d.id, t.id))),
      ),
    tag: (t: { streamId: SQLiteColumn; tagId: SQLiteColumn }) =>
      exists(
        db
          .select(one)
          .from(dt)
          .where(
            and(
              eq(dt.scheduleId, scheduleId),
              eq(dt.streamId, t.streamId),
              eq(dt.tagId, t.tagId),
            ),
          ),
      ),
    participant: (t: { streamId: SQLiteColumn; userId: SQLiteColumn }) =>
      exists(
        db
          .select(one)
          .from(dp)
          .where(
            and(
              eq(dp.scheduleId, scheduleId),
              eq(dp.streamId, t.streamId),
              eq(dp.userId, t.userId),
            ),
          ),
      ),
  }
  // Rows of one side that the other side lacks (a stream also counts when a column differs).
  const onlyIn = (
    table: SQLiteTable,
    scheduleColumn: SQLiteColumn,
    missing: SQL,
  ) =>
    exists(
      db
        .select(one)
        .from(table)
        .where(and(eq(scheduleColumn, scheduleId), missing)),
    )
  const pt = alias(streamTagsTable, 'pt')
  const pp = alias(streamParticipantsTable, 'pp')
  const anythingDiffers = or(
    exists(
      db
        .select(one)
        .from(m)
        .where(
          and(
            eq(m.scheduleId, scheduleId),
            or(
              metaDiffers(m.title, schedulesTable.title),
              metaDiffers(m.slug, schedulesTable.slug),
              metaDiffers(m.year, schedulesTable.year),
              metaDiffers(m.visible, schedulesTable.visible),
            ),
          ),
        ),
    ),
    onlyIn(
      d,
      d.scheduleId,
      notExists(
        db
          .select(one)
          .from(p)
          .where(
            and(
              eq(p.scheduleId, scheduleId),
              eq(p.id, d.id),
              sql`${streamRow(p)} is ${streamRow(d)}`,
            ),
          ),
      ),
    ),
    onlyIn(p, p.scheduleId, not(draftHas.stream(p))),
    onlyIn(
      dt,
      dt.scheduleId,
      notExists(
        db
          .select(one)
          .from(pt)
          .where(
            and(
              eq(pt.scheduleId, scheduleId),
              eq(pt.streamId, dt.streamId),
              eq(pt.tagId, dt.tagId),
            ),
          ),
      ),
    ),
    onlyIn(pt, pt.scheduleId, not(draftHas.tag(pt))),
    onlyIn(
      dp,
      dp.scheduleId,
      notExists(
        db
          .select(one)
          .from(pp)
          .where(
            and(
              eq(pp.scheduleId, scheduleId),
              eq(pp.streamId, dp.streamId),
              eq(pp.userId, dp.userId),
            ),
          ),
      ),
    ),
    onlyIn(pp, pp.scheduleId, not(draftHas.participant(pp))),
  )

  return [
    db
      .update(schedulesTable)
      .set({
        title: sql`coalesce(${db
          .select({ title: m.title })
          .from(m)
          .where(eq(m.scheduleId, scheduleId))}, ${schedulesTable.title})`,
        updatedAt: sql`(unixepoch())`,
      })
      .where(and(eq(schedulesTable.id, scheduleId), anythingDiffers)),
    db
      .update(schedulesTable)
      .set({ slug: sql`${m.slug}` })
      .from(m)
      .where(
        and(
          eq(schedulesTable.id, scheduleId),
          eq(m.scheduleId, scheduleId),
          metaDiffers(m.slug, schedulesTable.slug),
        ),
      ),
    db
      .update(schedulesTable)
      .set({
        year: sql`coalesce(${m.year}, ${schedulesTable.year})`,
        visible: sql`coalesce(${m.visible}, ${schedulesTable.visible})`,
      })
      .from(m)
      .where(
        and(
          eq(schedulesTable.id, scheduleId),
          eq(m.scheduleId, scheduleId),
          or(
            metaDiffers(m.year, schedulesTable.year),
            metaDiffers(m.visible, schedulesTable.visible),
          ),
        ),
      ),
    db
      .delete(streamTagsTable)
      .where(
        and(
          eq(streamTagsTable.scheduleId, scheduleId),
          not(draftHas.tag(streamTagsTable)),
        ),
      ),
    db
      .delete(streamParticipantsTable)
      .where(
        and(
          eq(streamParticipantsTable.scheduleId, scheduleId),
          not(draftHas.participant(streamParticipantsTable)),
        ),
      ),
    db
      .delete(streamsTable)
      .where(
        and(
          eq(streamsTable.scheduleId, scheduleId),
          not(draftHas.stream(streamsTable)),
        ),
      ),
    db
      .update(streamsTable)
      .set(
        Object.fromEntries(
          STREAM_COLUMNS.map((c) => [c, sql`${d[c]}`]),
        ) as Record<(typeof STREAM_COLUMNS)[number], SQL>,
      )
      .from(d)
      .where(
        and(
          eq(streamsTable.scheduleId, scheduleId),
          eq(d.scheduleId, scheduleId),
          eq(d.id, streamsTable.id),
          sql`${streamRow(streamsTable)} is not ${streamRow(d)}`,
        ),
      ),
    db
      .insert(streamsTable)
      .select(
        db
          .select({
            id: editStreamsTable.id,
            scheduleId: editStreamsTable.scheduleId,
            createdBy: editStreamsTable.createdBy,
            title: editStreamsTable.title,
            visible: editStreamsTable.visible,
            subtitle: editStreamsTable.subtitle,
            description: editStreamsTable.description,
            youtubeVodUrl: editStreamsTable.youtubeVodUrl,
            twitchVodUrl: editStreamsTable.twitchVodUrl,
            start: editStreamsTable.start,
            end: editStreamsTable.end,
          })
          .from(editStreamsTable)
          .where(eq(editStreamsTable.scheduleId, scheduleId)),
      )
      .onConflictDoNothing(),
    // A tag kept across the publish keeps its published added_at.
    db
      .insert(streamTagsTable)
      .select(
        db
          .select({
            streamId: editStreamTagsTable.streamId,
            scheduleId: editStreamTagsTable.scheduleId,
            tagId: editStreamTagsTable.tagId,
            addedAt: editStreamTagsTable.addedAt,
          })
          .from(editStreamTagsTable)
          .where(eq(editStreamTagsTable.scheduleId, scheduleId)),
      )
      .onConflictDoNothing(),
    db
      .insert(streamParticipantsTable)
      .select(
        db
          .select({
            scheduleId: editStreamParticipantsTable.scheduleId,
            streamId: editStreamParticipantsTable.streamId,
            userId: editStreamParticipantsTable.userId,
          })
          .from(editStreamParticipantsTable)
          .where(eq(editStreamParticipantsTable.scheduleId, scheduleId)),
      )
      .onConflictDoNothing(),
    db
      .update(editSchedulesTable)
      .set({ status: 'published', updatedAt: sql`(unixepoch())` })
      .where(eq(editSchedulesTable.scheduleId, scheduleId)),
  ] as const
}

const changesOf = (result: unknown) =>
  (result as { meta: { changes: number } }).meta.changes

const publishDraft = os.publishDraftContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId } = input

    try {
      // One atomic batch: the draft copy first (a schedule without a draft publishes itself,
      // unchanged), then the differences. A failure leaves the published schedule untouched.
      // The copy is the plain one: an empty published draft here means its streams were deleted.
      const [
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        tagsRemoved,
        participantsRemoved,
        streamsDeleted,
        streamsUpdated,
        streamsCreated,
        tagsAdded,
        participantsAdded,
      ] = await db.batch([
        ...draftCopyStatements(db, scheduleId, editorId),
        ...publishStatements(db, scheduleId),
      ])

      const publishedAt = new Date()

      // Tell the other editors the draft was published.
      const stub = getScheduleEditingStub(context.env as any, scheduleId)
      // @ts-ignore
      await stub.publishDraftPublished(scheduleId, editorId, {})

      return {
        publishedAt,
        changes: {
          streams: {
            created: changesOf(streamsCreated),
            updated: changesOf(streamsUpdated),
            deleted: changesOf(streamsDeleted),
          },
          participants: {
            added: changesOf(participantsAdded),
            removed: changesOf(participantsRemoved),
          },
          tags: {
            added: changesOf(tagsAdded),
            removed: changesOf(tagsRemoved),
          },
        },
      }
    } catch (e) {
      console.error(e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  })

const discardDraft = os.discardDraftContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId } = input

    // One atomic batch. Deleting the draft streams also deletes their draft tags and
    // participants (ON DELETE CASCADE). The next open copies the schedule again.
    await db.batch([
      db
        .delete(editStreamsTable)
        .where(eq(editStreamsTable.scheduleId, scheduleId)),
      db
        .update(editSchedulesTable)
        .set({ status: 'discarded', updatedAt: sql`(unixepoch())` })
        .where(eq(editSchedulesTable.scheduleId, scheduleId)),
    ])

    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    // @ts-ignore
    await stub.publishDraftDiscarded(scheduleId, editorId, {})

    return { ok: true as const }
  })

export const scheduleMetaRouter = {
  startEditingSession,
  upsertScheduleMeta,
  publishDraft,
  discardDraft,
}
