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

const campaignsContract = oc.output(JJCampaignsSchema).route({
  path: '/jjData/campaigns',
  method: 'GET',
  operationId: 'getJJDataCampaigns',
  summary: 'Get jj data campaigns',
  description: 'Retrieve all campaigns from the jj api',
  tags: ['jj-data'],
  successDescription: 'Campaigns retrieved successfully',
  deprecated: false,
})

const causesContract = oc.output(z.array(JJCauseSchema)).route({
  path: '/jjData/causes',
  method: 'GET',
  operationId: 'getJJDataCauses',
  summary: 'Get jj data causes',
  description: 'Retrieve all causes from the jj api',
  tags: ['jj-data'],
  successDescription: 'Causes retrieved successfully',
  deprecated: false,
})

export const contracts = {
  campaignsContract,
  causesContract,
}
