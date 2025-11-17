import {
  contracts,
  type JJCampaignType,
  type UserWithInfo,
  UserWithInfoTags,
} from './contract.ts'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { implement, ORPCError } from '@orpc/server'
import { cacheMiddleware } from '../../middleware/cacheControl.ts'
import { and, asc, eq, or, sql } from 'drizzle-orm'
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
      console.log(data.list[0])
      return data
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
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)

    try {
      const causes = await stub.getCausesDisplay()
      if (!causes) {
        return { count: 0, causes: [] }
      }

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
        ),
      )
      .all()

    const scheduleIds = scheduleRows.map((s) => s.id)
    const scheduleOwnerMap = new Map<number, number>(
      scheduleRows.map((r) => [r.id, r.ownerId]),
    )
    if (scheduleIds.length === 0) {
      return { count: 0, streams: [] }
    }

    // 2) Identify upcoming or currently-live visible streams across those schedules
    const basePairs = await db
      .select({
        scheduleId: streamsTable.scheduleId,
        streamId: streamsTable.id,
        start: streamsTable.start,
      })
      .from(streamsTable)
      .where(
        and(
          eq(streamsTable.visible, true),
          // in schedules set
          or(...scheduleIds.map((id) => eq(streamsTable.scheduleId, id))),
          // upcoming or live
          sql`${streamsTable.start} >= ${nowSec} OR (${streamsTable.start} <= ${nowSec} AND ${streamsTable.end} > ${nowSec})`,
        ),
      )
      .orderBy(asc(streamsTable.start))
      .all()

    if (basePairs.length === 0) {
      return { count: 0, streams: [] }
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

    // Build OR of composite keys for subsequent queries
    const pairConditionStreams = or(
      ...limitedPairs.map((p) =>
        and(
          eq(streamsTable.scheduleId, p.scheduleId),
          eq(streamsTable.id, p.streamId),
        ),
      ),
    )

    // 3) Load stream core details
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
      .where(pairConditionStreams)
      .all()

    const detailMap = new Map<string, any>()
    for (const s of streamDetails) {
      detailMap.set(`${s.scheduleId}:${s.id}`, s)
    }

    // 4) Load tags for selected streams
    const pairConditionTags = or(
      ...limitedPairs.map((p) =>
        and(
          eq(streamTagsTable.scheduleId, p.scheduleId),
          eq(streamTagsTable.streamId, p.streamId),
        ),
      ),
    )
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
      .where(pairConditionTags)
      .all()

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

    // 5) Load participants for selected streams
    const pairConditionParticipants = or(
      ...limitedPairs.map((p) =>
        and(
          eq(streamParticipantsTable.scheduleId, p.scheduleId),
          eq(streamParticipantsTable.streamId, p.streamId),
        ),
      ),
    )

    const participantRows = await db
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
      .where(pairConditionParticipants)
      .all()

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
      const ownerConds = or(
        ...ownerIds.map((id) => eq(userDisplayView.userId, id)),
      )
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
        .where(ownerConds)
        .all()
      ownersMap = new Map(owners.map((o) => [o.userId, o]))
    }

    // 7) Compose final user streams preserving chronological order
    const composed = limitedPairs
      .map((pair) => {
        const key = `${pair.scheduleId}:${pair.streamId}`
        const core = detailMap.get(key)
        if (!core) return null
        const stream = {
          ...(core as any),
          tags: tagsMap.get(key) ?? [],
          participants: participantsMap.get(key) ?? [],
        }
        const ownerId = scheduleOwnerMap.get(pair.scheduleId)!
        const owner = ownersMap.get(ownerId)
        if (!owner) return null
        return { stream, owner }
      })
      .filter(Boolean) as any[]

    composed.sort((a, b) => a.stream.start.getTime() - b.stream.start.getTime())

    return { count: composed.length, streams: composed }
  })

async function getUsers(db: JJDrizzleDatabase) {
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

    console.log(result)
    return result
  } catch (e) {
    console.error(e)
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }
}

const getAllUsersWithInfo = os.getAllUsersWithInfoContract.handler(
  async ({ context }) => {
    return getUsers(context.db)
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
      expirationTtl: 60,
    })

    return pairs
  },
)

/*
// Get a single cause by id from DO cache (current year)
const causeById = os.causeByIdContract.handler(async ({ input, context }) => {
  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  const cause = await stub.getCause(input.id)
  if (!cause) {
    return null
  }
  return cause
})

// Current-year campaign lookup (DO only), returns a single campaign or null
const campaignLookup = os.campaignLookupContract.handler(
  async ({ input, context }) => {
    const { userId, userSlug, campaignId } = input

    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)

    if (userId !== undefined) {
      const c = await stub.getCampaign(userId)
      return c ?? null
    }

    const campaigns = await stub.getCampaigns()
    if (!campaigns) return null

    if (userSlug !== undefined) {
      return campaigns.find((c: any) => c.user.slug === userSlug) ?? null
    }
    if (campaignId !== undefined) {
      return campaigns.find((c: any) => c.slug === campaignId) ?? null
    }

    return null
  },
)

// Past campaigns lookup (DB), returns array; if year omitted, returns all matching years
const campaignPastLookup = os.campaignPastLookupContract.handler(
  async ({ input, context }) => {
    const { year, userId, userSlug, campaignId } = input as any

    // Helper to map a DB row to JJCampaign shape
    const mapRow = (row: any) => ({
      causeId: row.causeId ?? null,
      name: row.name ?? '',
      description: row.description ?? '',
      slug: row.slug ?? '',
      url: row.url ?? '',
      startTime: row.startTime,
      raised: Number(row.raised ?? 0),
      goal: Number(row.goal ?? 0),
      livestream: row.livestream ?? { channel: null, type: '' },
      user: {
        id: row.userId ?? 0,
        name: row.userName ?? '',
        slug: row.userSlug ?? '',
        avatar: row.userAvatar ?? '',
        url: row.userUrl ?? '',
      },
    })

    const db = context.db
    const conds: any[] = []
    if (year !== undefined) conds.push(eq(jjCampaign.year, year))

    if (userId !== undefined) {
      conds.push(eq(jjCampaign.userId, userId))
    } else if (userSlug !== undefined) {
      conds.push(eq(jjCampaign.userSlug, userSlug))
    } else if (campaignId !== undefined) {
      conds.push(eq(jjCampaign.slug, campaignId))
    } else {
      // No discriminator provided; return empty array
      return []
    }

    const rows = conds.length
      ? await db
          .select()
          .from(jjCampaign)
          .where(and(...conds))
      : await db.select().from(jjCampaign)

    if (!rows?.length) return []
    return rows.map(mapRow)
  },
) as any

// New: get campaign by user slug
const campaignByUserSlug = os.campaignByUserSlugContract.handler(
  async ({ input, context }) => {
    const { slug } = input
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)

    // Try DO campaigns first (current year)
    const campaigns = await stub.getCampaigns()
    const found = campaigns?.find((c: any) => c.user.slug === slug) || null
    if (found) return found

    // Fallback: query DB for latest by year
    const db = context.db
    const rows = await db
      .select()
      .from(jjCampaign)
      .where(eq(jjCampaign.userSlug, slug))
    if (!rows?.length) return null
    const latest = rows.reduce((a: any, b: any) => (a.year > b.year ? a : b))
    return {
      causeId: latest.causeId ?? null,
      name: latest.name ?? '',
      description: latest.description ?? '',
      slug: latest.slug ?? '',
      url: latest.url ?? '',
      startTime: latest.startTime,
      raised: Number(latest.raised ?? 0),
      goal: Number(latest.goal ?? 0),
      livestream: latest.livestream ?? { channel: null, type: '' },
      user: {
        id: latest.userId ?? 0,
        name: latest.userName ?? '',
        slug: latest.userSlug ?? '',
        avatar: latest.userAvatar ?? '',
        url: latest.userUrl ?? '',
      },
    }
  },
)

// New: get campaign by user id
const campaignByUserId = os.campaignByUserIdContract.handler(
  async ({ input, context }) => {
    const { userId } = input
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)

    const current = await stub.getCampaign(userId)
    if (current) return current

    // Fallback to DB latest by year
    const db = context.db
    const rows = await db
      .select()
      .from(jjCampaign)
      .where(eq(jjCampaign.userId, userId))
    if (!rows?.length) return null
    const latest = rows.reduce((a: any, b: any) => (a.year > b.year ? a : b))
    return {
      causeId: latest.causeId ?? null,
      name: latest.name ?? '',
      description: latest.description ?? '',
      slug: latest.slug ?? '',
      url: latest.url ?? '',
      startTime: latest.startTime,
      raised: Number(latest.raised ?? 0),
      goal: Number(latest.goal ?? 0),
      livestream: latest.livestream ?? { channel: null, type: '' },
      user: {
        id: latest.userId ?? 0,
        name: latest.userName ?? '',
        slug: latest.userSlug ?? '',
        avatar: latest.userAvatar ?? '',
        url: latest.userUrl ?? '',
      },
    }
  },
)

const campaignByTwitchId = os.campaignByTwitchIdContract.handler(
  async ({ input, context }) => {
    const { twitchId } = input
    const db = context.db
    const rows = await db
      .select({ userId: twitchChannelSchema.userId })
      .from(twitchChannelSchema)
      .where(eq(twitchChannelSchema.id, twitchId))
    const userId = rows?.[0]?.userId
    if (!userId) return null

    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    const current = await stub.getCampaign(userId)
    if (current) return current

    const past = await db
      .select()
      .from(jjCampaign)
      .where(eq(jjCampaign.userId, userId))
    if (!past?.length) return null
    const latest = past.reduce((a: any, b: any) => (a.year > b.year ? a : b))
    return {
      causeId: latest.causeId ?? null,
      name: latest.name ?? '',
      description: latest.description ?? '',
      slug: latest.slug ?? '',
      url: latest.url ?? '',
      startTime: latest.startTime,
      raised: Number(latest.raised ?? 0),
      goal: Number(latest.goal ?? 0),
      livestream: latest.livestream ?? { channel: null, type: '' },
      user: {
        id: latest.userId ?? 0,
        name: latest.userName ?? '',
        slug: latest.userSlug ?? '',
        avatar: latest.userAvatar ?? '',
        url: latest.userUrl ?? '',
      },
    }
  },
)
*/

export const jjRouter = {
  campaigns,
  causes,
  upcomingStreams,
  getAllUsersWithInfo,
  getUserCampaignPairs,
  /*
  causeById,
  campaignLookup,
  campaignPastLookup,
  campaignByUserSlug,
  campaignByUserId,
  campaignByTwitchId,*/
}
