import { getDB } from '../../lib/db/db.ts'
import { and, asc, eq } from 'drizzle-orm'
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

    let hardcoded: UserStream[] = []

    // 1) Find all visible & primary schedules for the current year
    const scheduleRows = await db
      .select({ id: schedulesTable.id, ownerId: schedulesTable.ownerId })
      .from(schedulesTable)
      .where(
        and(
          eq(schedulesTable.year, year),
          eq(schedulesTable.visible, true),
          eq(schedulesTable.primary, true),
        ),
      )
      .all()

    const scheduleIds = scheduleRows.map((s) => s.id)
    const scheduleOwnerMap = new Map<number, number>(
      scheduleRows.map((r) => [r.id, r.ownerId]),
    )

    // If no schedules, return just hardcoded (grouped by day)
    if (scheduleIds.length === 0) {
      // Group by UTC day
      const groups = new Map<string, { day: Date; streams: UserStream[] }>()
      for (const us of hardcoded) {
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
      const days = Array.from(groups.values())
        .map(({ day, streams }) => ({
          day,
          streams: streams.sort(
            (a, b) => a.stream.start.getTime() - b.stream.start.getTime(),
          ),
        }))
        .sort((a, b) => a.day.getTime() - b.day.getTime())
      return { days }
    }

    // 2) Load all visible streams for those schedules
    // Avoid building a giant OR(...) with many variables; iterate per schedule
    const basePairs: Array<{
      scheduleId: number
      streamId: number
      start: Date
    }> = []
    for (const sid of scheduleIds) {
      const rows = await db
        .select({
          scheduleId: streamsTable.scheduleId,
          streamId: streamsTable.id,
          start: streamsTable.start,
        })
        .from(streamsTable)
        .where(
          and(eq(streamsTable.visible, true), eq(streamsTable.scheduleId, sid)),
        )
        .orderBy(asc(streamsTable.start))
        .all()
      for (const row of rows) {
        basePairs.push(row)
      }
    }

    if (basePairs.length === 0) {
      const groups = new Map<string, { day: Date; streams: UserStream[] }>()
      for (const us of hardcoded) {
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
      const days = Array.from(groups.values())
        .map(({ day, streams }) => ({
          day,
          streams: streams.sort(
            (a, b) => a.stream.start.getTime() - b.stream.start.getTime(),
          ),
        }))
        .sort((a, b) => a.day.getTime() - b.day.getTime())
      return { days }
    }

    // 3) Core stream details — query per pair to avoid too many SQL variables
    const detailMap = new Map<string, any>()
    for (const p of basePairs) {
      const rows = await db
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
            eq(streamsTable.scheduleId, p.scheduleId),
            eq(streamsTable.id, p.streamId),
          ),
        )
        .all()
      for (const s of rows) {
        detailMap.set(`${s.scheduleId}:${s.id}`, s)
      }
    }

    // 4) Tags per stream — query per pair
    const tagsMap = new Map<
      string,
      Array<{ name: string; slug: string; color: string }>
    >()
    for (const p of basePairs) {
      const tagRows = await db
        .select({
          scheduleId: streamTagsTable.scheduleId,
          streamId: streamTagsTable.streamId,
          name: tags.name,
          slug: tags.slug,
          color: tags.color,
        })
        .from(streamTagsTable)
        .innerJoin(tags, eq(streamTagsTable.tagId, tags.id))
        .where(
          and(
            eq(streamTagsTable.scheduleId, p.scheduleId),
            eq(streamTagsTable.streamId, p.streamId),
          ),
        )
        .all()
      for (const t of tagRows) {
        const key = `${t.scheduleId}:${t.streamId}`
        const arr = tagsMap.get(key) ?? []
        arr.push({ name: t.name, slug: t.slug, color: t.color })
        tagsMap.set(key, arr)
      }
    }

    // 5) Participants per stream — query per pair
    const participantsMap = new Map<
      string,
      Array<{
        userId: number
        primaryLiveStream: string
        createdAt: Date
        username: string
        profileImage: string
        twitchLogin: string | null
        tiltifySlug: string
        tiltifyUrl: string
        primaryColor: string | null
        accentColor: string | null
      }>
    >()
    for (const p of basePairs) {
      const rows = await db
        .select({
          scheduleId: streamParticipantsTable.scheduleId,
          streamId: streamParticipantsTable.streamId,
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
        .from(streamParticipantsTable)
        .innerJoin(
          userDisplayView,
          eq(streamParticipantsTable.userId, userDisplayView.userId),
        )
        .where(
          and(
            eq(streamParticipantsTable.scheduleId, p.scheduleId),
            eq(streamParticipantsTable.streamId, p.streamId),
          ),
        )
        .all()
      for (const r of rows) {
        const key = `${r.scheduleId}:${r.streamId}`
        const arr = participantsMap.get(key) ?? []
        arr.push({
          userId: r.userId,
          primaryLiveStream: r.primaryLiveStream,
          createdAt: r.createdAt,
          username: r.username,
          profileImage: r.profileImage,
          twitchLogin: r.twitchLogin,
          tiltifySlug: r.tiltifySlug,
          tiltifyUrl: r.tiltifyUrl,
          primaryColor: r.primaryColor,
          accentColor: r.accentColor,
        })
        participantsMap.set(key, arr)
      }
    }

    // 6) Load owners for the schedules
    const ownerIds = Array.from(new Set(scheduleRows.map((r) => r.ownerId)))
    let ownersMap = new Map<number, UserDisplay>()
    if (ownerIds.length > 0) {
      const owners: UserDisplay[] = []
      for (const oid of ownerIds) {
        const rows = await db
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
          .where(eq(userDisplayView.userId, oid))
          .all()
        owners.push(...(rows as any))
      }
      ownersMap = new Map(owners.map((o) => [o.userId, o]))
    }

    // 7) Compose UserStream objects from DB
    const dbUserStreams: UserStream[] = basePairs
      .map((pair) => {
        const key = `${pair.scheduleId}:${pair.streamId}`
        const core = detailMap.get(key)
        if (!core) return null
        const stream: Stream = {
          ...(core as any),
          tags: tagsMap.get(key) ?? [],
          participants: participantsMap.get(key) ?? [],
        }
        const ownerId = scheduleOwnerMap.get(pair.scheduleId)
        const owner = ownerId ? ownersMap.get(ownerId) : undefined
        return { stream, owner }
      })
      .filter((user) => {
        return user != null
      })

    // 8) Merge hardcoded user streams
    const allUserStreams: UserStream[] = [...dbUserStreams, ...hardcoded]

    // 9) Group by day (UTC) and sort
    const groups = new Map<string, { day: Date; streams: UserStream[] }>()
    for (const us of allUserStreams) {
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

    const days = Array.from(groups.values())
      .map(({ day, streams }) => ({
        day,
        streams: streams.sort(
          (a, b) => a.stream.start.getTime() - b.stream.start.getTime(),
        ),
      }))
      .sort((a, b) => a.day.getTime() - b.day.getTime())

    const result: FullCommunitySchedule = { days, streams: allUserStreams }

    await this.storage.put('full-community-schedule', result)
  }
}
