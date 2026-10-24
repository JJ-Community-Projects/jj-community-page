import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../../middleware/dbMiddleware.ts'
import { authMiddleware } from '../../../middleware/authMiddleware.ts'
import {
  addStreamContract,
  deleteStreamContract,
  lockStreamContract,
  unlockStreamContract,
  updateStreamsWithDetailsContract,
  updateStreamWithDetailsContract,
} from './contract.ts'
import { scheduleOwnerOrEditorMiddleware } from '../middleware.ts'
import { draftCopyStatements } from '../utils.ts'
import { assertStreamLockAvailableOrOwned, lockStreamEditing, unlockStreamEditing, } from '../streamEditingLock.ts'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { editStreamsTable } from '../../../../db/schema/edit-streams-schema.ts'
import { editStreamParticipantsTable } from '../../../../db/schema/edit-stream-participants-schema.ts'
import { editStreamTagsTable } from '../../../../db/schema/edit-stream-tags-schema.ts'
import { tags as tagsTable } from '../../../../db/schema/tags-schema.ts'
import { userDisplayView } from '../../../../db/schema/views-schema.ts'
import type { BatchItem } from 'drizzle-orm/batch'
import type { JJDrizzleDatabase } from '../../../../db/db.ts'
import type { StreamUpdatedWithDetailPayload } from '../scheduleEditingTypes.ts'
import { scheduleEditingChannels } from '../channels.ts'
import {
  movedStreamsDateLimit,
  streamDateLimitFromStarts,
} from '../../util/limits.ts'

const os = implement({
  addStreamContract,
  deleteStreamContract,
  lockStreamContract,
  unlockStreamContract,
  updateStreamWithDetailsContract,
  updateStreamsWithDetailsContract,
}).use(dbMiddleware)

function getScheduleEditingStub(env: Env, scheduleId: number) {
  const channelId = scheduleEditingChannels.edit(scheduleId)
  const DO = env.ScheduleEditingObject
  return DO.get(DO.idFromName(channelId))
}

const streamNotFound = () =>
  new ORPCError('NOT_FOUND', { message: 'Draft stream not found' })

/** Rows changed by one statement of a `db.batch()` result. */
const changesOf = (result: unknown) =>
  (result as { meta: { changes: number } }).meta.changes

const PATCH_KEYS = [
  'title',
  'visible',
  'subtitle',
  'description',
  'youtubeVodUrl',
  'twitchVodUrl',
  'start',
  'end',
] as const
const TRIM_KEYS = [
  'title',
  'subtitle',
  'description',
  'youtubeVodUrl',
  'twitchVodUrl',
] as const

/**
 * The editable fields that `patch` sets (undefined values dropped), as a plain object: it goes to
 * the D1 update and, unchanged, into the WS event (structured clone, so no SQL values in it).
 */
function patchFields(patch: object | undefined, trim: boolean) {
  const fields: Record<string, unknown> = {}
  if (!patch) return fields
  const source = patch as Record<string, unknown>
  for (const k of PATCH_KEYS)
    if (k in source && source[k] !== undefined) fields[k] = source[k]
  if (trim)
    for (const k of TRIM_KEYS)
      if (typeof fields[k] === 'string') fields[k] = (fields[k] as string).trim()
  return fields
}

/** Every draft stream of the schedule with its start: the input of `movedStreamsDateLimit`. */
const draftStreamStartsQuery = (db: JJDrizzleDatabase, scheduleId: number) =>
  db
    .select({ id: editStreamsTable.id, start: editStreamsTable.start })
    .from(editStreamsTable)
    .where(eq(editStreamsTable.scheduleId, scheduleId))

const startsById = (rows: { id: number; start: Date }[]) =>
  new Map(rows.map((r) => [r.id, r.start]))

/** The tags with these ids, ordered by id: the tags a save sets, as its WS event lists them. */
const tagsByIdQuery = (db: JJDrizzleDatabase, ids: number[]) =>
  db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      slug: tagsTable.slug,
    })
    .from(tagsTable)
    .where(inArray(tagsTable.id, ids))
    .orderBy(asc(tagsTable.id))

/** Fails when `ids` has a tag id that `known` (rows of `tagsByIdQuery`) lacks. */
function assertKnownTags(known: { id: number }[], ids: number[]) {
  const knownIds = new Set(known.map((t) => t.id))
  const unknown = [...new Set(ids)].filter((id) => !knownIds.has(id))
  if (unknown.length > 0)
    throw new Error(`Unknown tag IDs: ${unknown.join(', ')}`)
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
      tags,
    } = input
    const tagIds = [...new Set(tags ?? [])]

    // One batch: the draft copy, then the draft's streams (ids and start times), which give both
    // the per-date limit and the smallest free id, and the tags to set (only when given).
    const [, , , , draftStreams, desiredTags = []] = await db.batch([
      ...draftCopyStatements(db, scheduleId, editorId),
      draftStreamStartsQuery(db, scheduleId),
      ...(tagIds.length > 0 ? [tagsByIdQuery(db, tagIds)] : []),
    ] as const)
    assertKnownTags(desiredTags, tagIds)

    // Enforce per-date stream limit for the day of `start`
    const dateLimit = streamDateLimitFromStarts(
      draftStreams.map((r) => r.start),
      new Date(start),
    )
    if (!dateLimit.canAdd) {
      throw new ORPCError('FORBIDDEN', {
        message: 'Daily stream limit reached',
        ...dateLimit,
      } as any)
    }

    const nonNegSet = new Set(
      draftStreams
        .map((r) => Number(r.id))
        .filter((id) => Number.isFinite(id) && id > 0),
    )

    let smallestAvailable = 1
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
    const insertStream = db.insert(editStreamsTable).values(stream)
    // The stream and its tags in one batch (atomic)
    if (desiredTags.length > 0)
      await db.batch([
        insertStream,
        db
          .insert(editStreamTagsTable)
          .values(desiredTags.map((t) => ({ scheduleId, streamId: id, tagId: t.id }))),
      ])
    else await insertStream.run()

    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    // @ts-ignore
    await stub.publishStreamAdded(scheduleId, editorId, {
      ...stream,
      ...(desiredTags.length > 0 && { tags: desiredTags }),
    })
    return { id }
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

    if (changesOf(res) === 0) throw streamNotFound()

    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    // @ts-ignore
    await stub.publishStreamDeleted(scheduleId, editorId, { id })
    return { ok: true as const }
  })

export const lockStream = os.lockStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const { scheduleId, streamId } = input
    const userId = context.userId
    const { acquired } = await lockStreamEditing(context.env as any, scheduleId, streamId, userId)
    // A renewal by the holder (the open dialog, every minute) changes nothing for the others
    if (!acquired) return { ok: true as const }
    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    // @ts-ignore
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
    // @ts-ignore
    await stub.publishUnlock(scheduleId, userId, { streamId, userId })
    return { ok: true as const }
  })

type StreamDetailsInput = {
  id: number
  patch?: object
  participants?: number[]
  tags?: number[]
}

/**
 * Saves the patch, participants and tags of draft streams: at most one read batch and one write
 * batch (atomic). Returns the `stream_updated_with_details` payloads, built from the rows read
 * before the write: tags ordered by id, participants by user id (the order the old re-reads gave).
 *
 * - Reads only when tags or participants are given, a patch moves a stream (`start`), or nothing
 *   would be written: the current participants and tags, the desired tags (unknown ids fail), the
 *   display rows of the desired participants, which of the streams exist and, with a move, every
 *   draft stream's start for the per-date limit (`movedStreamsDateLimit`, all moves together).
 * - A patch-only save finds a missing stream through its update (0 rows changed). With several
 *   streams each update only matches while all of them exist, so nothing is written either.
 *   Streams with the same patch share one update.
 * - A missing stream answers NOT_FOUND; a failed write batch INTERNAL_SERVER_ERROR. Either way
 *   nothing was written, and the caller broadcasts nothing.
 */
async function saveStreamsWithDetails(
  db: JJDrizzleDatabase,
  scheduleId: number,
  inputs: StreamDetailsInput[],
  trim: boolean,
) {
  const streams = inputs.map((s) => {
    const fields = patchFields(s.patch, trim)
    return {
      ...s,
      fields: Object.keys(fields).length > 0 ? fields : undefined,
    }
  })
  const ids = [...new Set(streams.map((s) => s.id))]
  const withParticipants = streams.filter((s) => s.participants !== undefined)
  const withTags = streams.filter((s) => s.tags !== undefined)
  // Streams whose patch sets `start`: the per-date limit needs every draft stream's start (F-57).
  const moves = new Map<number, Date>()
  for (const { id, fields } of streams)
    if (fields?.start !== undefined) moves.set(id, new Date(fields.start as Date))
  const read =
    withParticipants.length > 0 ||
    withTags.length > 0 ||
    moves.size > 0 ||
    !streams.some((s) => s.fields)

  const currentParticipants = new Map<number, Set<number>>()
  const currentTags = new Map<number, Set<number>>()
  let tagRows: { id: number; name: string; slug: string }[] = []
  let userRows: NonNullable<StreamUpdatedWithDetailPayload['participants']> = []
  if (read) {
    const desiredTagIds = [...new Set(withTags.flatMap((s) => s.tags!))]
    const desiredUserIds = [
      ...new Set(withParticipants.flatMap((s) => s.participants!)),
    ]
    // Statements with nothing to look up are left out of the batch (false). With a move, every
    // draft stream's start is read; it also shows which of the streams exist.
    const found =
      moves.size === 0 &&
      db
        .select({ id: editStreamsTable.id })
        .from(editStreamsTable)
        .where(
          and(
            eq(editStreamsTable.scheduleId, scheduleId),
            inArray(editStreamsTable.id, ids),
          ),
        )
    const startsQuery = moves.size > 0 && draftStreamStartsQuery(db, scheduleId)
    const participantsQuery =
      withParticipants.length > 0 &&
      db
        .select({
          streamId: editStreamParticipantsTable.streamId,
          userId: editStreamParticipantsTable.userId,
        })
        .from(editStreamParticipantsTable)
        .where(
          and(
            eq(editStreamParticipantsTable.scheduleId, scheduleId),
            inArray(
              editStreamParticipantsTable.streamId,
              withParticipants.map((s) => s.id),
            ),
          ),
        )
    const tagsQuery =
      withTags.length > 0 &&
      db
        .select({
          streamId: editStreamTagsTable.streamId,
          tagId: editStreamTagsTable.tagId,
        })
        .from(editStreamTagsTable)
        .where(
          and(
            eq(editStreamTagsTable.scheduleId, scheduleId),
            inArray(
              editStreamTagsTable.streamId,
              withTags.map((s) => s.id),
            ),
          ),
        )
    const desiredTagsQuery =
      desiredTagIds.length > 0 && tagsByIdQuery(db, desiredTagIds)
    const displayQuery =
      desiredUserIds.length > 0 &&
      db
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
        .from(userDisplayView)
        .where(inArray(userDisplayView.userId, desiredUserIds))
        .orderBy(asc(userDisplayView.userId))

    const sent = [
      found,
      startsQuery,
      participantsQuery,
      tagsQuery,
      desiredTagsQuery,
      displayQuery,
    ].filter((q) => q !== false)
    const results = await db.batch(sent as unknown as [BatchItem<'sqlite'>])
    const resultOf = <T>(query: T | false) =>
      (query === false ? [] : results[sent.indexOf(query as never)]) as Awaited<T>
    const current = startsById(resultOf(startsQuery))
    const existing = startsQuery ? ids.filter((id) => current.has(id)) : resultOf(found)
    if (existing.length < ids.length) throw streamNotFound()
    const participantRows = resultOf(participantsQuery)
    const streamTagRows = resultOf(tagsQuery)
    const desiredTags = resultOf(desiredTagsQuery)
    const displayRows = resultOf(displayQuery)

    for (const s of withTags) assertKnownTags(desiredTags, s.tags!)

    // The days after all moves together: the whole save is refused if one is over the limit.
    const dateLimit = moves.size > 0 && movedStreamsDateLimit(current, moves)
    if (dateLimit) {
      throw new ORPCError('FORBIDDEN', {
        message: 'Daily stream limit reached',
        ...dateLimit,
      } as any)
    }

    for (const r of participantRows) {
      const set = currentParticipants.get(r.streamId) ?? new Set<number>()
      currentParticipants.set(r.streamId, set.add(r.userId))
    }
    for (const r of streamTagRows) {
      const set = currentTags.get(r.streamId) ?? new Set<number>()
      currentTags.set(r.streamId, set.add(r.tagId))
    }
    tagRows = desiredTags
    userRows = displayRows as typeof userRows
  }

  // Without a read, every update also requires all streams to exist (one PK lookup each), so a
  // missing stream leaves every update at 0 rows.
  const allStreamsExist =
    !read && ids.length > 1
      ? sql`(select count(*) from ${editStreamsTable} where ${editStreamsTable.scheduleId} = ${scheduleId} and ${inArray(editStreamsTable.id, ids)}) = ${ids.length}`
      : undefined

  // Streams with the same patch (a whole day set visible) share one update.
  const patchGroups = new Map<string, { fields: Record<string, unknown>; ids: number[] }>()
  for (const { id, fields } of streams) {
    if (!fields) continue
    const key = JSON.stringify(fields)
    const group = patchGroups.get(key) ?? { fields, ids: [] }
    patchGroups.set(key, { ...group, ids: [...group.ids, id] })
  }
  const writes: BatchItem<'sqlite'>[] = [...patchGroups.values()].map(
    ({ fields, ids: groupIds }) =>
      db
        .update(editStreamsTable)
        .set({ ...fields, updatedAt: sql`(unixepoch())` })
        .where(
          and(
            eq(editStreamsTable.scheduleId, scheduleId),
            inArray(editStreamsTable.id, groupIds),
            allStreamsExist,
          ),
        ),
  )

  for (const { id: streamId, participants, tags } of streams) {
    if (participants !== undefined) {
      const current = currentParticipants.get(streamId) ?? new Set<number>()
      const desired = new Set(participants)
      const toRemove = [...current].filter((u) => !desired.has(u))
      const toAdd = [...desired].filter((u) => !current.has(u))
      if (toRemove.length > 0)
        writes.push(
          db
            .delete(editStreamParticipantsTable)
            .where(
              and(
                eq(editStreamParticipantsTable.scheduleId, scheduleId),
                eq(editStreamParticipantsTable.streamId, streamId),
                inArray(editStreamParticipantsTable.userId, toRemove),
              ),
            ),
        )
      if (toAdd.length > 0)
        writes.push(
          db
            .insert(editStreamParticipantsTable)
            .values(toAdd.map((userId) => ({ scheduleId, streamId, userId })))
            .onConflictDoNothing(),
        )
    }

    if (tags !== undefined) {
      const current = currentTags.get(streamId) ?? new Set<number>()
      const desired = new Set(tags)
      const toRemove = [...current].filter((t) => !desired.has(t))
      const toAdd = [...desired].filter((t) => !current.has(t))
      if (toRemove.length > 0)
        writes.push(
          db
            .delete(editStreamTagsTable)
            .where(
              and(
                eq(editStreamTagsTable.scheduleId, scheduleId),
                eq(editStreamTagsTable.streamId, streamId),
                inArray(editStreamTagsTable.tagId, toRemove),
              ),
            ),
        )
      if (toAdd.length > 0)
        writes.push(
          db
            .insert(editStreamTagsTable)
            .values(toAdd.map((tagId) => ({ scheduleId, streamId, tagId })))
            .onConflictDoNothing(),
        )
    }
  }

  if (writes.length > 0) {
    let results: unknown[]
    try {
      results = await db.batch(writes as [BatchItem<'sqlite'>])
    } catch (e) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'The stream changes could not be saved',
        cause: e,
      })
    }
    // Without a read, every write is an update: none matched when a stream is missing.
    if (!read && results.some((r) => changesOf(r) === 0))
      throw streamNotFound()
  }

  return streams.map(({ id, fields, participants, tags }) => {
    const payload: StreamUpdatedWithDetailPayload = { id }
    if (fields) payload.patch = fields as StreamUpdatedWithDetailPayload['patch']
    if (tags !== undefined) {
      const desired = new Set(tags)
      payload.tags = tagRows.filter((t) => desired.has(t.id))
    }
    if (participants !== undefined) {
      const desired = new Set(participants)
      payload.participants = userRows.filter((u) => desired.has(u.userId))
    }
    return payload
  })
}

export const updateStreamWithDetails = os.updateStreamWithDetailsContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, id, patch, participants, tags } = input

    await assertStreamLockAvailableOrOwned(
      context.env as any,
      scheduleId,
      id,
      editorId,
    )

    const [payload] = await saveStreamsWithDetails(
      db,
      scheduleId,
      [{ id, patch, participants, tags }],
      true,
    )

    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    // @ts-ignore
    await stub.publishStreamUpdatedWithDetails(scheduleId, editorId, payload)
  })

export const updateStreamsWithDetails = os.updateStreamsWithDetailsContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, streams } = input

    // Fails as a whole when another editor holds a lock on any of the streams.
    await Promise.all(
      [...new Set(streams.map((s) => s.id))].map((id) =>
        assertStreamLockAvailableOrOwned(context.env, scheduleId, id, editorId),
      ),
    )

    const payloads = await saveStreamsWithDetails(db, scheduleId, streams, false)
    if (payloads.length === 0) return

    const stub = getScheduleEditingStub(context.env, scheduleId)
    // @ts-ignore
    await stub.publishStreamsUpdatedWithDetails(scheduleId, editorId, payloads)
  })

export const streamsRouter = {
  addStream,
  deleteStream,
  lockStream,
  unlockStream,
  updateStreamWithDetails,
  updateStreamsWithDetails,
}
