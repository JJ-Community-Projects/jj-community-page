import {oc} from '@orpc/contract'
import z from "zod/v4";
import {PaginationLimitSchema, SuccessSchema} from "../schemas/common.ts";

/**
 * Private tag contracts for authenticated users in the new admin-controlled tag system
 * These procedures allow users to manage their tag associations with admin-created tags
 * Users can only select from tags created by administrators
 */

// Input validation schemas
const TagIdSchema = z.number().int().positive();
const UserIdSchema = z.number().int().positive();

const AddUserTagInputSchema = z.object({
  tagId: TagIdSchema,
});

const RemoveUserTagInputSchema = z.object({
  tagId: TagIdSchema,
});

const FindUsersByTagInputSchema = z.object({
  tagId: TagIdSchema,
  limit: PaginationLimitSchema(1, 50, 10),
});

const BulkUpdateUserTagsInputSchema = z.object({
  addTagIds: z.array(TagIdSchema).max(20).default([]),
  removeTagIds: z.array(TagIdSchema).max(20).default([]),
});

const GetTagRecommendationsInputSchema = z.object({
  limit: PaginationLimitSchema(1, 20, 5),
  excludeExistingTags: z.boolean().default(true),
  categoryId: z.number().int().positive().optional(),
});

// Output schemas
const PublicTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  categoryId: z.number().nullable(),
  color: z.string(),
});

const UserTagSchema = z.object({
  userId: z.number(),
  tagId: z.number(),
  addedAt: z.date(),
  tag: PublicTagSchema,
});

const TagWithUsageSchema = PublicTagSchema.extend({
  userCount: z.number(),
  streamCount: z.number(),
  totalUsage: z.number(),
});

const TagWithUsageAndCategorySchema = TagWithUsageSchema.extend({
  category: z.object({
    id: z.number(),
    slug: z.string(),
    name: z.string(),
  }).nullable(),
});

const PopularTagsResponseSchema = z.object({
  tags: z.array(TagWithUsageSchema),
  totalTags: z.number(),
  timeRange: z.string(),
  lastUpdated: z.date(),
});

const TagRecommendationSchema = z.object({
  tag: PublicTagSchema,
  score: z.number().min(0).max(1),
  reason: z.enum(['similar_users', 'popular', 'category_match', 'trending']),
  userCount: z.number(),
});

const BulkUpdateResultSchema = z.object({
  added: z.array(UserTagSchema),
  removed: z.array(z.object({
    tagId: z.number(),
    success: z.boolean(),
  })),
  errors: z.array(z.object({
    tagId: z.number(),
    error: z.string(),
  })),
});

const UserDisplaySchema = z.object({
  userId: z.number(),
  username: z.string(),
  profileImage: z.string().nullable(),
  tags: z.array(PublicTagSchema),
  tagCount: z.number(),
});

// === User Tag Management Contracts ===

/**
 * Add an admin-created tag to the current user's profile
 * Users can only add tags that exist in the admin-managed tags table
 */
const addUserTagContract = oc
  .input(AddUserTagInputSchema)
  .output(UserTagSchema);

/**
 * Remove a tag from the current user's profile
 * Removes the association between user and admin-created tag
 */
const removeUserTagContract = oc
  .input(RemoveUserTagInputSchema)
  .output(SuccessSchema);

/**
 * Get all tags for the authenticated user
 * Returns user's tag associations with full admin-created tag information
 */
const getUserTagsContract = oc
  .input(z.object({}))
  .output(z.array(UserTagSchema));


// === Tag Discovery Contracts ===

/**
 * List all available admin-created tags with usage statistics
 * Shows only visible tags that users can select from
 */
const listAvailableTagsContract = oc
  .input(z.object({
    categoryId: z.number().int().positive().optional(),
    limit: PaginationLimitSchema(1, 100, 50),
  }))
  .output(z.array(TagWithUsageSchema));

/**
 * Find users who have a specific admin-created tag
 * Discovers users with similar interests based on shared tags
 */
const findUsersByTagContract = oc
  .input(FindUsersByTagInputSchema)
  .output(z.array(UserDisplaySchema));

/**
 * Get popular admin-created tags across the platform
 * Returns most commonly used tags with usage statistics
 */
const getPopularTagsContract = oc
  .input(z.object({
    limit: PaginationLimitSchema(1, 50, 10),
    categoryId: z.number().int().positive().optional(),
    timeRange: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
  }))
  .output(PopularTagsResponseSchema);

/**
 * Search admin-created tags by name or alias
 * Provides fuzzy search with alias resolution for tag discovery
 */
const searchTagsContract = oc
  .input(z.object({
    query: z.string().min(1).max(100),
    limit: PaginationLimitSchema(1, 50, 10),
    categoryId: z.number().int().positive().optional(),
  }))
  .output(z.array(TagWithUsageSchema));

/**
 * Enhanced search for admin-created tags including category names
 * Searches in tag names, slugs, descriptions, AND category names
 * Supports filtering by multiple category IDs
 * Returns tags with category information when available
 */
const fullTagsSearchContract = oc
  .input(z.object({
    query: z.string().min(1).max(100),
    limit: PaginationLimitSchema(1, 50, 10),
    categoryIds: z.array(z.number().int().positive()).max(10).default([]),
  }))
  .output(z.array(TagWithUsageAndCategorySchema));

/**
 * Get available tag categories for browsing
 * Returns category list with metadata for filtered tag discovery
 */
const getTagCategoriesContract = oc
  .input(z.object({
    includeEmpty: z.boolean().default(false),
  }))
  .output(z.array(z.object({
    id: z.number(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    color: z.string(),
    icon: z.string().nullable(),
    sortOrder: z.number(),
    visible: z.boolean(),
    tagCount: z.number(),
    usageCount: z.number(),
  })));

export const privateTagsContract = {
  // User tag management
  addUserTag: addUserTagContract,
  removeUserTag: removeUserTagContract,
  getUserTags: getUserTagsContract,

  // Tag discovery
  listAvailableTags: listAvailableTagsContract,
  findUsersByTag: findUsersByTagContract,
  getPopularTags: getPopularTagsContract,
  searchTags: searchTagsContract,
  fullTagsSearch: fullTagsSearchContract,
  getTagCategories: getTagCategoriesContract,
}
