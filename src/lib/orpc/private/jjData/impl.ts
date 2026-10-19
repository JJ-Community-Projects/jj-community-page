import {
  contracts,
  type Currencies,
  type JJCampaignType,
  type Overview,
  type Stream,
  type UserDisplay,
  type UserWithInfo,
  UserWithInfoTags,
} from './contract.ts'
import { getJSON, putJSON } from '../util/cache.ts'
import { putCache } from '../../../services/kvCache.ts'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { implement, ORPCError } from '@orpc/server'
import { cacheMiddleware } from '../../middleware/cacheControl.ts'
import {
  and,
  asc,
  type Column,
  eq,
  gt,
  inArray,
  notInArray,
  sql,
} from 'drizzle-orm'
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
import { cached } from '../../middleware/cached.ts'
import { alias } from 'drizzle-orm/sqlite-core'
import { getUpcomingStreamsFromSchedule } from '../../../../content/getYogsScheduleFromContent.ts'
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
    const cached = await context.env.KV.get('campaigns', { cacheTtl: 60 })
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
      await putCache(context.env.KV, 'campaigns', JSON.stringify(sortedData), {
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
    const cached = await context.env.KV.get('campaigns-all', { cacheTtl: 60 })
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
      await putCache(context.env.KV, 'campaigns-all', JSON.stringify(sortedData), {
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
    const cached = await context.env.KV.get('causes', { cacheTtl: 60 })
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

      await putCache(context.env.KV, 'causes', JSON.stringify(causes), {
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
  .use(cached('upcoming', () => ''))
  .handler(async ({ context }) => {
    try {
      const db = context.db
      const now = new Date(Math.floor(Date.now() / 1000) * 1000)
      const year = new Date().getUTCFullYear()

      const userDisplay = {
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

      // 1) The next 2 upcoming or live visible streams of every visible primary schedule of the
      //    year (owner ids 0, 1 and 2 excluded), with the schedule's owner, chronological. A
      //    stream whose owner isn't in user_display_view is left out.
      const next = alias(streamsTable, 'next')
      const streamRows = await db
        .select({
          stream: {
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
          },
          owner: userDisplay,
        })
        .from(schedulesTable)
        .innerJoin(streamsTable, eq(streamsTable.scheduleId, schedulesTable.id))
        .innerJoin(
          userDisplayView,
          eq(userDisplayView.userId, schedulesTable.ownerId),
        )
        .where(
          and(
            eq(schedulesTable.year, year),
            eq(schedulesTable.visible, true),
            eq(schedulesTable.primary, true),
            notInArray(schedulesTable.ownerId, [0, 1, 2]),
            inArray(
              streamsTable.id,
              db
                .select({ id: next.id })
                .from(next)
                .where(
                  and(
                    eq(next.scheduleId, schedulesTable.id),
                    eq(next.visible, true),
                    // upcoming or live
                    gt(next.end, now),
                  ),
                )
                .orderBy(asc(next.start), asc(next.id))
                .limit(2),
            ),
          ),
        )
        .orderBy(
          asc(streamsTable.start),
          asc(streamsTable.scheduleId),
          asc(streamsTable.id),
        )
        .all()

      if (streamRows.length === 0) {
        return { count: 0, streams: [] }
      }

      // 2) Their tags and participants in one batch, keyed by the selected (schedule_id,
      //    stream_id) pairs passed as one JSON parameter: two bound parameters per pair would
      //    exceed D1's limit of 100 per statement.
      const selected = sql`json_each(${JSON.stringify(
        streamRows.map(({ stream }) => [stream.scheduleId, stream.id]),
      )}) as "selected"`
      const isSelected = (scheduleId: Column, streamId: Column) =>
        and(
          eq(scheduleId, sql`"selected"."value" ->> 0`),
          eq(streamId, sql`"selected"."value" ->> 1`),
        )

      const [tagRows, participantRows] = await db.batch([
        db
          .select({
            scheduleId: streamTagsTable.scheduleId,
            streamId: streamTagsTable.streamId,
            name: tags.name,
            slug: tags.slug,
            color: tags.color,
          })
          .from(selected)
          .innerJoin(
            streamTagsTable,
            isSelected(streamTagsTable.scheduleId, streamTagsTable.streamId),
          )
          .innerJoin(tags, eq(streamTagsTable.tagId, tags.id))
          .orderBy(
            asc(streamTagsTable.scheduleId),
            asc(streamTagsTable.streamId),
            asc(streamTagsTable.tagId),
          ),
        db
          .select({
            scheduleId: streamParticipantsTable.scheduleId,
            streamId: streamParticipantsTable.streamId,
            ...userDisplay,
          })
          .from(selected)
          .innerJoin(
            streamParticipantsTable,
            isSelected(
              streamParticipantsTable.scheduleId,
              streamParticipantsTable.streamId,
            ),
          )
          .innerJoin(
            userDisplayView,
            eq(streamParticipantsTable.userId, userDisplayView.userId),
          )
          .orderBy(
            asc(streamParticipantsTable.scheduleId),
            asc(streamParticipantsTable.streamId),
            asc(streamParticipantsTable.userId),
          ),
      ])

      const tagsMap = new Map<string, Stream['tags']>()
      for (const { scheduleId, streamId, ...tag } of tagRows) {
        const key = `${scheduleId}:${streamId}`
        const arr = tagsMap.get(key) ?? []
        arr.push(tag)
        tagsMap.set(key, arr)
      }

      const participantsMap = new Map<string, UserDisplay[]>()
      for (const { scheduleId, streamId, ...user } of participantRows) {
        const key = `${scheduleId}:${streamId}`
        const arr = participantsMap.get(key) ?? []
        arr.push(user)
        participantsMap.set(key, arr)
      }

      const streams = streamRows.map(({ stream, owner }) => {
        const key = `${stream.scheduleId}:${stream.id}`
        return {
          stream: {
            ...stream,
            tags: tagsMap.get(key) ?? [],
            participants: participantsMap.get(key) ?? [],
          },
          owner,
        }
      })

      return { count: streams.length, streams }
    } catch (e) {
      console.error('upcoming-streams', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  })

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

async function getUsers(db: JJDrizzleDatabase): Promise<UserWithInfo[]> {
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

const getAllUsersWithInfo = os.getAllUsersWithInfoContract
  .use(cached('userDirectory', () => ''))
  .handler(async ({ context }) => getUsers(context.db))

const getUserCampaignPairs = os.getUserCampaignPairsContract.handler(
  async ({ context }) => {
    const cache = await context.env.KV.get('getUserCampaignPairs', { cacheTtl: 60 })

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

    await putCache(context.env.KV, 'getUserCampaignPairs', JSON.stringify(pairs), {
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
  const yogs = await stub.getCampaignByUserSlug('yogscast')
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
      return {
        days,
        streams: Array.isArray(cached.streams)
          ? cached.streams.map(reviveUserStream)
          : [],
      }
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

// Local helpers to map Yogs creators to UserDisplay shape
function twitchLoginFromUrl(url?: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const seg = u.pathname.split('/').filter(Boolean)[0]
    return seg || null
  } catch {
    const m = url.match(/twitch\.tv\/([^/?#]+)/i)
    return m?.[1] ?? null
  }
}

function yogsCreatorToUser(yog: any): UserDisplay {
  const links = Array.isArray(yog?.links) ? yog.links : []
  const twitchLink = links.find(
    (l: any) => String(l.type).toLowerCase() === 'twitch',
  )
  const youtubeLink = links.find(
    (l: any) => String(l.type).toLowerCase() === 'youtube',
  )

  return {
    userId: -1,
    primaryLiveStream: twitchLink ? 'twitch' : 'youtube',
    createdAt: new Date('2020-01-01T00:00:00.000Z'),
    username: yog?.name ?? 'Unknown',
    profileImage:
      yog?.imageUrl ||
      'https://static-cdn.jtvnw.net/jtv_user_pictures/29532548-dedd-4898-84cb-62782f64ef30-profile_image-70x70.png',
    twitchLogin: twitchLoginFromUrl(twitchLink?.url),
    youtubeUrl: youtubeLink?.url ?? null,
    tiltifySlug: '',
    tiltifyUrl: '',
    primaryColor: yog?.color ?? '#E30E50',
    accentColor: '#E30E50',
  }
}

const headliner = os.headlinerContract.handler(async ({ context }) => {
  const streams = await getUpcomingStreamsFromSchedule('2025-headliner')
  return streams
    .map((s) => {
      const owner = s.owner ? yogsCreatorToUser(s.owner) : undefined
      const participants = s.creators?.map((c) => yogsCreatorToUser(c)) ?? []
      return {
        stream: {
          id: -1,
          scheduleId: 1,
          createdBy: -1,
          title: s.title,
          visible: true,
          subtitle: s.subtitle ?? null,
          description: s.description ?? null,
          youtubeVodUrl: null,
          twitchVodUrl: null,
          start: s.start,
          end: s.end,
          isTimeTBD: false,
          participants,
          tags: [],
        },
        owner,
      }
    })
    .slice(0, 6)
})

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
  headliner,
  /*
  causeById,
  campaignLookup,
  campaignPastLookup,
  campaignByUserSlug,
  campaignByUserId,
  campaignByTwitchId,*/
}
