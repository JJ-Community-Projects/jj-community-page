// Overlay V2 client-side adapters
// Purpose: Shape existing public oRPC outputs to simple overlay view models.

import type { JJCampaignType, JJCauseType } from '../../../lib/orpc/public/jjData/contract'
import type { OverlayScheduleViewT } from '../../../lib/orpc/public/overlays/schedule/contract'

// Fundraisers (campaigns) → minimal overlay item
export type FundraiserItem = {
  id: string
  title: string
  creatorName: string
  amountRaised: number
  goal?: number
  currency?: string // Not exposed by jjData; keep for possible future extension
  imageUrl?: string
  urlSlug?: string
}

export function mapCampaignsToFundraisers(list: JJCampaignType[]): FundraiserItem[] {
  return list.map((c) => ({
    id: c.slug,
    title: c.name,
    creatorName: c.user.name,
    amountRaised: c.raised,
    goal: c.goal,
    imageUrl: c.user.avatar,
    urlSlug: c.slug,
  }))
}

// Charities (causes) → minimal overlay item
export type CharityItem = {
  id: number
  name: string
  logoUrl?: string
  tagline?: string
  websiteUrl?: string
  amountRaised?: number
  currency?: string
}

export function mapCausesToCharities(list: JJCauseType[], includeTotals?: boolean): CharityItem[] {
  return list.map((cause) => ({
    id: cause.id,
    name: cause.name,
    logoUrl: cause.logo,
    websiteUrl: cause.url,
    amountRaised: includeTotals ? (cause.raised.fundraisers + cause.raised.yogscast) : undefined,
    currency: includeTotals ? 'GBP' : undefined, // Assumption; upstream doesn’t provide currency
  }))
}

// Schedule simple trimming
export type SimpleScheduleBlock = {
  id: number
  start: string
  end: string
  title: string
  participants?: string[]
  color?: string | null
}

export type SimpleScheduleView = {
  schedule: { id: number; name: string; slug: string }
  blocks: SimpleScheduleBlock[]
}

export function trimSchedule(
  view: OverlayScheduleViewT,
  opts: { includePast?: boolean; windowSize?: number } = {},
): SimpleScheduleView {
  const windowSize = clamp(Math.floor(opts.windowSize ?? 3), 1, 10)
  const now = Date.now()

  // Partition blocks into past/current/upcoming
  const upcoming = [] as typeof view.blocks
  let current: typeof view.blocks[number] | undefined

  for (const b of view.blocks) {
    const start = Date.parse(b.start)
    const end = Date.parse(b.end)
    if (end < now) continue
    if (start <= now && now <= end) {
      current = b
    } else if (start > now) {
      upcoming.push(b)
    }
  }

  const result: SimpleScheduleBlock[] = []
  if (opts.includePast && current) result.push(pickBlock(current))
  // If no current and includePast is false, we still want the next N upcoming
  let remaining = windowSize - result.length
  for (let i = 0; i < upcoming.length && remaining > 0; i++) {
    result.push(pickBlock(upcoming[i]))
    remaining--
  }

  return { schedule: view.schedule, blocks: result }
}

function pickBlock(b: OverlayScheduleViewT['blocks'][number]): SimpleScheduleBlock {
  return {
    id: b.id,
    start: b.start,
    end: b.end,
    title: b.title,
    participants: b.participants,
    color: b.color ?? undefined,
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}
