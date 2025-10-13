import { oc } from '@orpc/contract'
import { z } from 'zod/v4'

// ----------------------
// Shared overlay types
// ----------------------
export const CharityItem = z.object({
  id: z.number().int().nonnegative(),
  name: z.string(),
  description: z.string(),
  logoUrl: z.string().url().optional(),
  tagline: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  amountRaised: z.number().optional(),
  currency: z.string().optional(),
})
export type CharityItemT = z.infer<typeof CharityItem>

export const FundraiserItem = z.object({
  id: z.string(),
  title: z.string(),
  creatorName: z.string(),
  amountRaised: z.number(),
  goal: z.number().optional(),
  currency: z.string().optional(),
  imageUrl: z.string().url().optional(),
  urlSlug: z.string().optional(),
})
export type FundraiserItemT = z.infer<typeof FundraiserItem>

// For schedule-simple
export const SimpleScheduleBlock = z.object({
  id: z.number().int().nonnegative(),
  start: z.string(), // ISO
  end: z.string(), // ISO
  title: z.string(),
  participants: z.array(z.string()).optional(),
  color: z.string().nullable().optional(),
})

export const SimpleScheduleView = z.object({
  schedule: z.object({ id: z.number(), name: z.string(), slug: z.string() }),
  blocks: z.array(SimpleScheduleBlock),
})
export type SimpleScheduleViewT = z.infer<typeof SimpleScheduleView>

// ----------------------
// Inputs
// ----------------------
const charitiesInput = z.object({
  includeTotals: z.boolean().optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
})

const fundraisersInput = z.object({
  orderBy: z.enum(['recent', 'top', 'alphabetical']).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
})

const scheduleSimpleInput = z
  .object({
    scheduleId: z.number().int().nonnegative().optional(),
    scheduleSlug: z.string().min(1).optional(),
    includePast: z.boolean().optional(),
    windowSize: z.number().int().min(1).max(10).optional(),
  })
  .refine((x) => Boolean(x.scheduleId) !== Boolean(x.scheduleSlug), {
    message: 'Provide exactly one of scheduleId or scheduleSlug',
  })

// ----------------------
// Routes
// ----------------------
const charitiesContract = oc
  .input(charitiesInput)
  .output(z.array(CharityItem))
  .route({
    path: '/overlay/charities',
    method: 'GET',
    summary: 'Overlay V2 charities (UI-ready)',
    tags: ['overlay', 'v2'],
  })

const fundraisersContract = oc
  .input(fundraisersInput)
  .output(z.array(FundraiserItem))
  .route({
    path: '/overlay/fundraisers',
    method: 'GET',
    summary: 'Overlay V2 fundraisers (UI-ready)',
    tags: ['overlay', 'v2'],
  })

// Team fundraisers: campaigns by users who are members of a given team (by slug)
const teamFundraisersContract = oc
  .input(z.object({ teamSlug: z.string().min(1) }))
  .output(z.array(FundraiserItem))
  .route({
    path: '/overlay/team-fundraisers',
    method: 'GET',
    summary: 'Overlay V2 team fundraisers (UI-ready)',
    tags: ['overlay', 'v2', 'teams'],
  })

const scheduleSimpleContract = oc
  .input(scheduleSimpleInput)
  .output(SimpleScheduleView)
  .route({
    path: '/overlay/schedule-simple',
    method: 'GET',
    summary: 'Overlay V2 schedule simple (UI-ready)',
    tags: ['overlay', 'v2', 'schedule'],
  })

// Cause fundraisers: campaigns with a given JJ cause ID
const causeFundraisersContract = oc
  .input(z.object({ causeId: z.number().int().nonnegative() }))
  .output(z.array(FundraiserItem))
  .route({
    path: '/overlay/cause-fundraisers',
    method: 'GET',
    summary: 'Overlay V2 cause fundraisers (UI-ready)',
    tags: ['overlay', 'v2', 'causes'],
  })

// Single cause by ID
const causeByIdContract = oc
  .input(z.object({ causeId: z.number().int().nonnegative(), includeTotals: z.boolean().optional() }))
  .output(CharityItem.nullable())
  .route({
    path: '/overlay/cause',
    method: 'GET',
    summary: 'Overlay V2 single cause by ID (UI-ready)',
    tags: ['overlay', 'v2', 'causes'],
  })

export const contracts = {
  charitiesContract,
  fundraisersContract,
  teamFundraisersContract,
  scheduleSimpleContract,
  causeFundraisersContract,
  causeByIdContract,
}
