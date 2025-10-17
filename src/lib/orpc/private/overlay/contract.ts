import { oc } from '@orpc/contract'
import { z } from 'zod/v4'

// ----------------------
// Shared overlay types
// ----------------------
export const CharityItemSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string(),
  description: z.string(),
  logoUrl: z.string().url().optional(),
  tagline: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  raised: z.number().optional(),
  raisedFormatted: z.string().optional(),
})

export type CharityItem = z.infer<typeof CharityItemSchema>

export const FundraiserItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  raisedFormatted: z.string(),
  raised: z.number(),
  imageUrl: z.string().url().optional(),
})

export type FundraiserItem = z.infer<typeof FundraiserItemSchema>

// For schedule-simple
export const SimpleScheduleBlockSchema = z.object({
  id: z.number().int().nonnegative(),
  start: z.string(), // ISO
  end: z.string(), // ISO
  title: z.string(),
  participants: z.array(z.string()).optional(),
  color: z.string().nullable().optional(),
})

export const SimpleScheduleViewSchema = z.object({
  schedule: z.object({ id: z.number(), name: z.string(), slug: z.string() }),
  blocks: z.array(SimpleScheduleBlockSchema),
})
export type SimpleScheduleViewT = z.infer<typeof SimpleScheduleViewSchema>

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
  .output(z.array(CharityItemSchema))
  .route({
    path: '/overlay/charities',
    method: 'GET',
    summary: 'Overlay V2 charities (UI-ready)',
    tags: ['overlay', 'v2'],
  })

const causeByIdContract = oc
  .input(
    z.object({
      causeId: z.number().int().nonnegative(),
      includeTotals: z.boolean().optional(),
    }),
  )
  .output(CharityItemSchema.nullable())
  .route({
    path: '/overlay/cause',
    method: 'GET',
    summary: 'Overlay V2 single cause by ID (UI-ready)',
    tags: ['overlay', 'v2', 'causes'],
  })

const fundraisersContract = oc
  .input(z.object({
    orderBy: z.enum(['recent', 'top', 'alphabetical']).optional(),
    pageSize: z.number().int().min(1).max(200).optional(),
    currency: z.enum(['USD', 'GBP']).default('GBP'),
  }))
  .output(z.array(FundraiserItemSchema))
  .route({
    path: '/overlay/fundraisers',
    method: 'GET',
    summary: 'Overlay V2 fundraisers (UI-ready)',
    tags: ['overlay', 'v2'],
  })

// Team fundraisers: campaigns by users who are members of a given team (by slug)
const teamFundraisersContract = oc
  .input(
    z.object({
      teamSlug: z.string().min(1),
      orderBy: z.enum(['recent', 'top', 'alphabetical']).optional(),
      currency: z.enum(['USD', 'GBP']).default('GBP'),
    }),
  )
  .output(z.array(FundraiserItemSchema))
  .route({
    path: '/overlay/team-fundraisers',
    method: 'GET',
    summary: 'Overlay V2 team fundraisers (UI-ready)',
    tags: ['overlay', 'v2', 'teams'],
  })

// Cause fundraisers: campaigns with a given JJ cause ID
const causeFundraisersContract = oc
  .input(
    z.object({
      causeId: z.number().int().nonnegative(),
      orderBy: z.enum(['recent', 'top', 'alphabetical']).optional(),
      currency: z.enum(['USD', 'GBP']).default('GBP'),
    }),
  )
  .output(z.array(FundraiserItemSchema))
  .route({
    path: '/overlay/cause-fundraisers',
    method: 'GET',
    summary: 'Overlay V2 cause fundraisers (UI-ready)',
    tags: ['overlay', 'v2', 'causes'],
  })

const scheduleSimpleContract = oc
  .input(scheduleSimpleInput)
  .output(SimpleScheduleViewSchema)
  .route({
    path: '/overlay/schedule-simple',
    method: 'GET',
    summary: 'Overlay V2 schedule simple (UI-ready)',
    tags: ['overlay', 'v2', 'schedule'],
  })

export const contracts = {
  // Charity outputs
  charitiesContract,
  causeByIdContract,
  // Fundraiser outputs
  fundraisersContract,
  teamFundraisersContract,
  causeFundraisersContract,
  // Schedule output
  scheduleSimpleContract,
}
