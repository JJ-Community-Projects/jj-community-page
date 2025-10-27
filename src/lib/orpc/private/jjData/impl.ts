import { contracts } from './contract.ts'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { implement } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { jjCampaign } from '../../../db/schema/jj-api-schema.ts'
import { cacheMiddleware } from '../../middleware/cacheControl.ts'
import type { JJCause } from '../../../../do/types/JJAPIModel.ts'
// New: get campaign by Twitch id
import { twitchChannelSchema } from '../../../db/schema/twitch-channel-schema.ts'

const jjDataCacheMiddleware = cacheMiddleware({
  maxAge: 30,
  sMaxAge: 60,
  staleWhileRevalidate: 30,
})

const os = implement(contracts).use(dbMiddleware).use(jjDataCacheMiddleware)

// List all campaigns from DO cache
const campaigns = os.campaignsContract.handler(async ({ context }) => {
  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  try {
    const list = await stub.getCampaigns()
    console.log('campaigns', list)
    if (!list) {
      return {
        count: 0,
        list: [],
      }
    }

    return {
      list,
      count: list.length,
    }
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
    throw e
  }
})

// List all causes from DO cache
const causes = os.causesContract.handler(async ({ context }) => {
  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)

  const causes = await stub.getCauses()
  if (!causes) {
    return { count: 0, list: [] }
  }

  return {
    count: causes.length,
    list: causes as JJCause[],
  }
})

// Get a single cause by id from DO cache (current year)
const causeById = os.causeByIdContract.handler(async ({ input, context }) => {
  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  const cause = await stub.getCause(input.id)
  return cause ?? null
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

export const jjRouter = {
  campaigns,
  causes,
  causeById,
  campaignLookup,
  campaignPastLookup,
  campaignByUserSlug,
  campaignByUserId,
  campaignByTwitchId,
}
