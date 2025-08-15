import {z} from "zod";

/**
 * User-related schemas for private oRPC procedures.
 * These schemas handle authenticated user operations including profile management and preferences.
 */

/**
 * Schema for user display information in private contexts.
 * Contains comprehensive user data including role information and administrative fields.
 * Used in: tags, blocks contracts for user identification and display
 *
 * Differences from public UserDisplaySchema:
 * - Includes role field with admin/user enum for permission checking
 * - Used in authenticated contexts where role information is needed
 */
export const UserDisplaySchema = z.object({
  /** Unique identifier from the users table */
  userId: z.number(),
  /** Primary streaming platform preference (twitch, youtube, tiktok) */
  primaryLiveStream: z.string(),
  /** User role for permission and access control (admin users have elevated privileges) */
  role: z.enum(['user', 'admin']),
  /** Account creation timestamp */
  createdAt: z.date(),
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
});

/**
 * Schema for primary streaming platform selection.
 * Defines the supported platforms for live streaming preference.
 * Used in: profile contract for updating user's primary streaming platform
 *
 * Supported platforms:
 * - twitch: Twitch.tv streaming platform
 * - youtube: YouTube Live streaming
 * - tiktok: TikTok Live streaming
 */
export const StreamingPlatformSchema = z.enum(['twitch', 'youtube', 'tiktok']);

/**
 * Schema for Twitch channel information associated with a user.
 * Contains Twitch-specific profile data fetched from the Twitch API.
 * Used to display Twitch channel details and streaming information.
 */
export const TwitchChannelSchema = z.object({
  /** User ID that owns this Twitch channel */
  userId: z.number(),
  /** Twitch channel ID (primary key from Twitch API) */
  id: z.string(),
  /** Twitch login username (lowercase) */
  login: z.string(),
  /** Twitch display name (formatted) */
  displayName: z.string(),
  /** Channel description/bio from Twitch profile */
  description: z.string().nullable(),
  /** Profile image URL from Twitch */
  profileImageUrl: z.string().nullable(),
  /** Offline image URL from Twitch */
  offlineImageUrl: z.string().nullable(),
});
