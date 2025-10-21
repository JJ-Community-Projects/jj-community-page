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

const CreatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  imageUrl: z.string().optional(),
  color: z.string(),
})

const StreamSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  markdownDescription: z.string().optional(),
  start: z.date(),
  end: z.date(),
  creators: z.array(CreatorSchema).optional(),
  vods: z
    .array(
      z.object({
        label: z.string().optional(),
        link: z.string(),
      }),
    )
    .optional(),
  color: z.string(),
})

const ExtensionConfigSchema = z.object({
  year: z.number(),
  showYogsSchedule: z.boolean(),
  showCharities: z.boolean(),
  showFundraisers: z.boolean(),
  refreshInterval: z.object({
    yogsSchedule: z.number(),
    charities: z.number(),
    fundraisers: z.number(),
  }),
  donationLink: z.object({
    url: z.string(),
    visible: z.boolean(),
    text: z.string(),
  }),
  donationTrackerUrl: z.string(),
  timestamp: z.string(),
})

const extensionConfigContract = oc
  .input(
    z.object({
      twitch: z.object({
        channelId: z.string(),
        userId: z.string(),
      }),
    }),
  )
  .output(ExtensionConfigSchema)
  .route({
    path: '/twitch-extension/config',
    method: 'GET',
    operationId: 'getExtensionConfig',
    summary: 'Get the extension configuration',
    description: 'Get the extension configuration',
    tags: ['twitch-extension'],
    successDescription: 'Extension configuration retrieved successfully',
  }) 

// List endpoints (existing)
const campaignsContract = oc
  .input(
    z.object({
      twitch: z.object({
        channelId: z.string(),
        userId: z.string(),
      }),
    }),
  )
  .output(JJCampaignsSchema)
  .route({
    path: '/twitch-extension/campaigns',
    method: 'GET',
    operationId: 'getCampaigns',
    summary: 'Get campaigns',
    description: 'Retrieve all campaigns from the jj api',
    tags: ['twitch-extension'],
    successDescription: 'Campaigns retrieved successfully',
  })

const causesContract = oc
  .input(
    z.object({
      twitch: z.object({
        channelId: z.string(),
        userId: z.string(),
      }),
    }),
  )
  .output(
    z.object({
      count: z.number(),
      list: z.array(JJCauseSchema),
    }),
  )
  .route({
    path: '/twitch-extension/causes',
    method: 'GET',
    operationId: 'getCauses',
    summary: 'Get causes',
    description: 'Retrieve all causes from the jj api',
    tags: ['twitch-extension'],
    successDescription: 'Causes retrieved successfully',
    deprecated: false,
  })

const yogsScheduleContract = oc
  .input(
    z.object({
      twitch: z.object({
        channelId: z.string(),
        userId: z.string(),
      }),
    }),
  )
  .output(
    z.object({
      /**
       * The date of the earliest stream in the schedule.
       */
      start: z.date(),
      /**
       * The date of the latest stream in the schedule.
       */
      end: z.date(),
      /**
       * The index of the day in the schedule that should be shown first.
       * The index is 0-based, so the first day is day 0.
       * This is used to determine the initial day when the user first visits the extension.
       */
      initialDayIndex: z.number(),
      days: z.array(
        z.object({
          /**
           * The date of the first stream in the day.
           */
          start: z.date(),
          /**
           * The date of the last stream in the day.
           */
          end: z.date(),
          streams: z.array(StreamSchema),
        }),
      ),
      streams: z.array(StreamSchema),
    }),
  )
  .route({
    path: '/twitch-extension/yogs-schedule',
    method: 'GET',
    operationId: 'getYogsSchedule',
    summary: 'Get the yogs schedule',
    description: 'Get the yogs schedule',
    tags: ['twitch-extension'],
    successDescription: 'Yogs schedule retrieved successfully',
  })

export const contracts = {
  extensionConfigContract,
  campaignsContract,
  causesContract,
  yogsScheduleContract,
}
