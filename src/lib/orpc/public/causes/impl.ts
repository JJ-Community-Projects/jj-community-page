import { contracts } from './contract.ts'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { implement } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { jjCampaign } from '../../../db/schema/jj-api-schema.ts'

const os = implement(contracts).use(dbMiddleware)

// List all campaigns from DO cache
const campaigns = os.campaignsContract.handler(async ({ context }) => {
  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  try {
    const list = await stub.getCampaigns()
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
    return []
  }

  return causes
})

// Get a single cause by id from DO cache (current year)
const causeById = os.causeByIdContract.handler(async ({ input, context }) => {
  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  const cause = await stub.getCause(input.id)
  return cause ?? null
})

// Get a single campaign via query params; DO when year omitted, DB when provided
const campaignLookup = os.campaignLookupContract.handler(
  async ({ input, context }) => {
    const { year, userId, userSlug, campaignId } = input

    if (year !== undefined) {
      // Query from database for the specified year
      const db = context.db
      const conds: any[] = [eq(jjCampaign.year, year)]
      if (userId !== undefined) {
        conds.push(eq(jjCampaign.userId, userId))
      } else if (userSlug !== undefined) {
        conds.push(eq(jjCampaign.userSlug, userSlug))
      } else if (campaignId !== undefined) {
        conds.push(eq(jjCampaign.slug, campaignId))
      } else {
        return null
      }

      const rows = await db.select().from(jjCampaign).where(and(...conds))
      const row = rows[0]
      if (!row) return null
      // map DB row to JJCampaignSchema shape
      return {
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
      }
    }

    // No year provided → use current-year DO cache
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

export const jjData = {
  campaigns,
  causes,
  causeById,
  campaignLookup,
}
