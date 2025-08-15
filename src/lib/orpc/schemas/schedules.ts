import {z} from "zod";

/**
 * Schedule-related schemas used across public and private oRPC procedures.
 * These schemas handle schedule information, creation, and management operations.
 */

/**
 * Schema for basic schedule information based on the schedulesTable structure.
 * Represents a single schedule event (e.g., JingleJam 2024) with metadata.
 * Used in: both public schedule display and private schedule management
 */
export const ScheduleInfoSchema = z.object({
  /** Unique identifier for the schedule */
  id: z.number().int().positive(),
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
  ownerId: z.number().int().positive(),
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
 * Schema for tables data from ScheduleEditorDO.
 * The exact structure depends on the TinyBase implementation.
 * This is a flexible schema that accepts any valid JSON structure.
 * Used in: schedule editor operations for collaborative editing
 */
export const TablesDataSchema = z.any();
