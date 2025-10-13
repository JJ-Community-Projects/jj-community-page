import { implement, ORPCError } from '@orpc/server'
import { contracts } from './contract'
import { dbMiddleware } from '../../middleware/dbMiddleware'
import { schedulesTable } from '../../../db/schema/jj-schema'
import { and, eq } from 'drizzle-orm'
import { getScheduleStreams } from '../../public/schedules/util'

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

export const privateOverlayRouter = {
  charities,
  fundraisers,
  scheduleSimple,
}
