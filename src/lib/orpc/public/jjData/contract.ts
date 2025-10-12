import z from 'zod/v4'
import { oc } from '@orpc/contract'
// JJRaised schema (used inside JJCause)
export const JJRaisedSchema = z.object({
  yogscast: z.number(),
  fundraisers: z.number(),
})

// JJCause schema
export const JJCauseSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string().url(), // logo is always a URL
  description: z.string(),
  url: z.string().url(),
  donateUrl: z.string().url(),
  raised: JJRaisedSchema,
})

// JJLivestream schema (used inside JJCampaign)
export const JJLivestreamSchema = z.object({
  channel: z.string().nullable(),
  type: z.string(),
})

// JJUser schema (used inside JJCampaign)
export const JJUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  avatar: z.string(),
  url: z.string(),
})

// JJCampaign schema
export const JJCampaignSchema = z.object({
  causeId: z.number().nullable(),
  name: z.string(),
  description: z.string(),
  slug: z.string(),
  url: z.string(),
  startTime: z.string(), // ISO datetime
  raised: z.number(),
  goal: z.number(),
  livestream: JJLivestreamSchema,
  user: JJUserSchema,
})

// JJCampaigns schema
export const JJCampaignsSchema = z.object({
  count: z.number(),
  list: z.array(JJCampaignSchema),
})

// --- Inferred TS types (optional, matches your interfaces) ---
export type JJCauseType = z.infer<typeof JJCauseSchema>
export type JJCampaignType = z.infer<typeof JJCampaignSchema>
export type JJCampaignsType = z.infer<typeof JJCampaignsSchema>

// List endpoints (existing)
const campaignsContract = oc.output(JJCampaignsSchema).route({
  path: '/jj/campaigns',
  method: 'GET',
  operationId: 'getJJDataCampaigns',
  summary: 'Get jj data campaigns',
  description: 'Retrieve all campaigns from the jj api',
  tags: ['jj-data'],
  successDescription: 'Campaigns retrieved successfully',
  deprecated: false,
})

const causesContract = oc
  .output(
    z.object({
      count: z.number(),
      list: z.array(JJCauseSchema),
    }),
  )
  .route({
    path: '/jj/causes',
    method: 'GET',
    operationId: 'getJJDataCauses',
    summary: 'Get jj data causes',
    description: 'Retrieve all causes from the jj api',
    tags: ['jj-data'],
    successDescription: 'Causes retrieved successfully',
    deprecated: false,
  })

// New: Get single cause by path parameter
const causeByIdContract = oc
  .input(z.object({ id: z.coerce.number().int().nonnegative() }))
  .output(JJCauseSchema.nullable())
  .route({
    path: '/jj/causes/{id}',
    method: 'GET',
    operationId: 'getJJDataCauseById',
    summary: 'Get a single cause by id',
    description: 'Retrieve a single cause from the current JJ data cache by id',
    tags: ['jj-data'],
    successDescription: 'Cause retrieved successfully',
  })

// New: Current-year campaign lookup via DO (single result)
const campaignLookupInput = z.object({
  userId: z.coerce.number().int().optional(),
  userSlug: z.string().optional(),
  campaignId: z.string().optional(), // treated as slug identifier
})

const campaignLookupContract = oc
  .input(campaignLookupInput)
  .output(JJCampaignSchema.nullable())
  .route({
    path: '/jj/campaign',
    method: 'GET',
    operationId: 'getJJDataCampaign',
    summary:
      'Get the current-year campaign by userId, userSlug, or campaignId (slug)',
    description:
      'Lookup a single current-year campaign from the JingleJamData Durable Object (no database access).',
    tags: ['jj-data'],
    successDescription: 'Campaign retrieved successfully',
  })

// New: Past campaign lookup via DB (array result)
const campaignPastLookupInput = z.object({
  year: z.coerce.number().int().optional(),
  userId: z.coerce.number().int().optional(),
  userSlug: z.string().optional(),
  campaignId: z.string().optional(), // treated as slug identifier
})

const campaignPastLookupContract = oc
  .input(campaignPastLookupInput)
  .output(z.array(JJCampaignSchema))
  .route({
    path: '/jj/campaign/past',
    method: 'GET',
    operationId: 'getJJDataCampaignPast',
    summary: 'Get past campaigns by userId, userSlug, or campaignId (slug)',
    description:
      'Lookup past campaigns from the database. If year is provided, filter to that year; if omitted, return all matching years.',
    tags: ['jj-data'],
    successDescription: 'Past campaigns retrieved successfully',
  })

export const contracts = {
  campaignsContract,
  causesContract,
  causeByIdContract,
  campaignLookupContract,
  campaignPastLookupContract,
}
