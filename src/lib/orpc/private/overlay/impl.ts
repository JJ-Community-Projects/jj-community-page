import { implement, ORPCError } from '@orpc/server'
import { contracts } from './contract'
import { dbMiddleware } from '../../middleware/dbMiddleware'
import { schedulesTable, teamMembersTable, teamsTable } from '../../../db/schema/jj-schema'
import { and, eq, inArray } from 'drizzle-orm'
import { getScheduleStreams } from '../../public/schedules/util'
import { accounts } from '../../../db/schema/auth-schema'
import { jjCampaign } from '../../../db/schema/jj-api-schema'

const os = implement(contracts).use(dbMiddleware)

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

// ----------------------
// Charities
// ----------------------
const charities = os.charitiesContract.handler(async ({ input, context }) => {
  const includeTotals = Boolean(input?.includeTotals)
  const pageSize = clamp(Math.floor(input?.pageSize ?? 50), 1, 200)

  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  const causes: any[] | null = await stub.getCauses()

  if (!causes?.length) return []

  const r = new Date().getUTCSeconds()

  const items = causes.map((cause: any) => ({
    id: Number(cause.id),
    name: String(cause.name ?? ''),
    logoUrl: cause.logo || undefined,
    websiteUrl: cause.url || undefined,
    amountRaised: includeTotals
      ? Number((cause?.raised?.fundraisers ?? 0) + (cause?.raised?.yogscast ?? 0))+r
      : undefined,
    currency: includeTotals ? 'GBP' : undefined,
    description: cause.description,
  }))

  return items.slice(0, pageSize)
})

// ----------------------
// Fundraisers
// ----------------------
const fundraisers = os.fundraisersContract.handler(async ({ input, context }) => {
  const pageSize = clamp(Math.floor(input?.pageSize ?? 25), 1, 200)
  const orderBy = (input?.orderBy ?? 'recent') as 'recent' | 'top' | 'alphabetical'

  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  const list: any[] | null = await stub.getCampaigns()
  if (!list?.length) return []

  const mapped = list.map((c: any) => ({
    id: String(c.slug ?? ''),
    title: String(c.name ?? ''),
    creatorName: String(c?.user?.name ?? ''),
    amountRaised: Number(c.raised ?? 0),
    goal: typeof c.goal === 'number' ? c.goal : undefined,
    imageUrl: c?.user?.avatar || undefined,
    urlSlug: c?.slug || undefined,
  }))

  switch (orderBy) {
    case 'top':
      mapped.sort((a, b) => b.amountRaised - a.amountRaised)
      break
    case 'alphabetical':
      mapped.sort((a, b) => a.title.localeCompare(b.title))
      break
    default:
      // recent: keep order from source
      break
  }

  return mapped.slice(0, pageSize)
})

// ----------------------
// Team Fundraisers
// ----------------------
const teamFundraisers = os.teamFundraisersContract.handler(async ({ input, context }) => {
  const db = context.db
  const slug = input.teamSlug.trim()
  if (!slug) throw new ORPCError('BAD_REQUEST', { message: 'teamSlug is required' })

  // Find team by slug
  const team = await db
    .select({ id: teamsTable.id })
    .from(teamsTable)
    .where(eq(teamsTable.slug, slug))
    .get()

  if (!team) throw new ORPCError('NOT_FOUND', { message: 'Team not found' })

  // Get member user IDs
  const members = await db
    .select({ userId: teamMembersTable.userId })
    .from(teamMembersTable)
    .where(eq(teamMembersTable.teamId, team.id))
    .all()

  if (members.length === 0) return []
  const userIds = members.map((m) => m.userId)

  // Get Tiltify accounts for these users
  const tiltifyAccounts = await db
    .select({ providerId: accounts.providerId, providerUsername: accounts.providerUsername })
    .from(accounts)
    .where(and(eq(accounts.provider, 'tiltify'), inArray(accounts.userId, userIds)))
    .all()

  if (tiltifyAccounts.length === 0) return []

  const idSet = new Set<number>()
  const slugSet = new Set<string>()
  for (const a of tiltifyAccounts) {
    const n = Number(a.providerId)
    if (!Number.isNaN(n)) idSet.add(n)
    if (a.providerUsername) slugSet.add(a.providerUsername.toLowerCase())
  }

  // Fetch campaigns from DO and filter
  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  const list: any[] | null = await stub.getCampaigns()
  if (!list?.length) return []

  const filtered = list.filter((c: any) => {
    const uid = Number(c?.user?.id ?? NaN)
    const uslug = String(c?.user?.slug ?? '').toLowerCase()
    return (uid && idSet.has(uid)) || (uslug && slugSet.has(uslug))
  })

  // Map to FundraiserItem shape
  const mapped = filtered.map((c: any) => ({
    id: String(c.slug ?? ''),
    title: String(c.name ?? ''),
    creatorName: String(c?.user?.name ?? ''),
    amountRaised: Number(c.raised ?? 0),
    goal: typeof c.goal === 'number' ? c.goal : undefined,
    imageUrl: c?.user?.avatar || undefined,
    urlSlug: c?.slug || undefined,
  }))

  // Keep order from source (recent)
  return mapped
})

// ----------------------
// Schedule Simple
// ----------------------
const scheduleSimple = os.scheduleSimpleContract.handler(async ({ input, context }) => {
  const db = context.db
  const byId = input.scheduleId != null
  const bySlug = input.scheduleSlug != null
  if (byId === bySlug) {
    throw new ORPCError('BAD_REQUEST', { message: 'Provide exactly one of scheduleId or scheduleSlug' })
  }

  // Load schedule (must be visible)
  const schedule = await db
    .select({ id: schedulesTable.id, name: schedulesTable.title, slug: schedulesTable.slug, visible: schedulesTable.visible })
    .from(schedulesTable)
    .where(
      byId
        ? and(eq(schedulesTable.id, input.scheduleId!), eq(schedulesTable.visible, true))
        : and(eq(schedulesTable.slug, input.scheduleSlug!), eq(schedulesTable.visible, true))
    )
    .get()

  if (!schedule) throw new ORPCError('NOT_FOUND', { message: 'Schedule not found' })

  const streams = await getScheduleStreams(db, schedule.id)
  streams.sort((a, b) => a.start.getTime() - b.start.getTime())

  const blocks = streams.map((s) => ({
    id: s.id,
    start: s.start.toISOString(),
    end: s.end.toISOString(),
    title: s.title,
    participants: s.participants?.map((p) => p.username) ?? [],
    color: undefined as string | undefined,
  }))

  // Trim window server-side (equivalent to client trimSchedule)
  const includePast = Boolean(input.includePast)
  const windowSize = clamp(Math.floor(input.windowSize ?? 3), 1, 10)
  const now = Date.now()

  const upcoming: typeof blocks = []
  let current: (typeof blocks)[number] | undefined
  for (const b of blocks) {
    const start = Date.parse(b.start)
    const end = Date.parse(b.end)
    if (end < now) continue
    if (start <= now && now <= end) current = b
    else if (start > now) upcoming.push(b)
  }

  const trimmed: typeof blocks = []
  if (includePast && current) trimmed.push(current)
  let remaining = windowSize - trimmed.length
  for (let i = 0; i < upcoming.length && remaining > 0; i++) {
    trimmed.push(upcoming[i])
    remaining--
  }

  return {
    schedule: { id: schedule.id, name: schedule.name, slug: schedule.slug },
    blocks: trimmed,
  }
})

// ----------------------
// Cause Fundraisers
// ----------------------
const causeFundraisers = os.causeFundraisersContract.handler(async ({ input, context }) => {
  const db = context.db
  const causeId = Math.floor(input.causeId)
  if (!Number.isFinite(causeId) || causeId < 0) {
    throw new ORPCError('BAD_REQUEST', { message: 'Valid causeId is required' })
  }

  // Fetch campaigns stored in jj_campaign with this cause id
  // Map to overlay FundraiserItem shape
  const rows = await db
    .select({
      slug: jjCampaign.slug,
      name: jjCampaign.name,
      raised: jjCampaign.raised,
      goal: jjCampaign.goal,
      userName: jjCampaign.userName,
      userAvatar: jjCampaign.userAvatar,
      causeId: jjCampaign.causeId,
    })
    .from(jjCampaign)
    .where(eq(jjCampaign.causeId, causeId))
    .all()

  if (!rows?.length) return []

  const mapped = rows.map((c) => ({
    id: String(c.slug ?? ''),
    title: String(c.name ?? ''),
    creatorName: String(c.userName ?? ''),
    amountRaised: Number(c.raised ?? 0),
    goal: typeof c.goal === 'number' ? c.goal : undefined,
    imageUrl: c.userAvatar || undefined,
    urlSlug: String(c.slug ?? ''),
  }))

  // Order by raised desc by default
  mapped.sort((a, b) => b.amountRaised - a.amountRaised)

  return mapped
})

// ----------------------
// Single Cause by ID
// ----------------------
const causeById = os.causeByIdContract.handler(async ({ input, context }) => {
  const includeTotals = Boolean(input?.includeTotals)
  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  const causes: any[] | null = await stub.getCauses()
  if (!causes?.length) return null

  const id = Math.floor(input.causeId)
  if (!Number.isFinite(id) || id < 0) return null

  const cause = causes.find((c: any) => Number(c?.id) === id)
  if (!cause) return null

  const r = new Date().getUTCSeconds()

  return {
    id: Number(cause.id),
    name: String(cause.name ?? ''),
    logoUrl: cause.logo || undefined,
    websiteUrl: cause.url || undefined,
    amountRaised: includeTotals
      ? Number((cause?.raised?.fundraisers ?? 0) + (cause?.raised?.yogscast ?? 0)) + r
      : undefined,
    currency: includeTotals ? 'GBP' : undefined,
    description: cause.description,
  }
})

export const privateOverlayRouter = {
  charities,
  fundraisers,
  teamFundraisers,
  scheduleSimple,
  causeFundraisers,
  causeById,
}
