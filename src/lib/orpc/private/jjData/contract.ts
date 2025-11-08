import z from 'zod/v4'
import { oc } from '@orpc/contract'

// JJRaised schema (used inside JJCause)
const CurrenciesSchema = z.object({
  gbp: z.number(),
  gbpFormatted: z.string(),
  usd: z.number(),
  usdFormatted: z.string(),
  euro: z.number(),
  euroFormatted: z.string(),
})

const JJRaisedSchema = z.object({
  yogscast: CurrenciesSchema,
  fundraisers: CurrenciesSchema,
  total: CurrenciesSchema,
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

const JJCampaignSchema = z.object({
  campaignName: z.string(),
  tiltifyUrl: z.string(),
  tiltifyName: z.string(),
  tiltifyDescription: z.string().optional(),
  tiltifyCauseId: z.number().optional(),
  avatar: z.string(), // twitch image if available or tiltify image
  raised: CurrenciesSchema,
  twitch: z.string().optional(),
  isTwitchLive: z.boolean(),
  youtube: z.string().optional(),
})

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

const causesContract = oc.output(
  z.object({
    count: z.number(),
    list: z.array(JJCauseSchema),
  }),
)

export const contracts = {
  campaignsContract,
  causesContract,
}
