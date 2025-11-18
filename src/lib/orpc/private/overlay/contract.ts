import { oc } from '@orpc/contract'
import { z } from 'zod/v4'

// ----------------------
// Shared overlay types
// ----------------------
export const CharityItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  logoUrl: z.string().optional(),
  tagline: z.string().optional(),
  websiteUrl: z.string().optional(),
  raised: z.number().optional(),
  raisedFormatted: z.string().optional(),
})

export type CharityItem = z.infer<typeof CharityItemSchema>

export const FundraiserItemSchema = z.object({
  slug: z.string(),
  title: z.string(),
  raisedFormatted: z.string(),
  raised: z.number(),
  imageUrl: z.string().optional(),
  url: z.string().optional(),
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
const Currency = z.enum(['USD', 'GBP', 'EUR']).default('GBP')
// ----------------------
// Routes
// ----------------------

const charitiesContract = oc
  .input(
    z.object({
      currency: Currency,
      user: z.string().optional(),
    }),
  )
  .output(
    z.object({
      userFundraiser: FundraiserItemSchema.nullable(),
      charities: z.array(CharityItemSchema),
    }),
  )

const causeByIdContract = oc
  .input(
    z.object({
      causeId: z.string(),
      includeTotals: z.boolean().optional(),
      user: z.string().optional(),
    }),
  )
  .output(CharityItemSchema.nullable())

const fundraisersContract = oc
  .input(
    z.object({
      orderBy: z.enum(['recent', 'top', 'alphabetical']).optional(),
      pageSize: z.number().int().min(1).max(200).optional(),
      currency: Currency,
      user: z.string().optional(),
    }),
  )
  .output(
    z.object({
      userFundraiser: FundraiserItemSchema.nullable(),
      fundraisers: z.array(FundraiserItemSchema),
    }),
  )

// Team fundraisers: campaigns by users who are members of a given team (by slug)
const teamFundraisersContract = oc
  .input(
    z.object({
      teamSlug: z.string().min(1),
      orderBy: z.enum(['recent', 'top', 'alphabetical']).optional(),
      currency: Currency,
      user: z.string().optional(),
    }),
  )
  .output(
    z.object({
      teamName: z.string(),
      userFundraiser: FundraiserItemSchema.nullable(),
      fundraisers: z.array(FundraiserItemSchema),
    }),
  )
// Cause fundraisers: campaigns with a given JJ cause ID
const causeFundraisersContract = oc
  .input(
    z.object({
      causeId: z.string(),
      orderBy: z.enum(['recent', 'top', 'alphabetical']).optional(),
      currency: Currency,
      user: z.string().optional(),
    }),
  )
  .output(
    z.object({
      userFundraiser: FundraiserItemSchema.nullable(),
      fundraisers: z.array(FundraiserItemSchema),
    }),
  )

const schedulePrimaryContract = oc
  .input(
    z.object({
      user: z.string().optional(),
      timezone: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(4),
    }),
  )
  .output(
    z.object({
      schedule: z.object({
        id: z.number(),
        name: z.string(),
        slug: z.string(),
      }),
      timezone: z.string(),
      blocks: z.array(
        z.object({
          id: z.number().int().nonnegative(),
          start: z.date(),
          end: z.date(),
          title: z.string(),
          subtitle: z.string().nullable(),
          color: z.string(),
        }),
      ),
    }),
  )

const scheduleByTeamIdContract = oc
  .input(
    z.object({
      teamId: z.number().int().nonnegative(),
      timezone: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(4),
    }),
  )
  .output(
    z.object({
      schedule: z.object({
        id: z.number(),
        name: z.string(),
        slug: z.string(),
      }),
      timezone: z.string(),
      blocks: z.array(
        z.object({
          id: z.number().int().nonnegative(),
          start: z.date(),
          end: z.date(),
          title: z.string(),
          subtitle: z.string().nullable(),
          color: z.string(),
          owner: z.object({
            userId: z.number(),
            username: z.string(),
            profileImage: z.string().nullable().optional(),
            twitchLogin: z.string().nullable().optional(),
            tiltifySlug: z.string().nullable().optional(),
          }),
        }),
      ),
    }),
  )

export const contracts = {
  // Charity outputs
  charitiesContract,
  causeByIdContract,
  // Fundraiser outputs
  fundraisersContract,
  teamFundraisersContract,
  causeFundraisersContract,
  // Schedule output
  schedulePrimaryContract,
  scheduleByTeamIdContract,
}
