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
const campaignsContract = oc.output(JJCampaignsSchema)

const causesContract = oc
  .output(
    z.object({
      count: z.number(),
      list: z.array(JJCauseSchema),
    }),
  )

// New: Get single cause by path parameter
const causeByIdContract = oc
  .input(z.object({ id: z.coerce.number().int().nonnegative() }))
  .output(JJCauseSchema.nullable())

// New: Current-year campaign lookup via DO (single result)
const campaignLookupInput = z.object({
  userId: z.coerce.number().int().optional(),
  userSlug: z.string().optional(),
  campaignId: z.string().optional(), // treated as slug identifier
})

const campaignLookupContract = oc
  .input(campaignLookupInput)
  .output(JJCampaignSchema.nullable())

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

export const contracts = {
  campaignsContract,
  causesContract,
  causeByIdContract,
  campaignLookupContract,
  campaignPastLookupContract,
}
