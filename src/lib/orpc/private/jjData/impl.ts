import {
  contracts,
  type Currencies,
  type JJCampaignType,
  type Overview,
  type Stream,
  type UserDisplay,
  type UserStream,
  type UserWithInfo,
  UserWithInfoTags,
} from './contract.ts'
import { getJSON, putJSON } from '../util/cache.ts'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { implement, ORPCError } from '@orpc/server'
import { cacheMiddleware } from '../../middleware/cacheControl.ts'
import { and, asc, eq, inArray, not, or, sql } from 'drizzle-orm'
import {
  schedulesTable,
  streamParticipantsTable,
  streamsTable,
} from '../../../db/schema/jj-schema.ts'
import {
  streamTagsTable,
  tags,
  userTagsTable,
} from '../../../db/schema/tags-schema.ts'
import {
  tagUserCountsView,
  userDisplayView,
} from '../../../db/schema/views-schema.ts'
import { UserDisplaySchema } from '../../public/schemas/UserDisplaySchema.ts'
import type { JJDrizzleDatabase } from '../../../db/db.ts'
import {
  getHardCodedEvents,
  getHardCodedEventsJustYogs,
  getHardCodedEventsNoYogs,
} from './getHardCodedEvents.ts'
import { loadUsersWithInfo, storeUsersWithInfo } from './usersWithInfoCache.ts'
// New: get campaign by Twitch id

const jjDataCacheMiddleware = cacheMiddleware({
  maxAge: 30,
  sMaxAge: 60,
  staleWhileRevalidate: 30,
})

const os = implement(contracts).use(dbMiddleware).use(jjDataCacheMiddleware)

// List all campaigns from DO cache
const campaigns = os.campaignsContract
  .use(
    cacheMiddleware({
      maxAge: 60,
      sMaxAge: 60,
      staleWhileRevalidate: 30,
    }),
  )
  .handler(async ({ context }) => {
    // KV cache
    const cached = await context.env.KV.get('campaigns')
    if (cached) {
      return JSON.parse(cached)
    }

    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      const data = await stub.getCommunityCampaignsDisplay()
      if (!data) {
        return {
          count: 0,
          list: [],
        }
      }
      // Sort the campaigns list following the same pattern used in
      // src/lib/orpc/public/twitchExtension/impl.ts campaigns procedure:
      // 1) campaigns with twitch channel that are live
      // 2) campaigns with twitch channel that are not live
      // 3) all other campaigns
      // Additionally, sort by raised.gbp (descending) within each group
      const list = Array.isArray((data as any).list) ? (data as any).list : []
      const getGroupRank = (it: any) => {
        const hasTwitch = Boolean(it?.twitch?.name ?? it?.twitch)
        const isLive = Boolean(it?.twitch?.isLive ?? it?.isTwitchLive)
        if (hasTwitch) {
          return isLive ? 0 : 1
        }
        return 2
      }
      const getRaisedGbp = (it: any) => {
        const val = it?.raised?.gbp
        return typeof val === 'number' ? val : 0
      }
      const sortedList = (list as any).toSorted
        ? (list as any).toSorted((a: any, b: any) => {
            const ga = getGroupRank(a)
            const gb = getGroupRank(b)
            if (ga !== gb) return ga - gb
            const ra = getRaisedGbp(a)
            const rb = getRaisedGbp(b)
            if (ra !== rb) return rb - ra
            return 0
          })
        : [...list].sort((a: any, b: any) => {
            const ga = getGroupRank(a)
            const gb = getGroupRank(b)
            if (ga !== gb) return ga - gb
            const ra = getRaisedGbp(a)
            const rb = getRaisedGbp(b)
            if (ra !== rb) return rb - ra
            return 0
          })

      const sortedData = { ...(data as any), list: sortedList }
      // store in KV for 60s
      await context.env.KV.put('campaigns', JSON.stringify(sortedData), {
        expirationTtl: 60,
      })
      return sortedData
    } catch (e) {
      console.error(e)
      throw e
    }
  })
// List all campaigns from DO cache
const campaignsAll = os.campaignsContract
  .use(
    cacheMiddleware({
      maxAge: 60,
      sMaxAge: 60,
      staleWhileRevalidate: 30,
    }),
  )
  .handler(async ({ context }) => {
    // KV cache
    const cached = await context.env.KV.get('campaigns-all')
    if (cached) {
      return JSON.parse(cached)
    }

    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      const data = await stub.getCommunityCampaignsDisplayAll()
      if (!data) {
        return {
          count: 0,
          list: [],
        }
      }
      // Sort the campaigns list following the same pattern used in
      // src/lib/orpc/public/twitchExtension/impl.ts campaigns procedure:
      // 1) campaigns with twitch channel that are live
      // 2) campaigns with twitch channel that are not live
      // 3) all other campaigns
      // Additionally, sort by raised.gbp (descending) within each group
      const list = Array.isArray((data as any).list) ? (data as any).list : []
      const getGroupRank = (it: any) => {
        const hasTwitch = Boolean(it?.twitch?.name ?? it?.twitch)
        const isLive = Boolean(it?.twitch?.isLive ?? it?.isTwitchLive)
        if (hasTwitch) {
          return isLive ? 0 : 1
        }
        return 2
      }
      const getRaisedGbp = (it: any) => {
        const val = it?.raised?.gbp
        return typeof val === 'number' ? val : 0
      }
      const sortedList = (list as any).toSorted
        ? (list as any).toSorted((a: any, b: any) => {
            const ga = getGroupRank(a)
            const gb = getGroupRank(b)
            if (ga !== gb) return ga - gb
            const ra = getRaisedGbp(a)
            const rb = getRaisedGbp(b)
            if (ra !== rb) return rb - ra
            return 0
          })
        : [...list].sort((a: any, b: any) => {
            const ga = getGroupRank(a)
            const gb = getGroupRank(b)
            if (ga !== gb) return ga - gb
            const ra = getRaisedGbp(a)
            const rb = getRaisedGbp(b)
            if (ra !== rb) return rb - ra
            return 0
          })

      const sortedData = { ...(data as any), list: sortedList }
      // store in KV for 60s
      await context.env.KV.put('campaigns-all', JSON.stringify(sortedData), {
        expirationTtl: 60,
      })
      return sortedData
    } catch (e) {
      console.error(e)
      throw e
    }
  })

// List all causes from DO cache
const causes = os.causesContract
  .use(
    cacheMiddleware({
      maxAge: 60,
      sMaxAge: 60,
      staleWhileRevalidate: 30,
    }),
  )
  .handler(async ({ context }) => {
    // KV cache
    const cached = await context.env.KV.get('causes')
    if (cached) {
      return JSON.parse(cached)
    }

    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)

    try {
      const causes = await stub.getCausesDisplay()
      if (!causes) {
        return { count: 0, causes: [] }
      }

      await context.env.KV.put('causes', JSON.stringify(causes), {
        expirationTtl: 60,
      })
      return causes
    } catch (e) {
      console.error(e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  })

const upcomingStreams = os.upcomingStreamsContract
  .use(
    cacheMiddleware({
      maxAge: 300,
      sMaxAge: 300,
      staleWhileRevalidate: 150,
    }),
  )
  .handler(async ({ context }) => {
    try {
      // KV cache (revive Date fields)
      const cached = await getJSON<any>(context.env.KV, 'upcomingStreams')
      if (cached) {
        return reviveUpcomingStreamsResult(cached)
      }

      const hardcodedStreams = await getHardCodedEvents()
      const db = context.db
      const nowSec = Math.floor(Date.now() / 1000)
      const year = new Date().getUTCFullYear()

      // 1) Find visible primary schedules for current year (with owners)
      const scheduleRows = await db
        .select({ id: schedulesTable.id, ownerId: schedulesTable.ownerId })
        .from(schedulesTable)
        .where(
          and(
            eq(schedulesTable.year, year),
            eq(schedulesTable.visible, true),
            eq(schedulesTable.primary, true),
            not(eq(schedulesTable.ownerId, 0)),
            not(eq(schedulesTable.ownerId, 1)),
            not(eq(schedulesTable.ownerId, 2)),
          ),
        )
        .all()

      const scheduleIds = scheduleRows.map((s) => s.id)
      const scheduleOwnerMap = new Map<number, number>(
        scheduleRows.map((r) => [r.id, r.ownerId]),
      )
      if (scheduleIds.length === 0) {
        return {
          count: hardcodedStreams.length,
          streams: [...hardcodedStreams],
        }
      }

      // 2) Identify upcoming or currently-live visible streams across those schedules
      //    Avoid giant OR(...) over scheduleIds by joining schedules with filters.
      const basePairs = await db
        .select({
          scheduleId: streamsTable.scheduleId,
          streamId: streamsTable.id,
          start: streamsTable.start,
        })
        .from(streamsTable)
        .innerJoin(
          schedulesTable,
          eq(streamsTable.scheduleId, schedulesTable.id),
        )
        .where(
          and(
            eq(streamsTable.visible, true),
            eq(schedulesTable.year, year),
            eq(schedulesTable.visible, true),
            eq(schedulesTable.primary, true),
            // exclude special owner ids (0,1,2)
            not(eq(schedulesTable.ownerId, 0)),
            not(eq(schedulesTable.ownerId, 1)),
            not(eq(schedulesTable.ownerId, 2)),
            // upcoming or live
            sql`${streamsTable.start} >= ${nowSec} OR (${streamsTable.start} <= ${nowSec} AND ${streamsTable.end} > ${nowSec})`,
          ),
        )
        .orderBy(asc(streamsTable.start))
        .all()

      if (basePairs.length === 0) {
        return {
          count: hardcodedStreams.length,
          streams: [...hardcodedStreams],
        }
      }

      // Limit to next 2 streams per schedule (based on ascending start order)
      const limitedPairs = (() => {
        const counts = new Map<number, number>()
        const acc: typeof basePairs = []
        for (const p of basePairs) {
          const c = counts.get(p.scheduleId) ?? 0
          if (c < 2) {
            acc.push(p)
            counts.set(p.scheduleId, c + 1)
          }
        }
        return acc
      })()

      // Group selected pairs by schedule to keep follow-up queries tiny (<= 2 ids per schedule)
      const pairsBySchedule = new Map<number, number[]>()
      for (const p of limitedPairs) {
        const arr = pairsBySchedule.get(p.scheduleId) ?? []
        arr.push(p.streamId)
        pairsBySchedule.set(p.scheduleId, arr)
      }

      // 3) Load stream core details (per schedule, using small IN lists)
      const detailMap = new Map<string, any>()
      for (const [sid, ids] of pairsBySchedule) {
        const streamDetails = await db
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
          .where(and(eq(streamsTable.scheduleId, sid), inArray(streamsTable.id, ids)))
          .all()
        for (const s of streamDetails) {
          detailMap.set(`${s.scheduleId}:${s.id}`, s)
        }
      }

      // 4) Load tags for selected streams (per schedule)
      const tagsMap = new Map<
        string,
        Array<{ name: string; slug: string; color: string }>
      >()
      for (const [sid, ids] of pairsBySchedule) {
        if (ids.length === 0) continue
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
              eq(streamTagsTable.scheduleId, sid),
              inArray(streamTagsTable.streamId, ids),
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

      // 5) Load participants for selected streams (per schedule)
      const participantRows: Array<{
        scheduleId: number
        streamId: number
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
      }> = []
      for (const [sid, ids] of pairsBySchedule) {
        if (ids.length === 0) continue
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
              eq(streamParticipantsTable.scheduleId, sid),
              inArray(streamParticipantsTable.streamId, ids),
            ),
          )
          .all()
        participantRows.push(...rows)
      }

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

      for (const p of participantRows) {
        const key = `${p.scheduleId}:${p.streamId}`
        const arr = participantsMap.get(key) ?? []
        arr.push({
          userId: p.userId,
          primaryLiveStream: p.primaryLiveStream,
          createdAt: p.createdAt,
          username: p.username,
          profileImage: p.profileImage,
          twitchLogin: p.twitchLogin,
          tiltifySlug: p.tiltifySlug,
          tiltifyUrl: p.tiltifyUrl,
          primaryColor: p.primaryColor,
          accentColor: p.accentColor,
        })
        participantsMap.set(key, arr)
      }

      // 6) Load owners for the schedules
      const ownerIds = Array.from(new Set(scheduleRows.map((r) => r.ownerId)))
      let ownersMap = new Map<number, any>()
      if (ownerIds.length > 0) {
        const owners = await db
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
          .where(inArray(userDisplayView.userId as any, ownerIds as any))
          .all()
        ownersMap = new Map(owners.map((o) => [o.userId, o]))
      }

      // 7) Compose final user streams preserving chronological order
      const userStreams: UserStream[] = limitedPairs
        .map((pair) => {
          const key = `${pair.scheduleId}:${pair.streamId}`
          const core = detailMap.get(key)
          if (!core) return null
          const stream: Stream = {
            ...(core as any),
            tags: tagsMap.get(key) ?? [],
            participants: participantsMap.get(key) ?? [],
          }
          const ownerId = scheduleOwnerMap.get(pair.scheduleId)!
          const owner: UserDisplay = ownersMap.get(ownerId)
          if (!owner) return null
          return { stream, owner }
        })
        .filter((user) => {
          return user != null
        })

      const composed = [...userStreams, ...hardcodedStreams]

      composed.sort(
        (a, b) => a.stream.start.getTime() - b.stream.start.getTime(),
      )

      const result = { count: composed.length, streams: composed }

      await putJSON(context.env.KV, 'upcomingStreams', result, 300)

      return result
    } catch (e) {
      console.error('upcoming-streams', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  })

// Helpers to revive Dates for upcomingStreams cache
function reviveUpcomingStreamsResult(data: any) {
  const revived = {
    count: Number(data?.count ?? 0),
    streams: Array.isArray(data?.streams)
      ? data.streams.map(reviveUserStream)
      : [],
  }
  return revived
}

function reviveUserStream(item: any) {
  const stream = item?.stream ?? {}
  const owner = item?.owner ?? {}
  const revived = {
    stream: {
      ...stream,
      start: new Date(stream.start),
      end: new Date(stream.end),
      // tags/participants handled below
      tags: Array.isArray(stream.tags) ? stream.tags : [],
      participants: Array.isArray(stream.participants)
        ? stream.participants.map(reviveUserDisplay)
        : [],
    },
    owner: reviveUserDisplay(owner),
  }
  return revived
}

function reviveUserDisplay(u: any) {
  if (!u || typeof u !== 'object') return u
  return {
    ...u,
    createdAt: u.createdAt ? new Date(u.createdAt) : u?.createdAt,
  }
}

async function getUsers(
  db: JJDrizzleDatabase,
): Promise<UserWithInfo[]> {
  try {
    const currentYear = new Date().getFullYear()
    // Subquery: aggregate tags per user into JSON
    // Step 1: Build a subquery that ranks tags per-user by global popularity
    const topTagsPerUser = db
      .select({
        userId: userTagsTable.userId,
        tagId: tagUserCountsView.tagId,
        tagName: tagUserCountsView.tagName,
        tagSlug: tagUserCountsView.tagSlug,
        color: tags.color,
        usage: tagUserCountsView.userCount,
        rn: sql<number>`row_number() over (
      partition by ${userTagsTable.userId}
      order by ${tagUserCountsView.userCount} desc, ${tagUserCountsView.tagName} asc
    )`.as('rn'),
      })
      .from(userTagsTable)
      .leftJoin(tags, eq(userTagsTable.tagId, tags.id))
      .leftJoin(tagUserCountsView, eq(tagUserCountsView.tagId, tags.id))
      // Optional: only consider visible tags
      .where(eq(tagUserCountsView.tagVisible, true))
      .as('top_tags')

    // Step 2: Keep only the top 3 (rn <= 3) and aggregate to JSON per user
    const tagsAgg = db
      .select({
        userId: topTagsPerUser.userId,
        tagsJson: sql<string>`json_group_array(json_object(
      'tagId', ${topTagsPerUser.tagId},
      'name', ${topTagsPerUser.tagName},
      'slug', ${topTagsPerUser.tagSlug},
      'color', ${topTagsPerUser.color},
      'usage', ${topTagsPerUser.usage}
    ))`.as('tags_json'),
      })
      .from(topTagsPerUser)
      // .where(sql`${topTagsPerUser.rn} <= 3`)
      .groupBy(topTagsPerUser.userId)
      .as('tags_agg')

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
        // Use the pre-aggregated JSON; COALESCE to empty array when no tags
        tags: sql<string>`COALESCE(${tagsAgg.tagsJson}, '[]')`,
        // Select schedule slug if a primary current-year schedule exists; build URL in mapping to avoid SQL ambiguity
        scheduleSlug: sql<string>`${schedulesTable.slug}`.as('schedule_slug'),
      })
      .from(userDisplayView)
      .leftJoin(tagsAgg, eq(userDisplayView.userId, tagsAgg.userId))
      .leftJoin(
        schedulesTable,
        and(
          eq(userDisplayView.userId, schedulesTable.ownerId),
          eq(schedulesTable.year, currentYear),
          eq(schedulesTable.visible, true),
          eq(schedulesTable.primary, true),
        ),
      )
      .all()

    const result: UserWithInfo[] = rows.map((r) => ({
      ...UserDisplaySchema.parse(r),
      tags: JSON.parse(r.tags).map((t: unknown) =>
        UserWithInfoTags.parse(t),
      ) as UserWithInfoTags[],
      scheduleUrl: (r as any).scheduleSlug
        ? `/schedules/${(r as any).scheduleSlug}`
        : undefined,
    }))

    return result
  } catch (e) {
    console.error(e)
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }
}

const getAllUsersWithInfo = os.getAllUsersWithInfoContract.handler(
  async ({ context }) => {
    const cached = await loadUsersWithInfo(context.env.KV, 'getAllUsersWithInfo')
    if (cached) {
      console.log('getAllUsersWithInfo','cache', cached.length)
      return cached
    }

    const users = await getUsers(context.db)
    console.log('getAllUsersWithInfo', users.length)
    await storeUsersWithInfo(context.env.KV, 'getAllUsersWithInfo', users, 300)
    return users
  },
)

const getUserCampaignPairs = os.getUserCampaignPairsContract.handler(
  async ({ context }) => {
    const cache = await context.env.KV.get('getUserCampaignPairs')

    if (cache) {
      return JSON.parse(cache)
    }

    const users: UserWithInfo[] = await getUsers(context.db)

    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    const data = await stub.getCommunityCampaignsDisplay()
    if (!data) {
      throw new ORPCError('NOT_FOUND', {
        message: 'No campaigns found',
      })
    }
    const campaignList: JJCampaignType[] = data.list

    const usersBySlug = new Map<string, UserWithInfo>()
    for (const u of users) {
      const slug = u.tiltifySlug
      usersBySlug.set(slug, u)
    }
    const campaignsBySlug = new Map<string, JJCampaignType>()
    for (const c of campaignList) {
      const slug = c.tiltifySlug
      campaignsBySlug.set(slug, c)
    }

    const slugs = new Set([...usersBySlug.keys(), ...campaignsBySlug.keys()])

    const pairs: Array<{ user?: UserWithInfo; campaign?: JJCampaignType }> = []

    for (const slug of slugs) {
      const user = usersBySlug.get(slug)
      const campaign = campaignsBySlug.get(slug)
      pairs.push({ user, campaign })
    }

    // Sort pairs by priority:
    // 1) live channel (campaign.isTwitchLive)
    // 2) user is defined
    // 3) campaign.twitch is defined
    // 4) user.scheduleUrl is defined
    // 5) campaign.raised.gbp (descending)
    pairs.sort((a, b) => {
      const aLive = a.campaign?.isTwitchLive === true
      const bLive = b.campaign?.isTwitchLive === true
      if (aLive !== bLive) return aLive ? -1 : 1

      const aHasUser = !!a.user
      const bHasUser = !!b.user
      if (aHasUser !== bHasUser) return aHasUser ? -1 : 1

      const aHasTwitch = !!a.campaign?.twitch
      const bHasTwitch = !!b.campaign?.twitch
      if (aHasTwitch !== bHasTwitch) return aHasTwitch ? -1 : 1

      const aHasSchedule = !!a.user?.scheduleUrl
      const bHasSchedule = !!b.user?.scheduleUrl
      if (aHasSchedule !== bHasSchedule) return aHasSchedule ? -1 : 1

      const aRaised = a.campaign?.raised?.gbp ?? 0
      const bRaised = b.campaign?.raised?.gbp ?? 0
      return bRaised - aRaised
    })

    await context.env.KV.put('getUserCampaignPairs', JSON.stringify(pairs), {
      expirationTtl: 180,
    })

    return pairs
  },
)

async function loadOverview(kv: KVNamespace): Promise<Overview | null> {
  const data = await getJSON<any>(kv, 'twitch-extension:overview')
  if (!data) return null
  const revived: Overview = {
    raised: data.raised,
    collections: data.collections,
    donations: Number(data.donations ?? 0),
    date: new Date(data.date),
  }
  return revived
}
async function storeOverview(
  kv: KVNamespace,
  data: Overview,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, 'twitch-extension:overview', data, ttlSeconds)
}

function valueToCurrencies(
  value: number,
  usdConversionRate: number,
  eurConversionRate: number,
): Currencies {
  const GBP = Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  })
  const USD = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  const EUR = Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  })
  const usd = parseFloat((value * usdConversionRate).toFixed(2))
  const euro = parseFloat((value * eurConversionRate).toFixed(2))
  return {
    gbp: value,
    usd: usd,
    euro: euro,
    gbpFormatted: GBP.format(value),
    usdFormatted: USD.format(usd),
    euroFormatted: EUR.format(euro),
  }
}

const overview = os.overviewContract.handler(async ({ context }) => {
  // Try KV cache first
  const cached = await loadOverview(context.env.KV)
  if (cached) {
    return cached
  }

  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)

  const usdRate = await stub.getDollarConversionRate()
  const eurRate = await stub.getGbpToEurRate()
  const raised = await stub.getRaised()
  const collections = await stub.getCollections()
  const donations = await stub.getDonations()
  const dateStr = await stub.getDate()
  const yogs = await stub.getCampaignBySlug('yogscast')
  const overview: Overview = {
    raised: {
      yogscast: yogs
        ? valueToCurrencies(yogs!.raised, usdRate, eurRate)
        : undefined,
      fundraisers: yogs
        ? valueToCurrencies(raised - yogs!.raised, usdRate, eurRate)
        : undefined,
      total: valueToCurrencies(raised, usdRate, eurRate),
    },
    collections: collections,
    donations: donations,
    date: new Date(dateStr),
  }

  await storeOverview(context.env.KV, overview, 60)

  return overview
})

const fullSchedule = os.fullScheduleContract.handler(async ({ context }) => {
  try {
    const year = new Date().getUTCFullYear()
    const cacheKey = `jj:fullSchedule:${year}`
    const cached = await getJSON<any>(context.env.KV, cacheKey)
    if (cached && Array.isArray(cached.days)) {
      // Revive Dates from ISO strings for UserStream shape
      const days = cached.days.map((d: any) => ({
        day: new Date(d.day),
        streams: Array.isArray(d.streams)
          ? d.streams.map(reviveUserStream)
          : [],
      }))
      return { days }
    }
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    const result = await stub.getFullSchedule()
    if (!result) {
      throw new ORPCError('NOT_FOUND')
    }
    await putJSON(context.env.KV, cacheKey, result, 300)
    return result
  } catch (e) {
    console.error('fullSchedule', e)
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }
})

const hardcodedStreams = os.hardcodedStreamsContract.handler(
  async ({ context }) => {
    const hardcodedNonYogs = await getHardCodedEventsNoYogs()
    const hardcodedYogs = await getHardCodedEventsJustYogs()
    return {
      yogs: hardcodedYogs,
      nonYogs: hardcodedNonYogs,
    }
  },
)

export const jjRouter = {
  campaigns,
  causes,
  upcomingStreams,
  getAllUsersWithInfo,
  getUserCampaignPairs,
  overview,
  campaignsAll,
  fullSchedule,
  hardcodedStreams,
  /*
  causeById,
  campaignLookup,
  campaignPastLookup,
  campaignByUserSlug,
  campaignByUserId,
  campaignByTwitchId,*/
}
