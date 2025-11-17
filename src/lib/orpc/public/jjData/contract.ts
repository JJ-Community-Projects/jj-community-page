import { oc } from '@orpc/contract'
import { z } from 'zod/v4'
import {
  CausesDisplaySchema,
  JJCampaignSchema as JJCampaignTVSchema,
  JJCampaignsSchema as JJCampaignsTVSchema,
  JJCauseSchema,
} from '../twitchExtension/contract.ts'
import { JJCampaignsSchema as CommunityJJCampaignsSchema } from '../../private/jjData/contract.ts'

// A generic contract that allows clients to request a selection of
// cached JingleJam DO properties by name.
//
// Input: array of strings representing property keys to return.
// Output: an object containing only those requested keys.
//
// Output typing: We expose a typed object whose keys map to known cached
// getters in the JingleJam Durable Object. Every property is optional so
// callers can request any subset without validation failures.
const CollectionsSchema = z.object({ redeemed: z.number(), total: z.number() })

export const JJDataPropsOutputSchema = z.object({
  // direct lists
  getCausesTV: z.array(JJCauseSchema).optional(),
  getCauses: z.array(z.unknown()).optional(),
  getCampaigns: z.array(z.unknown()).optional(),

  // simple numeric/string/meta getters
  getDollarConversionRate: z.number().optional(),
  getGbpToEurRate: z.number().optional(),
  getRaised: z.number().optional(),
  getCollections: CollectionsSchema.optional(),
  getDonations: z.number().optional(),
  getDate: z.string().optional(),

  // display aggregates
  getCampaignsDisplay: JJCampaignsTVSchema.optional(),
  getCausesDisplay: CausesDisplaySchema.optional(),
  getCommunityCampaignsDisplay: CommunityJJCampaignsSchema.optional(),

  // twitch related
  getLiveLogins: z.array(z.string()).optional(),
  getAllCampaignDisplay: z.array(JJCampaignTVSchema).optional(),
  getValidTwitchLogins: z.array(z.string()).optional(),
  getInvalidTwitchLogins: z.array(z.string()).optional(),
  getAllTwitchLogins: z.array(z.string()).optional(),
  getAllYoutubeLogins: z.array(z.string()).optional(),

  // user tags (shape is a map keyed by tiltify slug -> user data); keep loose
  getUserTagsDisplay: z
    .array(
      z.object({
        userId: z.number(),
        tiltifySlug: z.string().nullable(),
        tags: z
          .array(
            z.object({
              name: z.string(),
              id: z.number(),
              slug: z.string(),
              color: z.string(),
              usage: z.number(),
            }),
          )
          .optional()
          .default([]),
      }),
    )
    .optional(),
})
export const getJJDataPropsContract = oc
  // If no input provided, treat as an empty array (return all props)
  .input(z.object({ props: z.array(z.string()).default([]) }))
  .output(JJDataPropsOutputSchema)
  .route({
    path: '/jj-data/props',
    method: 'GET',
    operationId: 'getJJDataProps',
    summary: 'Get selected JingleJam cached properties',
    description:
      'Returns an object containing selected cached properties from the JingleJam Durable Object. The input array controls which properties are returned.',
    tags: ['jj-data'],
  })

export const jjDataContracts = {
  getJJDataPropsContract,
  // Returns an image/png preview of the Yogs schedule with optional creator avatars overlay
}

// Expose the yogs schedule preview image (public)
export const getYogsSchedulePreviewImageContract = oc
  .input(
    z.object({
      filter: z
        .string()
        .optional()
        .describe('Comma-separated creator slugs/ids'),
      year: z
        .union([z.string(), z.number()])
        .optional()
        .describe('Schedule year (defaults to 2025)')
        .default('2025'),
    }),
  )
  // We return a raw Response streaming image/png; keep schema loose
  .output(z.file().mime('image/png'))
  .route({
    path: '/jj-data/yogs-schedule-preview-image',
    method: 'GET',
    operationId: 'getYogsSchedulePreviewImage',
    summary: 'Generate Yogs schedule preview image',
    description:
      'Returns a PNG card. If filter is provided, overlays up to 5 creator avatars onto the base image.',
    tags: ['jj-data'],
    successStatus: 307,
    outputStructure: 'detailed',
  })

// Re-export contracts object including the new route
export const yogsImageContracts = {
  getYogsSchedulePreviewImageContract,
}
