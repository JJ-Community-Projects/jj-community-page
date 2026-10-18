import { getDB } from '../../lib/db/db.ts'
import { and, asc, eq, inArray } from 'drizzle-orm'
import {
  schedulesTable,
  streamParticipantsTable,
  streamsTable,
} from '../../lib/db/schema/jj-schema.ts'
import { userDisplayView } from '../../lib/db/schema/views-schema.ts'
import { streamTagsTable, tags } from '../../lib/db/schema/tags-schema.ts'
import type {
  FullCommunitySchedule,
  Stream,
  UserDisplay,
  UserStream,
} from '../../lib/orpc/private/jjData/contract.ts'

// Builds the full community schedule from D1 and caches it.
//
// Owns storage key: `full-community-schedule`.
export class ScheduleBuilder {
  constructor(
    private storage: DurableObjectStorage,
    private env: Env,
  ) {}

  public getFullSchedule(): Promise<FullCommunitySchedule | undefined> {
    return this.storage.get<FullCommunitySchedule>('full-community-schedule')
  }

  public async generateFullSchedule() {
    const year = new Date().getUTCFullYear()

    const db = getDB(this.env)

    const hardcoded: UserStream[] = []

    // All visible & primary schedules of the year. Every statement below keys on
    // this subquery, so the whole build is one D1 round trip (BG-3).
    const isListed = and(
      eq(schedulesTable.year, year),
      eq(schedulesTable.visible, true),
      eq(schedulesTable.primary, true),
    )
    const listedScheduleIds = db
      .select({ id: schedulesTable.id })
      .from(schedulesTable)
      .where(isListed)
    const userDisplayFields = {
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
    }

    const [scheduleRows, streamRows, tagRows, participantRows, owners] =
      await db.batch([
        // 1) the schedules, with their owners
        db
          .select({ id: schedulesTable.id, ownerId: schedulesTable.ownerId })
          .from(schedulesTable)
          .where(isListed)
          .orderBy(asc(schedulesTable.id)),
        // 2) their visible streams, per schedule by start time
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
          })
          .from(streamsTable)
          .where(
            and(
              eq(streamsTable.visible, true),
              inArray(streamsTable.scheduleId, listedScheduleIds),
            ),
          )
          .orderBy(
            asc(streamsTable.scheduleId),
            asc(streamsTable.start),
            asc(streamsTable.id),
          ),
        // 3) tags per stream
        db
          .select({
            scheduleId: streamTagsTable.scheduleId,
            streamId: streamTagsTable.streamId,
            name: tags.name,
            slug: tags.slug,
            color: tags.color,
          })
          .from(streamTagsTable)
          .innerJoin(tags, eq(streamTagsTable.tagId, tags.id))
          .where(inArray(streamTagsTable.scheduleId, listedScheduleIds))
          .orderBy(
            asc(streamTagsTable.scheduleId),
            asc(streamTagsTable.streamId),
            asc(streamTagsTable.tagId),
          ),
        // 4) participants per stream
        db
          .select({
            scheduleId: streamParticipantsTable.scheduleId,
            streamId: streamParticipantsTable.streamId,
            ...userDisplayFields,
          })
          .from(streamParticipantsTable)
          .innerJoin(
            userDisplayView,
            eq(streamParticipantsTable.userId, userDisplayView.userId),
          )
          .where(inArray(streamParticipantsTable.scheduleId, listedScheduleIds))
          .orderBy(
            asc(streamParticipantsTable.scheduleId),
            asc(streamParticipantsTable.streamId),
            asc(streamParticipantsTable.userId),
          ),
        // 5) the schedule owners
        db
          .select(userDisplayFields)
          .from(userDisplayView)
          .where(
            inArray(
              userDisplayView.userId,
              db
                .select({ ownerId: schedulesTable.ownerId })
                .from(schedulesTable)
                .where(isListed),
            ),
          )
          .orderBy(asc(userDisplayView.userId)),
      ])

    // No schedules or no visible streams: keep the stored schedule
    if (scheduleRows.length === 0 || streamRows.length === 0) {
      return { days: groupByDay(hardcoded) }
    }

    const scheduleOwnerMap = new Map<number, number>(
      scheduleRows.map((r) => [r.id, r.ownerId]),
    )

    const tagsMap = new Map<
      string,
      Array<{ name: string; slug: string; color: string }>
    >()
    for (const t of tagRows) {
      const key = `${t.scheduleId}:${t.streamId}`
      const arr = tagsMap.get(key) ?? []
      arr.push({ name: t.name, slug: t.slug, color: t.color })
      tagsMap.set(key, arr)
    }

    const participantsMap = new Map<string, UserDisplay[]>()
    for (const { scheduleId, streamId, ...participant } of participantRows) {
      const key = `${scheduleId}:${streamId}`
      const arr = participantsMap.get(key) ?? []
      arr.push(participant as UserDisplay)
      participantsMap.set(key, arr)
    }

    const ownersMap = new Map<number, UserDisplay>(
      owners.map((o) => [o.userId, o as UserDisplay]),
    )

    // Compose UserStream objects, in schedule order
    const dbUserStreams: UserStream[] = streamRows.map((core) => {
      const key = `${core.scheduleId}:${core.id}`
      const stream: Stream = {
        ...(core as any),
        tags: tagsMap.get(key) ?? [],
        participants: participantsMap.get(key) ?? [],
      }
      const ownerId = scheduleOwnerMap.get(core.scheduleId)
      const owner = ownerId ? ownersMap.get(ownerId) : undefined
      return { stream, owner }
    })

    // Merge hardcoded user streams
    const allUserStreams: UserStream[] = [...dbUserStreams, ...hardcoded]

    const result: FullCommunitySchedule = {
      days: groupByDay(allUserStreams),
      streams: allUserStreams,
    }

    await this.storage.put('full-community-schedule', result)
  }
}

// Group by UTC day; days and the streams within a day by start time
function groupByDay(userStreams: UserStream[]) {
  const groups = new Map<string, { day: Date; streams: UserStream[] }>()
  for (const us of userStreams) {
    const s = us.stream
    const d = new Date(
      Date.UTC(
        s.start.getUTCFullYear(),
        s.start.getUTCMonth(),
        s.start.getUTCDate(),
      ),
    )
    const key = d.toISOString()
    const g = groups.get(key) ?? { day: d, streams: [] }
    g.streams.push(us)
    groups.set(key, g)
  }
  return Array.from(groups.values())
    .map(({ day, streams }) => ({
      day,
      streams: streams.sort(
        (a, b) => a.stream.start.getTime() - b.stream.start.getTime(),
      ),
    }))
    .sort((a, b) => a.day.getTime() - b.day.getTime())
}
