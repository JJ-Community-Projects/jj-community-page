import { implement, ORPCError } from '@orpc/server'
import { contracts, type FundraiserItem } from './contract'
import { dbMiddleware } from '../../middleware/dbMiddleware'
import {
  schedulesTable,
  streamsTable,
  teamMembersTable,
  teamsTable,
} from '../../../db/schema/jj-schema'
import { and, eq, gte, inArray } from 'drizzle-orm'
import { getScheduleStreams } from '../../public/schedules/util'
import type { JJCampaign } from '../../../../do/types/JJAPIModel.ts'
import {
  tiltifyMetadataView,
  userDisplayView,
} from '../../../db/schema/views-schema.ts'
import { DateTime, IANAZone } from 'luxon'
import { getStreamColors } from '../../../../functions/jjDatesToColors.ts'

const os = implement(contracts).use(dbMiddleware)

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function campaignMapper(
  c: JJCampaign,
  currency: string,
  usdRate: number,
  eurRate: number,
): FundraiserItem {
  const cur = currency === 'USD' ? 'USD' : currency === 'EUR' ? 'EUR' : 'GBP'
  const locale = cur === 'USD' ? 'en-US' : cur === 'EUR' ? 'de-DE' : 'en-GB'
  const raisedGBP = c.raised
  const raised =
    cur === 'USD'
      ? raisedGBP * usdRate
      : cur === 'EUR'
        ? raisedGBP * eurRate
        : raisedGBP

  const raisedFormatted = Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cur,
  }).format(raised ?? 0)
  return {
    slug: String(c.slug ?? ''),
    title: String(c?.user?.name ?? c.name ?? ''),
    raisedFormatted,
    raised: raised ?? 0,
    imageUrl: c?.user?.avatar || undefined,
    url: c.url,
  }
}

/*
async function campaignBySlug(
  db: JJDrizzleDatabase,
  slug: string,
  currency: string,
  usdRate: number,
  eurRate: number,
) {
  const userCampaign = await db
    .select()
    .from(jjCampaign)
    .where(eq(jjCampaign.userSlug, slug))
    .get()
  let jjC: JJCampaign | null = null
  if (userCampaign) {
    return {
      causeId: userCampaign.causeId,
      name: userCampaign.name,
      description: userCampaign.description ?? '',
      slug: userCampaign.slug,
      url: userCampaign.url ?? '',
      startTime: userCampaign.startTime,
      raised: userCampaign.raised,
      goal: userCampaign.goal,
      livestream: {
        channel: userCampaign.livestream?.channel ?? null,
        type: userCampaign.livestream?.type ?? '',
      },
      user: {
        name: userCampaign.userName ?? '',
        slug: userCampaign.userSlug ?? '',
        avatar: userCampaign.userAvatar ?? '',
        url: userCampaign.userUrl ?? '',
      },
    }
  }
  return jjC ? campaignMapper(jjC, currency, usdRate, eurRate) : null
}*/

// ----------------------
// Charities
// ----------------------
const charities = os.charitiesContract.handler(async ({ input, context }) => {
  const currency = input.currency

  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  const causes = await stub.getCausesTV()
  const avgConversionRate = await stub.getDollarConversionRate()
  const eurRate = await stub.getGbpToEurRate()
  const c = await stub.getCampaign(input.user ?? '')
  const userFundraiser = c
    ? campaignMapper(c!, currency, avgConversionRate, eurRate)
    : null

  if (!causes?.length) {
    return { userFundraiser, charities: [] }
  }

  const locale =
    currency === 'USD' ? 'en-US' : currency === 'EUR' ? 'de-DE' : 'en-GB'
  const formatter = Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  })
  const items = causes.map((cause) => {
    const raisedGBP = cause?.raised?.gbp ?? 0
    const raisedUSD = cause?.raised?.usd ?? 0
    const raisedEUR = cause?.raised?.euro ?? 0
    const convertedRaised =
      currency === 'USD'
        ? raisedUSD
        : currency === 'EUR'
          ? raisedEUR
          : raisedGBP
    const raisedFormatted = formatter.format(convertedRaised)
    return {
      id: cause.id,
      name: String(cause.name ?? ''),
      logoUrl: cause.logo || undefined,
      websiteUrl: cause.url || undefined,
      raised: convertedRaised,
      raisedFormatted: raisedFormatted,
      description: cause.description,
    }
  })

  return { userFundraiser, charities: items }
})

// ----------------------
// Single Cause by ID
// ----------------------
const causeById = os.causeByIdContract.handler(async ({ input, context }) => {
  const includeTotals = Boolean(input?.includeTotals)
  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  const causes = await stub.getCausesTV()
  if (!causes?.length) return null

  const id = input.causeId
  if (id === '') return null

  const cause = causes.find((c) => c?.id === id)
  console.log('cause', cause)
  if (!cause) return null

  const r = new Date().getUTCSeconds()

  return {
    id: cause.id,
    name: String(cause.name ?? ''),
    logoUrl: cause.logo || undefined,
    websiteUrl: cause.url || undefined,
    raised: includeTotals ? Number(cause?.raised?.gbp ?? 0) + r : undefined,
    currency: includeTotals ? 'GBP' : undefined,
    description: cause.description,
  }
})

// ----------------------
// Fundraisers
// ----------------------

const fundraisers = os.fundraisersContract.handler(
  async ({ input, context }) => {
    const pageSize = clamp(Math.floor(input?.pageSize ?? 25), 1, 200)
    const orderBy = (input?.orderBy ?? 'recent') as
      | 'recent'
      | 'top'
      | 'alphabetical'
    const currency = input.currency

    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    const list = await stub.getCampaigns()
    const avgConversionRate = await stub.getDollarConversionRate()
    const eurRate = await stub.getGbpToEurRate()

    const c = await stub.getCampaign(input.user ?? '')
    const userFundraiser = c
      ? campaignMapper(c!, currency, avgConversionRate, eurRate)
      : null
    // console.log('userFundraiser', userFundraiser)

    if (!list?.length) {
      return {
        userFundraiser,
        fundraisers: [],
      }
    }

    const mapped = list.map((c) =>
      campaignMapper(c, currency, avgConversionRate, eurRate),
    )

    switch (orderBy) {
      case 'top':
        mapped.sort((a, b) => b.raised - a.raised)
        break
      case 'alphabetical':
        mapped.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        // recent: keep order from source
        break
    }

    return {
      userFundraiser,
      fundraisers: mapped,
    }
  },
)

// ----------------------
// Team Fundraisers
// ----------------------
const teamFundraisers = os.teamFundraisersContract.handler(
  async ({ input, context }) => {
    const db = context.db
    const slug = input.teamSlug.trim()
    const orderBy = input.orderBy
    const currency = input.currency
    if (!slug) {
      throw new ORPCError('BAD_REQUEST', { message: 'teamSlug is required' })
    }

    // Find team by slug
    const team = await db
      .select({ id: teamsTable.id, name: teamsTable.name })
      .from(teamsTable)
      .where(eq(teamsTable.slug, slug))
      .get()

    if (!team) {
      throw new ORPCError('NOT_FOUND', { message: 'Team not found' })
    }

    // Get member user IDs
    const members = await db
      .select({ userId: teamMembersTable.userId })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.teamId, team.id))
      .all()

    if (members.length === 0) {
      throw new ORPCError('NOT_FOUND', { message: 'Team members not found' })
    }
    const userIds = members.map((m) => m.userId)

    // Get Tiltify accounts for these users
    const tiltifyAccounts = await db
      .select({
        slug: tiltifyMetadataView.slug,
      })
      .from(tiltifyMetadataView)
      .where(and(inArray(tiltifyMetadataView.userId, userIds)))
      .all()

    if (tiltifyAccounts.length === 0) {
      throw new ORPCError('BAD_REQUEST')
    }

    const slugSet = new Set<string>()
    for (const a of tiltifyAccounts) {
      slugSet.add(a.slug)
    }

    // Fetch campaigns from DO and filter
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    const list = await stub.getCampaigns()
    const avgConversionRate = await stub.getDollarConversionRate()
    const eurRate = await stub.getGbpToEurRate()
    if (!list?.length) {
      throw new ORPCError('BAD_REQUEST')
    }

    const filtered = list.filter((c) => {
      const uslug = String(c?.user?.slug ?? '').toLowerCase()
      return uslug && slugSet.has(uslug)
    })

    const mapped = filtered.map((c) =>
      campaignMapper(c, currency, avgConversionRate, eurRate),
    )

    switch (orderBy) {
      case 'top':
        mapped.sort((a, b) => b.raised - a.raised)
        break
      case 'alphabetical':
        mapped.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        // recent: keep order from source
        break
    }

    const c = await stub.getCampaign(input.user ?? '')
    const userFundraiser = c
      ? campaignMapper(c!, currency, avgConversionRate, eurRate)
      : null
    return {
      teamName: team.name,
      fundraisers: mapped,
      userFundraiser,
    }
  },
)

// ----------------------
// Cause Fundraisers
// ----------------------
const causeFundraisers = os.causeFundraisersContract.handler(
  async ({ input, context }) => {
    const causeId = input.causeId
    const orderBy = input.orderBy
    const currency = input.currency
    const user = input.user ?? ''

    // Fetch campaigns from DO and filter
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    const list = await stub.getCampaignsForCause(causeId)
    console.log(list)
    const avgConversionRate = await stub.getDollarConversionRate()
    const eurRate = await stub.getGbpToEurRate()

    const c = await stub.getCampaign(input.user ?? '')
    const userFundraiser = c
      ? campaignMapper(c!, currency, avgConversionRate, eurRate)
      : null

    if (!list?.length) {
      return {
        userFundraiser,
        fundraisers: [],
      }
    }

    const mapped = list.map((c) =>
      campaignMapper(c, currency, avgConversionRate, eurRate),
    )
    console.log('causeFundraisers', 'mapped', mapped)

    switch (orderBy) {
      case 'top':
        mapped.sort((a, b) => b.raised - a.raised)
        break
      case 'alphabetical':
        mapped.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        // recent: keep order from source
        break
    }
    return {
      userFundraiser,
      fundraisers: mapped,
    }
  },
)

// ----------------------
// Schedule Simple
// ----------------------
const schedulePrimary = os.schedulePrimaryContract.handler(
  async ({ input, context }) => {
    const db = context.db
    const slug = input.user
    const now = DateTime.now()
    const currentYear = now.year

    console.log('overlay', 'schedule-primary', input)

    const inputTimezone = input.timezone ?? 'Europe/London'
    console.log('inputTimezone', inputTimezone)

    const timezone = IANAZone.isValidZone(inputTimezone)
      ? inputTimezone
      : 'Europe/London'

    const user = await db
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
      .where(eq(userDisplayView.tiltifySlug, slug))
      .get()

    if (!user) {
      throw new ORPCError('NOT_FOUND', {
        message: 'User not found',
      })
    }

    // Load schedule (must be visible)
    const schedule = await db
      .select({
        id: schedulesTable.id,
        name: schedulesTable.title,
        slug: schedulesTable.slug,
        visible: schedulesTable.visible,
      })
      .from(schedulesTable)
      .where(
        and(
          eq(schedulesTable.visible, true),
          eq(schedulesTable.year, currentYear),
          eq(schedulesTable.ownerId, user.userId),
        ),
      )
      .get()

    if (!schedule) {
      throw new ORPCError('NOT_FOUND', { message: 'Schedule not found' })
    }

    const streams = await getScheduleStreams(db, schedule.id)
    streams.sort((a, b) => a.start.getTime() - b.start.getTime())

    const limit = clamp(Math.floor(input.limit ?? 4), 1, 100)

    const blocks = streams
      .filter((s) => {
        return s.end.getTime() > now.toMillis()
      })
      .map((s) => {
        const c = getStreamColors(
          DateTime.fromJSDate(s.start).setZone('Europe/London'),
        )
        return {
          id: s.id,
          start: s.start,
          end: s.end,
          title: s.title,
          subtitle: s.subtitle,
          color: c['500'],
        }
      })
      .slice(0, limit)

    return {
      schedule: { id: schedule.id, name: schedule.name, slug: schedule.slug },
      blocks: blocks,
      timezone,
    }
  },
)

const scheduleByTeamId = os.scheduleByTeamIdContract.handler(
  async ({ input, context }) => {
    const db = context.db
    const teamId = input.teamId
    const limit = clamp(Math.floor(input.limit ?? 4), 1, 100)

    const inputTimezone = input.timezone ?? 'Europe/London'
    const timezone = IANAZone.isValidZone(inputTimezone)
      ? inputTimezone
      : 'Europe/London'

    const now = new Date()
    const currentYear = now.getUTCFullYear()

    // Fetch team
    const team = await db
      .select({
        id: teamsTable.id,
        name: teamsTable.name,
        slug: teamsTable.slug,
        visible: teamsTable.visible,
      })
      .from(teamsTable)
      .where(eq(teamsTable.id, teamId))
      .get()

    if (!team) {
      throw new ORPCError('NOT_FOUND', { message: 'Team not found' })
    }

    // Get team member user IDs
    const members = await db
      .select({ userId: teamMembersTable.userId })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.teamId, team.id))
      .all()

    const userIds = members.map((m) => m.userId)

    let blocks: {
      id: number
      start: Date
      end: Date
      title: string
      subtitle: string | null
      color: string
      owner: {
        userId: number
        username: string
        profileImage?: string | null
        twitchLogin?: string | null
        tiltifySlug?: string | null
      }
    }[] = []

    if (userIds.length > 0) {
      // Get all upcoming streams for member primary schedules for current year
      const upcoming = await db
        .select({
          id: streamsTable.id,
          scheduleId: streamsTable.scheduleId,
          createdBy: streamsTable.createdBy,
          title: streamsTable.title,
          subtitle: streamsTable.subtitle,
          start: streamsTable.start,
          end: streamsTable.end,
          visible: streamsTable.visible,
          ownerId: schedulesTable.ownerId,
        })
        .from(streamsTable)
        .innerJoin(
          schedulesTable,
          eq(streamsTable.scheduleId, schedulesTable.id),
        )
        .where(
          and(
            inArray(schedulesTable.ownerId, userIds),
            eq(streamsTable.visible, true),
            eq(schedulesTable.visible, true),
            eq(schedulesTable.primary, true),
            eq(schedulesTable.year, currentYear),
            gte(streamsTable.start, now),
          ),
        )
        .orderBy(streamsTable.start)
        .all()

      if (upcoming.length > 0) {
        // One stream per schedule owner (team member), take the earliest
        const seenOwners = new Set<number>()
        const uniqueByOwner: typeof upcoming = []
        for (const s of upcoming) {
          if (seenOwners.has(s.ownerId)) continue
          seenOwners.add(s.ownerId)
          uniqueByOwner.push(s)
        }

        const limited = uniqueByOwner.slice(0, limit)

        // Batch load owner display info
        const ownerIds = Array.from(new Set(limited.map((s) => s.ownerId)))
        const owners = ownerIds.length
          ? await db
              .select({
                userId: userDisplayView.userId,
                username: userDisplayView.username,
                profileImage: userDisplayView.profileImage,
                twitchLogin: userDisplayView.twitchLogin,
                tiltifySlug: userDisplayView.tiltifySlug,
              })
              .from(userDisplayView)
              .where(inArray(userDisplayView.userId, ownerIds))
              .all()
          : []

        const ownerById = new Map<
          number,
          {
            userId: number
            username: string
            profileImage: string | null
            twitchLogin: string | null
            tiltifySlug: string | null
          }
        >()
        for (const o of owners) ownerById.set(o.userId, o)

        blocks = limited.map((s) => {
          const dt = DateTime.fromJSDate(
            s.start instanceof Date ? s.start : new Date(s.start as any),
          ).setZone('Europe/London')
          const c = getStreamColors(dt)
          const owner = ownerById.get(s.ownerId) ?? {
            userId: s.ownerId,
            username: String(s.ownerId),
            profileImage: null,
            twitchLogin: null,
            tiltifySlug: null,
          }
          return {
            id: s.id,
            start: s.start instanceof Date ? s.start : new Date(s.start as any),
            end: s.end instanceof Date ? s.end : new Date(s.end as any),
            title: s.title,
            subtitle: s.subtitle,
            color: c['500'],
            owner,
          }
        })
      }
    }

    return {
      schedule: { id: team.id, name: team.name, slug: team.slug },
      timezone,
      blocks,
    }
  },
)

const campaignGoalSlug = os.campaignGoalContract.handler(
  async ({ context, input }) => {
    const currency = input.currency
    const DO = context.env.JingleJamData
    const stub = DO.get(DO.idFromName('JJ_API_CACHE'))
    const campaign = await stub.getCampaignByUserSlug(input.tiltifySlug)
    const previousGoalGBP = await stub.getPreviousGoalByUserSlug(
      input.tiltifySlug,
    )
    if (!campaign) {
      return { previousGoal:0, raised:0, goal:0 }
    }
    const usd = await stub.getDollarConversionRate()
    const eur = await stub.getGbpToEurRate()
    const mult = currency === 'USD' ? usd : currency === 'EUR' ? eur : 1
    const raised = campaign.raised * mult
    const goal = campaign.goal * mult
    const previousGoal = previousGoalGBP * mult

    return { previousGoal, raised, goal }
  },
)

export const privateOverlayRouter = {
  // Charity outputs
  charities,
  causeById,
  // Fundraiser outputs
  fundraisers,
  teamFundraisers,
  causeFundraisers,
  // Schedule output
  schedulePrimary,
  scheduleByTeamId,
  // Campaigns
  campaignGoalSlug,
}
