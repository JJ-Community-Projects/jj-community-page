import {z} from "zod";

/**
 * User-related schemas used across public and private oRPC procedures.
 * These schemas handle user identification, display, and platform integrations.
 */

/**
 * Schema for primary streaming platform selection.
 * Defines the supported platforms for live streaming preference.
 * Used in: profile contracts for updating user's primary streaming platform
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
 * Used in: both public and private user operations
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

/**
 * Schema for social media links associated with a user profile.
 * Contains platform-specific social media connections and external links.
 * Used to display social media buttons and contact information on user profiles.
 * Used in: both public profile display and private social management
 */
export const SocialSchema = z.object({
  /** Social media platform identifier (e.g., 'twitter', 'instagram', 'youtube') */
  provider: z.string(),
  /** Full URL to the user's profile on the social media platform */
  url: z.string().url(),
});

/**
 * Schema for user display information used in public API responses.
 * Contains essential user data for profile cards, user lists, and public displays.
 * Combines data from users, accounts, and userStyles tables.
 * Used in: public user lookups, friend lists, team member displays
 */
export const UserDisplaySchema = z.object({
  /** Unique identifier from the users table */
  userId: z.number(),
  /** Primary streaming platform preference (twitch, youtube, tiktok) */
  primaryLiveStream: z.string(),
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
