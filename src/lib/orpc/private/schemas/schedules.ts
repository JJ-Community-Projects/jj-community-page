import { z } from "zod";

/**
 * Schedule management schemas for private oRPC procedures.
 * These schemas handle schedule creation, validation, tag operations, and management operations in authenticated contexts.
 */

/**
 * Schema for schedule ID response format.
 * Provides consistent structure for operations that return a schedule identifier.
 * Used in: schedules contract for schedule creation operations
 */
export const ScheduleIdSchema = z.object({
  /** The unique identifier of the schedule */
  scheduleId: z.number()
});

/**
 * Schema for schedule response format.
 * Provides the full schedule object returned by creation operations.
 * Used in: schedules contract for schedule creation
 */
export const ScheduleSchema = z.object({
  /** The unique identifier of the schedule */
  id: z.number(),
  /** The schedule owner's user ID */
  ownerId: z.number(),
  /** The title of the schedule */
  title: z.string(),
  /** The year this schedule is for */
  year: z.number(),
  /** The URL slug for the schedule */
  slug: z.string(),
  /** Whether the schedule is visible to the public */
  visible: z.boolean(),
  /** Whether this is the primary schedule for the user in this year */
  primary: z.boolean(),
  /** When the schedule was created */
  createdAt: z.date(),
  /** When the schedule was last updated */
  updatedAt: z.date()
});

/**
 * Schema for schedule creation response.
 * Used in: schedules contract for create operation
 */
export const CreateScheduleResponseSchema = z.object({
  /** The created schedule object */
  schedule: ScheduleSchema
});

/**
 * Schema for schedule slug validation response.
 * Provides validation feedback and alternative suggestions for schedule slug creation.
 * Used in: schedules contract for validating schedule slug availability and format
 */
export const SlugValidationSchema = z.object({
  /** Whether the proposed slug is valid and available for use */
  isValid: z.boolean(),
  /** Array of alternative slug suggestions if the proposed one is invalid or taken */
  suggestions: z.array(z.string())
});

/**
 * Schema for tag information with usage count.
 * Used for tag-related operations that return tag data with popularity metrics.
 */
export const TagWithCountSchema = z.object({
  /** The display label for the tag */
  label: z.string(),
  /** The actual tag value */
  tag: z.string(),
  /** The number of times this tag has been used */
  count: z.number()
});

/**
 * Schema for popular tags response.
 * Returns popular tags along with default and charity tag options.
 * Used in: schedules contract for getPopularTags operation
 */
export const PopularTagsResponseSchema = z.object({
  /** Popular tags from the database with usage counts */
  tags: z.array(TagWithCountSchema),
  /** Default fallback tags when not enough popular tags exist */
  defaultTags: z.array(TagWithCountSchema),
  /** Charity-related tags available for use */
  charityTags: z.array(TagWithCountSchema)
});

/**
 * Schema for suggested tags response.
 * Returns suggested tags for a stream along with default and charity tag options.
 * Used in: schedules contract for getSuggestedTagsForStream and getSuggestedTagsForStreamBySearchTerm operations
 */
export const SuggestedTagsResponseSchema = z.object({
  /** Suggested tags from the database based on popularity/search */
  tags: z.array(TagWithCountSchema),
  /** Default tags that match criteria and aren't already used */
  defaultTags: z.array(TagWithCountSchema),
  /** Charity tags that match criteria and aren't already used */
  charityTags: z.array(TagWithCountSchema)
});

/**
 * Schema for tables data from ScheduleEditorDO.
 * The exact structure depends on the TinyBase implementation.
 * This is a flexible schema that accepts any valid JSON structure.
 * Used in: schedules contract for getTables operation
 */
export const TablesDataSchema = z.any();

/**
 * Schema for schedule list response.
 * Used for operations that return multiple schedules.
 * Used in: schedules contract for getSchedulesByTiltifyUsername operation
 */
export const SchedulesListSchema = z.array(ScheduleSchema);

/**
 * Schema for next schedule response.
 * Returns the next upcoming schedule for a user.
 * The repository returns ScheduleWithStreams which includes additional stream data.
 * Used in: schedules contract for getNextScheduleByTiltifyUsername operation
 */
export const NextScheduleResponseSchema = z.object({
  /** The next schedule with streams, or null if none found */
  nextSchedule: z.any().nullable()
});

/**
 * Schema for success message responses.
 * Used for operations that return a success message.
 * Used in: schedules contract for operations that return success messages
 */
export const SuccessMessageSchema = z.object({
  /** Success message describing the completed operation */
  message: z.string()
});
