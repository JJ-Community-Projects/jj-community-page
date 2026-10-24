import { z } from 'zod/v4'
import { TeamSchema } from './teams.ts'
import { ScheduleInfoSchema, StreamSchema } from './schedules.ts'
import { SocialSchema } from './social.ts'
import { SimplePublicTagSchema } from './tags.ts'
import { UserDisplaySchema } from './UserDisplaySchema.ts'

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
  /** The next 3 streams from the primary schedule of this user */
  nextPrimaryStreams: z.array(StreamSchema).max(3),
})

export const UserDisplayWithTagsSchema = UserDisplaySchema.extend({
  tags: z.array(SimplePublicTagSchema),
})

export type UserProfileData = z.infer<typeof UserProfileDataSchema>
export type UserDisplayWithTags = z.infer<typeof UserDisplayWithTagsSchema>
