import {z} from "zod";

/**
 * Social media and platform integration schemas for private oRPC procedures.
 * These schemas handle social media connections, platform validations, and import operations.
 */

/**
 * Schema for supported social media platforms.
 * Defines all social media platforms that users can link to their profiles.
 * Used in: platforms contract for adding/removing social media connections
 *
 * Supported platforms:
 * - twitch: Twitch.tv streaming and social platform
 * - twitter: Twitter/X social media platform
 * - bsky: Bluesky decentralized social platform
 * - youtube: YouTube content and social platform
 * - instagram: Instagram photo and social platform
 * - tiktok: TikTok short-form video platform
 */
export const SocialProviderSchema = z.enum([
  'twitch',
  'twitter',
  'bsky',
  'youtube',
  'instagram',
  'tiktok'
]);

/**
 * Schema for social media import operation results.
 * Provides feedback on the success of importing data from social platforms.
 * Used in: tiltify and other social import contracts for operation status reporting
 */
export const SocialImportResultSchema = z.object({
  /** The social media platform that was processed during import */
  provider: z.string(),
  /** Whether the import operation completed successfully */
  success: z.boolean()
});

export const SocialSchema = z.object({
  provider: z.string(),
  url: z.string().url(),
})
