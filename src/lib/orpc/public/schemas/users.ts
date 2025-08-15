import {z} from "zod";
import {TeamSchema} from "./teams.ts";
import {ScheduleInfoSchema, StreamSchema} from "./schedule.ts";

/**
 * Public user contracts for retrieving user information without authentication.
 * These schemas handle read-only operations for user profiles, relationships, and associated data.
 */

/**
 * Schema for validating user ID parameters in API requests.
 * Ensures the ID is a positive integer matching the users table primary key.
 */
export const UserIdSchema = z.number().int().positive();

/**
 * Schema for validating user slug parameters in API requests.
 * User slugs are derived from provider usernames (e.g., Twitch login) and used for URL routing.
 */
export const UserSlugSchema = z.string();

/**
 * Schema for pagination parameters used in user listing endpoints.
 * Provides standardized pagination with reasonable defaults and limits.
 */
export const UserPaginationSchema = z.object({
  /** Number of users to return per page (1-100, default: 20) */
  limit: z.number().int().min(1).max(100).default(20),
  /** Page number for pagination (1-based, default: 1) */
  page: z.number().int().min(1).default(1),
});

/**
 * Schema for user display information used in public API responses.
 * Contains essential user data for profile cards, user lists, and public displays.
 * Combines data from users, accounts, and userStyles tables.
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


/**
 * Schema for social media links associated with a user profile.
 * Contains platform-specific social media connections and external links.
 * Used to display social media buttons and contact information on user profiles.
 */
export const Social = z.object({
  /** Social media platform identifier (e.g., 'twitter', 'instagram', 'youtube') */
  provider: z.string(),
  /** Full URL to the user's profile on the social media platform */
  url: z.string(),
})

/**
 * Schema for user-defined tags that categorize content creators and their content.
 * Used for content discovery, filtering, and matching users with similar interests.
 * Tags help users find creators based on gaming preferences, content types, etc.
 */
export const Tag = z.object({
  /** Unique tag identifier used internally for categorization and filtering */
  tag: z.string(),
  /** Human-readable display label shown to users in the interface */
  label: z.string(),
})


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

/**
 * Schema for comprehensive user data including relationships and associations.
 * Used for detailed user profile pages that show friends, teams, and schedules.
 * Combines user information with related entities from the social graph.
 */
export const UserProfileDataSchema = z.object({
  /** User display information for the profile being viewed */
  user: UserDisplaySchema,
  /** Array of social media links and external profile connections */
  socials: z.array(Social),
  /** Array of user-defined tags for content categorization and discovery */
  tags: z.array(Tag),
  /** Array of users who are friends with this user */
  friends: z.array(UserDisplaySchema),
  /** Array of teams this user belongs to */
  teams: z.array(TeamSchema),
  /** Primary schedule for the user, if one exists and is visible */
  primarySchedule: ScheduleInfoSchema.optional(),
  /** Array of schedules this user has created or participates in */
  schedules: z.array(ScheduleInfoSchema),
  /** The next 3 streams belonging to a schedule of this user */
  nextStreams: z.array(StreamSchema).max(3),
  /** The next 3 streams belonging to schedules from other users where this user is part of */
  nextStreamsOthers: z.array(StreamSchema).max(3),
});
