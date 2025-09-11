import {z} from "zod/v4";
import {UserDisplaySchema} from "./UserDisplaySchema.ts";

/**
 * Schedule-related schemas used across public and private oRPC procedures.
 * These schemas handle schedule information, creation, and management operations.
 */

const ScheduleSlugSchema = z.string().nonempty();

export const ScheduleSlugInputSchema = z.object({
  slug: ScheduleSlugSchema
})

export const UserSlugWithYearSchema = z.object({
  slug: ScheduleSlugSchema,
  year: z.number(),
})

export const YearInputSchema = z.object({
  year: z.number().int().min(2020).max(2030)
})

/**
 * Schema for basic schedule information based on the schedulesTable structure.
 * Represents a single schedule event (e.g., JingleJam 2024) with metadata.
 * Used in: both public schedule display and private schedule management
 */
export const ScheduleInfoSchema = z.object({
  /** Unique identifier for the schedule */
  id: z.number().int().nonnegative(),
  /** Display title of the schedule (e.g., "JingleJam 2024") */
  title: z.string(),
  /** URL-friendly slug for the schedule (e.g., "jinglejam-2024") */
  slug: z.string(),
  /** Year this schedule belongs to */
  year: z.number().int(),
  /** Whether this schedule is publicly visible */
  visible: z.boolean(),
  /** Whether this is the primary/main schedule for the year */
  primary: z.boolean(),
  /** User ID of the schedule owner/creator */
  ownerId: z.number().int().nonnegative(),
  /** Timestamp when the schedule was created */
  createdAt: z.date(),
  /** Timestamp when the schedule was last updated */
  updatedAt: z.date(),
});

/**
 * Schema for schedule ID response format.
 * Provides consistent structure for operations that return a schedule identifier.
 * Used in: private schedule creation and management operations
 */
export const ScheduleIdSchema = z.object({
  /** The unique identifier of the schedule */
  scheduleId: z.number()
});

/**
 * Schema for schedule creation response.
 * Used in: private schedule creation operations
 */
export const CreateScheduleResponseSchema = z.object({
  /** The created schedule object */
  schedule: ScheduleInfoSchema
});

/**
 * Schema for schedule slug validation response.
 * Provides validation feedback and alternative suggestions for schedule slug creation.
 * Used in: private schedule management for validating schedule slug availability and format
 */
export const SlugValidationSchema = z.object({
  /** Whether the proposed slug is valid and available for use */
  isValid: z.boolean(),
  /** Array of alternative slug suggestions if the proposed one is invalid or taken */
  suggestions: z.array(z.string())
});

/**
 * Schema for schedule list response.
 * Used for operations that return multiple schedules.
 * Used in: both public and private schedule listing operations
 */
export const SchedulesListSchema = z.array(ScheduleInfoSchema);

/**
 * Schema for next schedule response.
 * Returns the next upcoming schedule for a user.
 * Used in: schedule lookup operations that return upcoming schedules
 */
export const NextScheduleResponseSchema = z.object({
  /** The next schedule with streams, or null if none found */
  nextSchedule: z.any().nullable()
});

/**
 * Schema for stream tag information.
 * Represents tags associated with streams for categorization and filtering.
 */
export const StreamTagSchema = z.object({
  /** Tag display name */
  name: z.string(),
  /** URL-friendly tag identifier */
  slug: z.string(),
  /** Hex color code for tag display */
  color: z.string(),
});

/**
 * Schema for individual stream data with tags and participants.
 * Represents a single stream event within a schedule with all associated metadata.
 * Used in: schedule display, stream management, and full schedule operations
 */
export const StreamSchema = z.object({
  /** Unique identifier for the stream */
  id: z.number().int().nonnegative(),
  /** ID of the schedule this stream belongs to */
  scheduleId: z.number().int().nonnegative(),
  /** ID of the user who created this stream */
  createdBy: z.number().int().nonnegative(),
  /** Display title of the stream */
  title: z.string(),
  /** Whether this stream is publicly visible */
  visible: z.boolean(),
  /** Optional subtitle for additional context */
  subtitle: z.string().nullable(),
  /** Optional detailed description of the stream content */
  description: z.string().nullable(),
  /** Optional YouTube VOD URL for recorded content */
  youtubeVodUrl: z.string().nullable(),
  /** Optional Twitch VOD URL for recorded content */
  twitchVodUrl: z.string().nullable(),
  /** Stream start timestamp */
  start: z.date(),
  /** Stream end timestamp */
  end: z.date(),
  /** Array of tags associated with this stream */
  tags: z.array(StreamTagSchema),
  /** Array of users participating in this stream */
  participants: z.array(UserDisplaySchema),
});

/**
 * Schema for organizing streams by day.
 * Groups streams that occur on the same calendar date.
 * Used in: schedule organization and daily view displays
 */
export const ScheduleDaySchema = z.object({
  /** Date object for the day */
  day: z.date(),
  /** Array of streams occurring on this day, sorted by start time */
  streams: z.array(StreamSchema),
});

/**
 * Schema for organizing days into weekly groupings.
 * Groups schedule days into calendar weeks for weekly view displays.
 * Used in: schedule organization and weekly view displays
 */
export const ScheduleWeekSchema = z.object({
  /** ISO date string for the week start date (YYYY-MM-DD format) */
  startDate: z.string(),
  /** ISO date string for the week end date (YYYY-MM-DD format) */
  endDate: z.string(),
  /** Array of days in this week that have streams */
  days: z.array(ScheduleDaySchema),
  /** Flattened array of all streams in this week */
  streams: z.array(StreamSchema),
});

/**
 * Schema for complete schedule data with all associated information.
 * Combines schedule metadata with streams, participants, and organizational data.
 * Used in: full schedule display operations and detailed schedule views
 */
export const FullScheduleSchema = z.object({
  /** Basic schedule information and metadata */
  data: ScheduleInfoSchema,
  /**
   * Represents the owner of an entity or resource.
   * The owner is defined using the UserDisplaySchema, which contains the details
   * or attributes associated with the user.
   */
  owner: UserDisplaySchema,
  /** Array of all streams in this schedule */
  streams: z.array(StreamSchema),
  /** Array of next 3 upcoming streams from this schedule */
  nextStreams: z.array(StreamSchema),
  /** Streams organized by day for calendar-style display */
  days: z.array(ScheduleDaySchema),
  /** Days organized into weekly groupings */
  weeks: z.array(ScheduleWeekSchema),
  /** Array of all unique users participating in streams */
  participants: z.array(UserDisplaySchema),
});

export type ScheduleInfo = z.infer<typeof ScheduleInfoSchema>
export type ScheduleId = z.infer<typeof ScheduleIdSchema>
export type CreateScheduleResponse = z.infer<typeof CreateScheduleResponseSchema>
export type SlugValidation = z.infer<typeof SlugValidationSchema>
export type SchedulesList = z.infer<typeof SchedulesListSchema>
export type NextScheduleResponse = z.infer<typeof NextScheduleResponseSchema>
export type StreamTag = z.infer<typeof StreamTagSchema>
export type Stream = z.infer<typeof StreamSchema>
export type ScheduleDay = z.infer<typeof ScheduleDaySchema>
export type ScheduleWeek = z.infer<typeof ScheduleWeekSchema>
export type FullSchedule = z.infer<typeof FullScheduleSchema>
