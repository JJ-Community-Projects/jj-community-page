import z from 'zod/v4'
import { oc } from '@orpc/contract'
import { SimplePublicTagSchema } from '../../public/schemas/tags.ts'

// JJRaised schema (used inside JJCause)
const CurrenciesSchema = z.object({
  gbp: z.number(),
  gbpFormatted: z.string(),
  usd: z.number(),
  usdFormatted: z.string(),
  euro: z.number(),
  euroFormatted: z.string(),
})

export type Currencies = z.infer<typeof CurrenciesSchema>

const JJRaisedSchema = z.object({
  yogscast: CurrenciesSchema.optional(),
  fundraisers: CurrenciesSchema.optional(),
  total: CurrenciesSchema.optional(),
})

export type JJRaised = z.infer<typeof JJRaisedSchema>

// JJCause schema
export const JJCauseSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().url(), // logo is always a URL
  description: z.string(),
  color: z.string().optional(),
  url: z.string().url(),
  donateUrl: z.string().url(),
  raised: CurrenciesSchema,
})

export const SimpleCampaignTag = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  color: z.string(),
  usage: z.number(),
})

export type SimpleCampaignTag = z.infer<typeof SimpleCampaignTag>

const JJCampaignSchema = z.object({
  campaignName: z.string(),
  tiltifyUrl: z.string(),
  tiltifySlug: z.string(),
  tiltifyName: z.string(),
  tiltifyDescription: z.string().optional(),
  tiltifyCauseId: z.string().nullable(),
  avatar: z.string(), // twitch image if available or tiltify image
  raised: CurrenciesSchema,
  twitch: z.string().optional(),
  isTwitchLive: z.boolean(),
  youtube: z.string().optional(),
  scheduleUrl: z.string().optional(),
  // NEW tags for the user
  tags: z.array(SimpleCampaignTag).default([]),
})

export const JJCampaignsSchema = z.object({
  count: z.number(),
  list: z.array(JJCampaignSchema),
})

// --- Inferred TS types (optional, matches your interfaces) ---
export type JJCauseType = z.infer<typeof JJCauseSchema>
export type JJCampaignType = z.infer<typeof JJCampaignSchema>
export type JJCampaignsType = z.infer<typeof JJCampaignsSchema>
const UserDisplaySchema = z.object({
  /** Unique identifier from the users table */
  userId: z.number(),
  /** Primary streaming platform preference (twitch, youtube, tiktok) */
  primaryLiveStream: z.string(),
  /** Display name, typically from the primary streaming platform */
  username: z.string(),
  /** Profile image URL from the streaming platform */
  profileImage: z.string(),
  /** Twitch login username, null if no Twitch account linked */
  twitchLogin: z.string().nullable(),
  /** Tiltify fundraising profile slug */
  tiltifySlug: z.string(),
  /** Full Tiltify profile URL for fundraising campaigns */
  tiltifyUrl: z.string(),
  /** Custom primary brand color from userStyles table */
  primaryColor: z.string().nullable(),
  /** Custom accent color from userStyles table */
  accentColor: z.string().nullable(),
})
const StreamTagSchema = z.object({
  /** Tag display name */
  name: z.string(),
  /** URL-friendly tag identifier */
  slug: z.string(),
  /** Hex color code for tag display */
  color: z.string(),
})
export const StreamSchema = z.object({
  /** Unique identifier for the stream */
  id: z.number().int().nonnegative(),
  /** ID of the schedule this stream belongs to */
  scheduleId: z.number().int().nonnegative(),
  /** ID of the user who created this stream */
  createdBy: z.number().int().nonnegative(),
  /** Display title of the stream */
  title: z.string(),
  /** Whether this stream is publicly visible */
  visible: z.boolean(),
  /** Optional subtitle for additional context */
  subtitle: z.string().nullable(),
  /** Optional detailed description of the stream content */
  description: z.string().nullable(),
  /** Optional YouTube VOD URL for recorded content */
  youtubeVodUrl: z.string().nullable(),
  /** Optional Twitch VOD URL for recorded content */
  twitchVodUrl: z.string().nullable(),
  /** Stream start timestamp */
  start: z.date(),
  /** Stream end timestamp */
  end: z.date(),
  /** Array of tags associated with this stream */
  tags: z.array(StreamTagSchema),
  /** Array of users participating in this stream */
  participants: z.array(UserDisplaySchema),
})

export const UserStreamSchema = z.object({
  stream: StreamSchema,
  owner: UserDisplaySchema,
})

export const UserStreamsSchema = z.object({
  count: z.number(),
  streams: z.array(UserStreamSchema),
})

// List endpoints (existing)
const campaignsContract = oc.output(JJCampaignsSchema)

const causesContract = oc.output(
  z.object({
    count: z.number(),
    causes: z.array(JJCauseSchema),
  }),
)

const upcomingStreamsContract = oc.output(UserStreamsSchema)
export const UserWithInfoTags = SimplePublicTagSchema.extend({
  tagId: z.number(),
  usage: z.number(),
})

export type UserWithInfoTags = z.infer<typeof UserWithInfoTags>
export const UserWithInfo = UserDisplaySchema.extend({
  tags: z.array(UserWithInfoTags),
  scheduleUrl: z.string().optional(),
})
export type UserWithInfo = z.infer<typeof UserWithInfo>

const getAllUsersWithInfoContract = oc.output(z.array(UserWithInfo))
export const UserCampaignPairSchema = z.object({
  user: UserWithInfo.optional(),
  campaign: z.lazy(() => JJCampaignSchema).optional(),
})

export type UserCampaignPair = z.infer<typeof UserCampaignPairSchema>

const getUserCampaignPairsContract = oc.output(z.array(UserCampaignPairSchema))

const OverviewSchema = z.object({
  raised: JJRaisedSchema,
  collections: z.object({
    redeemed: z.number(),
    total: z.number(),
  }),
  donations: z.number(),
  date: z.date(),
})

export type Overview = z.infer<typeof OverviewSchema>

const overviewContract = oc
  .output(OverviewSchema)

export const contracts = {
  campaignsContract,
  causesContract,
  upcomingStreamsContract,
  getAllUsersWithInfoContract,
  getUserCampaignPairsContract,
  overviewContract,
}
