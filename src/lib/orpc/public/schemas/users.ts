import { z } from 'zod/v4'
import { TeamSchema } from './teams.ts'
import { ScheduleInfoSchema, StreamSchema } from './schedules.ts'
import { SocialSchema } from './social.ts'
import { SimplePublicTagSchema } from './tags.ts'
import { UserIdSchema } from './common.ts'
import { UserDisplaySchema } from './UserDisplaySchema.ts'

/**
 * Schema for pagination parameters used in user listing endpoints.
 * Provides standardized pagination with reasonable defaults and limits.
 */
export const UserPaginationSchema = z.object({
  /** Number of users to return per page (1-100, default: 20) */
  limit: z.number().int().min(1).default(20),
  /** Page number for pagination (1-based, default: 1) */
  page: z.number().int().min(1).default(1),
})

export const UserPaginationOutputSchema = z.object({
  users: z.array(UserDisplaySchema),
  total: z.number(),
  totalNumberOfPages: z.number(),
  limit: z.number().int(),
  currentPage: z.number().int().min(1).default(1),
  hasNextPage: z.boolean(),
})

/**
 * Schema for user search input parameters.
 * Used for searching users by username with configurable limits.
 */
export const UserSearchInputSchema = z.object({
  /** Maximum number of results to return (1-10, default: 5) */
  limit: z.number().min(1).max(10).default(5),
  /** Search term for matching usernames */
  searchTerm: z.string().min(1, 'Search term must not be empty'),
})

/**
 * Schema for basic user search results.
 * Returns essential user identifiers without full display data.
 */
export const BasicUserSearchOutputSchema = z.object({
  /** Internal user ID */
  userId: z.number(),
  /** Tiltify username if connected */
  tiltifyUsername: z.string().nullable(),
  /** Twitch username if connected */
  twitchUsername: z.string().nullable(),
})

/**
 * Schema for similar users search input.
 * Used for finding users with similar profiles or interests.
 */
export const SimilarUsersInputSchema = z.object({
  /** ID of the user to find similar users for */
  userId: UserIdSchema,
  /** Maximum number of similar users to return (1-10, default: 5) */
  limit: z.number().min(1).max(10).default(5),
})

/**
 * Schema for comprehensive user data including relationships and associations.
 * Used for detailed user profile pages that show friends, teams, and schedules.
 * Combines user information with related entities from the social graph.
 */
export const UserProfileDataSchema = z.object({
  /** User display information for the profile being viewed */
  user: UserDisplaySchema,
  /** Array of social media links and external profile connections */
  socials: z.array(SocialSchema),
  /** Array of user-defined tags for content categorization and discovery */
  tags: z.array(SimplePublicTagSchema),
  /** Array of users who are friends with this user */
  friends: z.array(UserDisplaySchema),
  /** Array of users who are friends with this user */
  related: z.array(UserDisplaySchema),
  /** Array of teams this user belongs to */
  teams: z.array(TeamSchema),
  /** User style configuration with primary and accent colors */
  style: z.object({
    /** Primary brand color from userStyles table */
    primaryColor: z.string().nullable(),
    /** Accent color from userStyles table */
    accentColor: z.string().nullable(),
  }),
  /** Primary schedule for the user, if one exists and is visible */
  primarySchedule: ScheduleInfoSchema.optional(),
  /** Array of schedules this user has created or participates in */
  schedules: z.array(ScheduleInfoSchema),
  /** The next 3 streams belonging to a schedule of this user */
  nextStreams: z.array(StreamSchema).max(3),
  /** The next 3 streams belonging to schedules from other users where this user is part of */
  nextStreamsOthers: z.array(StreamSchema).max(3),
  /** The next 3 streams from the primary schedule of this user */
  nextPrimaryStreams: z.array(StreamSchema).max(3),
})

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
})

export const UserDisplayWithTagsSchema = UserDisplaySchema.extend({
  tags: z.array(SimplePublicTagSchema),
})

export type UserProfileData = z.infer<typeof UserProfileDataSchema>
export type UserPaginationOutput = z.infer<typeof UserPaginationOutputSchema>
export type BasicUserSearchOutput = z.infer<typeof BasicUserSearchOutputSchema>
export type TwitchChannel = z.infer<typeof TwitchChannelSchema>
export type UserDisplayWithTags = z.infer<typeof UserDisplayWithTagsSchema>
