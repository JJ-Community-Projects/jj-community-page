import z from 'zod/v4'
import { oc } from '@orpc/contract'
import { UserDisplaySchema } from '../schemas/UserDisplaySchema.ts'
// JJRaised schema (used inside JJCause)

export const CurrenciesSchema = z.object({
  gbp: z.number(),
  gbpFormatted: z.string(),
  usd: z.number(),
  usdFormatted: z.string(),
  euro: z.number(),
  euroFormatted: z.string(),
})

export type CurrenciesTV = z.infer<typeof CurrenciesSchema>

export const JJRaisedSchema = z.object({
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
  campaignName: z.string(),
  tiltifyUrl: z.string(),
  tiltifyName: z.string(),
  tiltifyDescription: z.string().optional(),
  tiltifyCauseId: z.number().optional(),
  avatar: z.string(),
  raised: CurrenciesSchema,
  goal: CurrenciesSchema,
  twitch: z
    .object({
      name: z.string(),
      avatar: z.string(),
      isLive: z.boolean(),
      url: z.string(),
    })
    .optional(),
})

// JJCampaigns schema
export const JJCampaignsSchema = z.object({
  count: z.number(),
  campaigns: z.array(JJCampaignSchema),
  date: z.date(),
})

// --- Inferred TS types (optional, matches your interfaces) ---
export type JJCauseTVType = z.infer<typeof JJCauseSchema>
export type JJCampaignTVType = z.infer<typeof JJCampaignSchema>
export type JJCampaignsTVType = z.infer<typeof JJCampaignsSchema>

export const CreatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  imageUrl: z.string().optional(),
  color: z.string(),
})

export const StreamSchema = z.object({
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

export const ExtensionConfigSchema = z.object({
  year: z.number(),
  showYogsSchedule: z.boolean(),
  showCharities: z.boolean(),
  showFundraisers: z.boolean(),
  showUserFundraiser: z.boolean(),
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

export const TabSchema = z.enum([
  'user-schedule',
  'yogs',
  'charities',
  'fundraisers',
])

export const UserExtensionConfigSchema = z.object({
  hasCampaign: z.boolean(),
  hasSchedule: z.boolean(),
  tabs: z.array(TabSchema),
})

export const OverviewSchema = z.object({
  raised: JJRaisedSchema,
  collections: z.object({
    redeemed: z.number(),
    total: z.number(),
  }),
  donations: z.number(),
  date: z.date(),
})

export const CausesDisplaySchema = z.object({
  count: z.number(),
  causes: z.array(JJCauseSchema),
})

export type CausesDisplayTVType = z.infer<typeof CausesDisplaySchema>

export const YogsScheduleSchema = z.object({
  title: z.string(),
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
})

export const UserScheduleSchema = z.object({
  title: z.string(),
  /**
   * The date of the earliest stream in the schedule.
   */
  start: z.date(),
  /**
   * The date of the latest stream in the schedule.
   */
  end: z.date(),
  /**
   * List of all streams from the primary schedule of the user.
   */
  streams: z.array(StreamSchema),
})

export const UserDataSchema = z.object({
  campaign: JJCampaignSchema,
  cause: JJCauseSchema.optional(),
})

export type UserDataType = z.infer<typeof UserDataSchema>

const extensionConfigContract = oc
  .input(
    z.object({
      channelId: z.string(),
      userId: z.string(),
    }),
  )
  .output(ExtensionConfigSchema)
  .route({
    path: '/twitch-extension/config/{channelId}',
    method: 'GET',
    operationId: 'getExtensionConfig',
    summary: 'Get the extension configuration',
    description: 'Get the extension configuration',
    tags: ['twitch-extension'],
    successDescription: 'Extension configuration retrieved successfully',
  })

const userExtensionConfigContract = oc
  .input(
    z.object({
      channelId: z.string(),
      userId: z.string(),
    }),
  )
  .output(UserExtensionConfigSchema)
  .route({
    path: '/twitch-extension/user-config/{channelId}',
    method: 'GET',
    operationId: 'getUserExtensionConfig',
    summary: 'Get the user extension configuration',
    description: 'Get the user extension configuration',
    tags: ['twitch-extension'],
    successDescription: 'User extension configuration retrieved successfully',
  })

// List endpoints (existing)
const campaignsContract = oc
  .input(
    z.object({
      channelId: z.string(),
      userId: z.string(),
    }),
  )
  .output(JJCampaignsSchema)
  .route({
    path: '/twitch-extension/campaigns/{channelId}',
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
      channelId: z.string(),
      userId: z.string(),
    }),
  )
  .output(CausesDisplaySchema)
  .route({
    path: '/twitch-extension/causes/{channelId}',
    method: 'GET',
    operationId: 'getCauses',
    summary: 'Get causes',
    description: 'Retrieve all causes from the jj api',
    tags: ['twitch-extension'],
    successDescription: 'Causes retrieved successfully',
    deprecated: false,
  })

const overviewContract = oc
  .input(
    z.object({
      channelId: z.string(),
      userId: z.string(),
    }),
  )
  .output(OverviewSchema)
  .route({
    path: '/twitch-extension/overview/{channelId}',
    method: 'GET',
    operationId: 'getOverview',
    summary: 'Get overview',
    description: 'Retrieve overview from the jj api',
    tags: ['twitch-extension'],
    successDescription: 'Overview retrieved successfully',
    deprecated: false,
  })

const yogsScheduleContract = oc
  .input(
    z.object({
      channelId: z.string(),
      userId: z.string(),
    }),
  )
  .output(YogsScheduleSchema)
  .route({
    path: '/twitch-extension/yogs-schedule',
    method: 'GET',
    operationId: 'getYogsSchedule',
    summary: 'Get the yogs schedule',
    description: 'Get the yogs schedule',
    tags: ['twitch-extension'],
    successDescription: 'Yogs schedule retrieved successfully',
  })

const userDataContract = oc
  .input(
    z.object({
      channelId: z.string(),
      userId: z.string(),
    }),
  )
  .output(UserDataSchema)
  .route({
    path: '/twitch-extension/user-data/{channelId}',
    method: 'GET',
    operationId: 'getUserData',
    summary: 'Get the users data',
    description: 'Get the use data',
    tags: ['twitch-extension'],
    successDescription: 'User data retrieved successfully',
  })

const userScheduleContract = oc
  .input(
    z.object({
      channelId: z.string(),
      userId: z.string(),
    }),
  )
  .output(UserScheduleSchema)
  .route({
    path: '/twitch-extension/user-schedule/{channelId}',
    method: 'GET',
    operationId: 'getUserSchedule',
    summary: 'Get the users schedule',
    description: 'Get the use schedule',
    tags: ['twitch-extension'],
    successDescription: 'User schedule retrieved successfully',
  })

const userRelationsContract = oc
  .input(
    z.object({
      channelId: z.string(),
      userId: z.string(),
    }),
  )
  .output(
    z.object({
      friends: z.array(UserDisplaySchema),
    }),
  )
  .route({
    path: '/twitch-extension/user-relations/{channelId}',
    method: 'GET',
    operationId: 'getUserRelations',
    summary: 'Get the user relations',
    description: 'Find the user by Twitch channel and return their friends',
    tags: ['twitch-extension'],
    successDescription: 'User relations retrieved successfully',
  })

const userRelatedScheduleContract = oc
  .input(
    z.object({
      channelId: z.string(),
      userId: z.string(),
    }),
  )
  .output(
    z.object({
      teams: z.object({
        streams: z.array(StreamSchema),
      }),
    }),
  )
  .route({
    path: '/twitch-extension/user-related-schedule/{channelId}',
    method: 'GET',
    operationId: 'getUserRelatedSchedule',
    summary: 'Get the user related schedule',
    description:
      'Find the user by Twitch channel and return next streams from their teams',
    tags: ['twitch-extension'],
    successDescription: 'User related schedule retrieved successfully',
  })

export const contracts = {
  extensionConfigContract,
  userExtensionConfigContract,
  campaignsContract,
  causesContract,
  overviewContract,
  yogsScheduleContract,
  userDataContract,
  userScheduleContract,
  userRelationsContract,
  userRelatedScheduleContract,
}
