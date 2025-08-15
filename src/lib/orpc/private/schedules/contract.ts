import {oc} from '@orpc/contract';
import {z} from 'zod';
import {
  CreateScheduleResponseSchema,
  NextScheduleResponseSchema,
  ScheduleSchema,
  SchedulesListSchema,
  SlugValidationSchema,
  SuccessMessageSchema,
  TablesDataSchema
} from "../schemas/schedules.ts";
import {PopularTagsResponseSchema, SuggestedTagsResponseSchema} from "../../schemas/tags.ts";

/**
 * Private schedules contracts for authenticated schedule management operations.
 * These endpoints handle schedule CRUD, visibility management, tag operations, and query operations.
 */

/**
 * Schedule CRUD Operations
 */

/**
 * Create a new schedule
 * Input: none (creates for current year automatically)
 * Output: schedule object
 */
const createContract = oc
  .input(z.void())
  .output(CreateScheduleResponseSchema);

/**
 * Save schedule data to database
 * Input: schedule ID
 * Output: success message
 */
const saveContract = oc
  .input(z.number().positive("Schedule ID must be positive"))
  .output(SuccessMessageSchema);

/**
 * Delete a schedule
 * Input: schedule ID
 * Output: success message
 */
const deleteContract = oc
  .input(z.number().positive("Schedule ID must be positive"))
  .output(SuccessMessageSchema);

/**
 * Schedule Management Operations
 */

/**
 * Toggle schedule visibility
 * Input: schedule ID
 * Output: success message
 */
const toggleVisibilityContract = oc
  .input(z.object({
    scheduleId: z.number().positive("Schedule ID must be positive")
  }))
  .output(SuccessMessageSchema);

/**
 * Set schedule as primary
 * Input: schedule ID
 * Output: success message
 */
const setPrimaryContract = oc
  .input(z.object({
    scheduleId: z.number().positive("Schedule ID must be positive")
  }))
  .output(SuccessMessageSchema);

/**
 * Schedule Validation Operations
 */

/**
 * Validate slug availability
 * Input: schedule ID, slug, and optional title for suggestions
 * Output: validation result with suggestions
 */
const validateSlugContract = oc
  .input(z.object({
    id: z.number().positive("Schedule ID must be positive"),
    slug: z.string().min(1, "Slug is required"),
    title: z.string().optional()
  }))
  .output(SlugValidationSchema);

/**
 * Schedule Tag Operations
 */

/**
 * Get popular tags across all schedules
 * Input: limit (default 5)
 * Output: popular tags with default and charity tag options
 */
const getPopularTagsContract = oc
  .input(z.number().positive("Limit must be positive").default(5))
  .output(PopularTagsResponseSchema);

/**
 * Get suggested tags for a specific stream
 * Input: stream ID, schedule ID, and limit
 * Output: suggested tags not already used in the stream
 */
const getSuggestedTagsForStreamContract = oc
  .input(z.object({
    streamId: z.number().positive("Stream ID must be positive"),
    scheduleId: z.number().positive("Schedule ID must be positive"),
    limit: z.number().positive("Limit must be positive").default(5)
  }))
  .output(SuggestedTagsResponseSchema);

/**
 * Get suggested tags for a stream matching search term
 * Input: stream ID, schedule ID, search term, and limit
 * Output: suggested tags matching search term not already used in the stream
 */
const getSuggestedTagsForStreamBySearchTermContract = oc
  .input(z.object({
    streamId: z.number().positive("Stream ID must be positive"),
    scheduleId: z.number().positive("Schedule ID must be positive"),
    term: z.string().min(1, "Search term is required"),
    limit: z.number().positive("Limit must be positive").default(5)
  }))
  .output(SuggestedTagsResponseSchema);

/**
 * Schedule Data Operations
 */

/**
 * Get tables data from ScheduleEditorDO
 * Input: schedule ID
 * Output: tables data from TinyBase
 */
const getTablesContract = oc
  .input(z.number().positive("Schedule ID must be positive"))
  .output(TablesDataSchema);

/**
 * Schedule Query Operations
 */

/**
 * Get all schedules by Tiltify username
 * Input: Tiltify username
 * Output: array of schedules owned by the user
 */
const getSchedulesByTiltifyUsernameContract = oc
  .input(z.string().min(1, "Tiltify username is required"))
  .output(SchedulesListSchema);

/**
 * Get next schedule by Tiltify username
 * Input: Tiltify username
 * Output: next upcoming schedule for the user
 */
const getNextScheduleByTiltifyUsernameContract = oc
  .input(z.string().min(1, "Tiltify username is required"))
  .output(NextScheduleResponseSchema);

/**
 * Get all schedules for the authenticated user
 * Uses authMiddleware to access user ID from context
 */
const getSchedulesContract = oc
  .output(ScheduleSchema.array())

export const privateSchedulesContract = {
  // Schedule CRUD Operations
  create: createContract,
  save: saveContract,
  delete: deleteContract,

  // Schedule Management Operations
  toggleVisibility: toggleVisibilityContract,
  setPrimary: setPrimaryContract,

  // Schedule Validation Operations
  validateSlug: validateSlugContract,

  // Schedule Tag Operations
  getPopularTags: getPopularTagsContract,
  getSuggestedTagsForStream: getSuggestedTagsForStreamContract,
  getSuggestedTagsForStreamBySearchTerm: getSuggestedTagsForStreamBySearchTermContract,

  // Schedule Query Operations
  getSchedulesByTiltifyUsername: getSchedulesByTiltifyUsernameContract,
  getNextScheduleByTiltifyUsername: getNextScheduleByTiltifyUsernameContract,
  getSchedules: getSchedulesContract
};
