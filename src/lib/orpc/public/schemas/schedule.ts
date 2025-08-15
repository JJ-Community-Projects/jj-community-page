import {z} from 'zod';
import {UserDisplaySchema} from "../../schemas/users.ts";
import {TagSchema as StreamTagSchema} from "../../schemas/tags.ts";
import {ScheduleInfoSchema} from "../../schemas/schedules.ts";

/**
 * Public schedule contracts for retrieving schedule and stream information without authentication.
 * These schemas handle read-only operations for visible schedules and their associated streams.
 */



/**
 * Schema for individual stream data based on the streamsTable structure.
 * Represents a single streaming session with timing, metadata, and participants.
 */
export const StreamSchema = z.object({
  /** Unique identifier for the stream */
  id: z.number().int().positive(),
  /** ID of the schedule this stream belongs to */
  scheduleId: z.number().int().positive(),
  /** User ID of who created/scheduled this stream */
  createdBy: z.number().int().positive(),
  /** Main title of the stream */
  title: z.string(),
  /** Whether this stream is publicly visible */
  visible: z.boolean(),
  /** Optional subtitle or additional context */
  subtitle: z.string().nullable(),
  /** Detailed description of the stream content */
  description: z.string().nullable(),
  /** URL to the YouTube VOD recording (if available) */
  youtubeVodUrl: z.string().nullable(),
  /** URL to the Twitch VOD recording (if available) */
  twitchVodUrl: z.string().nullable(),
  /** Stream start date and time */
  start: z.date(),
  /** Stream end date and time */
  end: z.date(),
  /** Array of tags categorizing this stream */
  tags: z.array(StreamTagSchema),
  /** Array of users participating in this stream */
  participants: z.array(UserDisplaySchema),
});

/**
 * Schema for grouping streams by day within a schedule.
 * Used for organizing streams in a daily view format.
 */
export const ScheduleDaySchema = z.object({
  /** ISO date string representing the day (YYYY-MM-DD) */
  day: z.string(),
  /** Array of streams scheduled for this day */
  streams: z.array(StreamSchema),
})

/**
 * Schema for organizing streams by week within a schedule.
 * Used for weekly calendar views and date range filtering.
 */
export const ScheduleWeekSchema = z.object({
  /** ISO date string for the start of the week (YYYY-MM-DD) */
  startDate: z.string(),
  /** ISO date string for the end of the week (YYYY-MM-DD) */
  endDate: z.string(),
  /** Array of days within this week period */
  days: z.array(ScheduleDaySchema),
  /** Flat array of all streams within this week period */
  streams: z.array(StreamSchema),
})

/**
 * Schema for complete schedule data with associated streams and participants.
 * Represents the full dataset returned when fetching a schedule with all related information.
 */
export const FullScheduleSchema = z.object({
  /** Basic schedule metadata and information */
  data: ScheduleInfoSchema,

  /** All streams belonging to this schedule */
  streams: z.array(StreamSchema),

  /** The next 3 streams belonging to this schedule */
  nextStreams: z.array(StreamSchema).max(3),

  /** Schedule data organized by day for daily calendar views */
  days: z.array(ScheduleDaySchema),

  /** Schedule data organized by week for weekly calendar views and date filtering */
  weeks: z.array(ScheduleWeekSchema),

  /** All unique participants across all streams in this schedule */
  participants: z.array(UserDisplaySchema),
})
