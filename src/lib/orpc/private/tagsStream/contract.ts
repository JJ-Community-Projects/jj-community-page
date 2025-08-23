import {oc} from '@orpc/contract';
import {z} from "zod/v4";
import {PaginationLimitSchema, SuccessSchema} from "../schemas/common.ts";

/**
 * Private stream tags contracts for authenticated stream tag management operations.
 * These endpoints handle stream tag assignment, removal, and discovery operations
 * for the new admin-controlled tag system.
 */

/**
 * Add an admin-created tag to a stream
 * Input: stream ID, schedule ID, and tag ID
 * Output: stream tag relationship with full tag information
 */
const addStreamTagContract = oc
  .input(z.object({
    streamId: z.number().positive("Stream ID must be positive"),
    scheduleId: z.number().positive("Schedule ID must be positive"),
    tagId: z.number().positive("Tag ID must be positive")
  }))
  .output(z.object({
    scheduleId: z.number(),
    streamId: z.number(),
    tagId: z.number(),
    addedAt: z.date(),
    tag: z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      description: z.string().nullable(),
      categoryId: z.number().nullable(),
      color: z.string(),
    })
  }));

/**
 * Remove a tag from a stream
 * Input: stream ID, schedule ID, and tag ID
 * Output: success confirmation
 */
const removeStreamTagContract = oc
  .input(z.object({
    streamId: z.number().positive("Stream ID must be positive"),
    scheduleId: z.number().positive("Schedule ID must be positive"),
    tagId: z.number().positive("Tag ID must be positive")
  }))
  .output(SuccessSchema);

/**
 * Get all tags for a specific stream
 * Input: stream ID and schedule ID
 * Output: array of stream tags with full tag information
 */
const getStreamTagsContract = oc
  .input(z.object({
    streamId: z.number().positive("Stream ID must be positive"),
    scheduleId: z.number().positive("Schedule ID must be positive")
  }))
  .output(z.array(z.object({
    scheduleId: z.number(),
    streamId: z.number(),
    tagId: z.number(),
    addedAt: z.date(),
    tag: z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      description: z.string().nullable(),
      categoryId: z.number().nullable(),
      color: z.string(),
    })
  })));

/**
 * Find popular stream tags across all streams in schedule
 * Input: schedule ID and optional limit
 * Output: popular stream tags with usage statistics
 */
const getPopularStreamTagsContract = oc
  .input(z.object({
    scheduleId: z.number().positive("Schedule ID must be positive").optional(),
    limit: z.number().positive("Limit must be positive").default(10),
    timeRange: z.enum(['7d', '30d', '90d', 'all']).default('all')
  }))
  .output(z.object({
    tags: z.array(z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      description: z.string().nullable(),
      categoryId: z.number().nullable(),
      color: z.string(),
      streamCount: z.number(),
      totalUsage: z.number(),
    })),
    totalTags: z.number(),
    scheduleId: z.number().optional(),
  }));

/**
 * Search available admin-created tags for stream assignment
 * Input: search query, optional filters, and pagination
 * Output: array of tags with usage statistics that can be assigned to streams
 */
const searchStreamTagsContract = oc
  .input(z.object({
    query: z.string().min(1).max(100),
    categoryId: z.number().int().positive().optional(),
    scheduleId: z.number().positive("Schedule ID must be positive").optional(),
    excludeAssigned: z.boolean().default(false),
    streamId: z.number().positive("Stream ID must be positive").optional(),
    limit: PaginationLimitSchema(1, 50, 10),
  }))
  .output(z.array(z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    categoryId: z.number().nullable(),
    color: z.string(),
    userCount: z.number(),
    streamCount: z.number(),
    totalUsage: z.number(),
    isAssignedToStream: z.boolean().optional(),
  })));

export const streamTagsContract = {
  // Stream Tag Management Operations
  addStreamTag: addStreamTagContract,
  removeStreamTag: removeStreamTagContract,
  getStreamTags: getStreamTagsContract,
  getPopularStreamTags: getPopularStreamTagsContract,

  // Stream Tag Discovery Operations
  searchStreamTags: searchStreamTagsContract
};
