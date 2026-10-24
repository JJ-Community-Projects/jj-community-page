import { oc } from '@orpc/contract'
import z from 'zod/v4'
import { HexColorSchema } from '../schemas/common.ts'
import { StreamingPlatformSchema } from '../schemas/users.ts' /**
 * Profile management contracts for user style and streaming preferences.
 * These endpoints handle direct database operations for user profile customization.
 */

/**
 * Profile management contracts for user style and streaming preferences.
 * These endpoints handle direct database operations for user profile customization.
 */

/**
 * Update user's primary and accent colors
 * Output: the saved colors
 */
const updateStyleContract = oc
  .input(
    z.object({
      primaryColor: HexColorSchema,
      accentColor: HexColorSchema,
    }),
  )
  .output(
    z.object({
      primaryColor: HexColorSchema,
      accentColor: HexColorSchema,
    }),
  )

/**
 * Update user's primary live streaming platform
 * Input: platform (twitch, youtube, or tiktok)
 * Output: success flag
 */
const updatePrimaryLiveStreamContract = oc
  .input(
    z.object({
      platform: StreamingPlatformSchema,
    }),
  )
  .output(
    z.object({
      platform: StreamingPlatformSchema,
    }),
  )

/**
 * Get user's primary live streaming platform
 * Output: platform string (twitch, youtube, tiktok, or null)
 */
const getPrimaryLiveStreamContract = oc.output(StreamingPlatformSchema)

/**
 * Get user's style preferences (primary and accent colors)
 * Output: object with primaryColor and accentColor hex strings
 */
const getStyleContract = oc.output(
  z.object({
    primaryColor: HexColorSchema.nullable(),
    accentColor: HexColorSchema.nullable(),
  }),
)

export const profileContract = {
  getStyleContract,
  updateStyleContract,
  updatePrimaryLiveStreamContract,
  getPrimaryLiveStreamContract,
}
