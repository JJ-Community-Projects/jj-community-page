import {oc} from '@orpc/contract'
import z from "zod";
import {HexColorSchema, SuccessSchema} from "../../../schemas/common.ts";
import {StreamingPlatformSchema} from "../../../schemas/users.ts";

/**
 * Profile management contracts for user style and streaming preferences.
 * These endpoints handle direct database operations for user profile customization.
 */

/**
 * Update user's primary color preference
 * Input: primaryColor (hex color string)
 * Output: success flag
 */
const updatePrimaryColorContract = oc
  .input(z.object({
    primaryColor: HexColorSchema
  }))
  .output(SuccessSchema)

/**
 * Update user's accent color preference
 * Input: accentColor (hex color string)
 * Output: success flag
 */
const updateAccentColorContract = oc
  .input(z.object({
    accentColor: HexColorSchema
  }))
  .output(SuccessSchema)
/**
 * Update user's accent color preference
 * Input: accentColor (hex color string)
 * Output: success flag
 */
const updateStyleContract = oc
  .input(z.object({
    primaryColor: HexColorSchema,
    accentColor: HexColorSchema
  }))
  .output(z.object({
    primaryColor: HexColorSchema,
    accentColor: HexColorSchema
  }))

/**
 * Update user's primary live streaming platform
 * Input: platform (twitch, youtube, or tiktok)
 * Output: success flag
 */
const updatePrimaryLiveStreamContract = oc
  .input(z.object({
    platform: StreamingPlatformSchema
  }))
  .output(SuccessSchema)

/**
 * Get user's primary live streaming platform
 * Output: platform string (twitch, youtube, tiktok, or null)
 */
const getPrimaryLiveStreamContract = oc.output(z.string().nullable())

/**
 * Get user's style preferences (primary and accent colors)
 * Output: object with primaryColor and accentColor hex strings
 */
const getStyleContract = oc.output(
  z.object({
    primaryColor: HexColorSchema.nullable(),
    accentColor: HexColorSchema.nullable()
  })
)


export const profileContract = {
  style: {
    updatePrimaryColorContract,
    updateAccentColorContract,
    getStyleContract,
    updateStyleContract
  },
  streaming: {
    updatePrimaryLiveStreamContract,
    getPrimaryLiveStreamContract,
  }
}
