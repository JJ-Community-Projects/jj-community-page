import {z} from "zod";
import {TeamSchema} from "./teams.ts";
import {StreamSchema} from "./schedule.ts";
import {SocialSchema as Social, UserDisplaySchema} from "../../schemas/users.ts";
import {TagSchema as Tag} from "../../schemas/tags.ts";
import {ScheduleInfoSchema} from "../../schemas/schedules.ts";

/**
 * Public user contracts for retrieving user information without authentication.
 * These schemas handle read-only operations for user profiles, relationships, and associated data.
 */


/**
 * Schema for validating user slug parameters in API requests.
 * User slugs are derived from provider usernames (e.g., Tiltify login) and used for URL routing.
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
