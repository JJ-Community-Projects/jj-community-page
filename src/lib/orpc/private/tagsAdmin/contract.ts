import {oc} from '@orpc/contract'
import z from "zod/v4";
import {PaginationLimitSchema, SuccessSchema} from "../schemas/common.ts";

/**
 * Admin-only oRPC contracts for centralized tag management
 * These procedures require admin authentication and are used for:
 * - Creating, updating, and deleting tags
 * - Managing tag aliases
 * - Assigning/removing tags from users and streams
 */

// Input validation schemas
const TagIdSchema = z.number().int().positive();
const UserIdSchema = z.number().int().positive();
const StreamIdentifierSchema = z.object({
  scheduleId: z.number().int().positive(),
  streamId: z.number().int().positive(),
});

const CreateTagInputSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional(),
  categoryId: z.number().int().positive().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color").default('#3584BF'),
  visible: z.boolean().default(true),
});

const UpdateTagInputSchema = z.object({
  id: TagIdSchema,
  name: z.string().min(1).max(50).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  categoryId: z.number().int().positive().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  visible: z.boolean().optional(),
});

const DeleteTagInputSchema = z.object({
  id: TagIdSchema,
});

const AddTagAliasInputSchema = z.object({
  tagId: TagIdSchema,
  alias: z.string().min(1).max(50),
});

const RemoveTagAliasInputSchema = z.object({
  aliasId: z.number().int().positive(),
});

const AssignUserTagInputSchema = z.object({
  userId: UserIdSchema,
  tagId: TagIdSchema,
});

const RemoveUserTagInputSchema = z.object({
  userId: UserIdSchema,
  tagId: TagIdSchema,
});

const AssignStreamTagInputSchema = z.object({
  scheduleId: z.number().int().positive(),
  streamId: z.number().int().positive(),
  tagId: TagIdSchema,
});

const RemoveStreamTagInputSchema = z.object({
  scheduleId: z.number().int().positive(),
  streamId: z.number().int().positive(),
  tagId: TagIdSchema,
});

// Tag category input schemas
const CategoryIdSchema = z.number().int().positive();

const CreateTagCategoryInputSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color").default('#6B7280'),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  visible: z.boolean().default(true),
});

const UpdateTagCategoryInputSchema = z.object({
  id: CategoryIdSchema,
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  visible: z.boolean().optional(),
});

const DeleteTagCategoryInputSchema = z.object({
  id: CategoryIdSchema,
});

// Output schemas
const TagOutputSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  categoryId: z.number().nullable(),
  color: z.string(),
  visible: z.boolean(),
  createdBy: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const TagAliasOutputSchema = z.object({
  id: z.number(),
  tagId: z.number(),
  alias: z.string(),
  createdAt: z.date(),
});

const TagWithAliasesOutputSchema = TagOutputSchema.extend({
  aliases: z.array(TagAliasOutputSchema),
});

const TagWithUsageOutputSchema = TagOutputSchema.extend({
  userCount: z.number(),
  streamCount: z.number(),
  totalUsage: z.number(),
});

const UserTagOutputSchema = z.object({
  userId: z.number(),
  tagId: z.number(),
  addedAt: z.date(),
  tag: TagOutputSchema,
});

const StreamTagOutputSchema = z.object({
  scheduleId: z.number(),
  streamId: z.number(),
  tagId: z.number(),
  addedAt: z.date(),
  tag: TagOutputSchema,
});

// Tag category output schemas
const TagCategoryOutputSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string(),
  icon: z.string().nullable(),
  sortOrder: z.number(),
  visible: z.boolean(),
  createdBy: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const TagCategoryWithUsageOutputSchema = TagCategoryOutputSchema.extend({
  tagCount: z.number(),
  usageCount: z.number(),
});

// === Core Tag Management Contracts ===

/**
 * Create a new tag (admin only)
 * Creates a new centralized tag that users can then select from
 */
export const createTagContract = oc
  .input(CreateTagInputSchema)
  .output(TagOutputSchema);

/**
 * Update an existing tag (admin only)
 * Allows partial updates to tag properties
 */
export const updateTagContract = oc
  .input(UpdateTagInputSchema)
  .output(TagOutputSchema);

/**
 * Delete a tag (admin only)
 * Cascades to remove all user and stream associations
 */
export const deleteTagContract = oc
  .input(DeleteTagInputSchema)
  .output(SuccessSchema);

/**
 * Get all tags for admin management
 * Returns all tags including hidden ones with usage statistics
 */
export const getAdminTagsContract = oc
  .input(z.object({
    includeHidden: z.boolean().default(true),
    includeUsage: z.boolean().default(true),
    categoryId: z.number().int().positive().optional(),
    limit: PaginationLimitSchema(1, 100, 50),
  }))
  .output(z.array(TagWithUsageOutputSchema));

/**
 * Get a single tag with all its aliases (admin only)
 */
export const getTagWithAliasesContract = oc
  .input(z.object({ id: TagIdSchema }))
  .output(TagWithAliasesOutputSchema);

// === Tag Alias Management Contracts ===

/**
 * Add an alias to a tag (admin only)
 * Allows alternative names for improved searchability
 */
export const addTagAliasContract = oc
  .input(AddTagAliasInputSchema)
  .output(TagAliasOutputSchema);

/**
 * Remove a tag alias (admin only)
 */
export const removeTagAliasContract = oc
  .input(RemoveTagAliasInputSchema)
  .output(SuccessSchema);

/**
 * Get all aliases for a specific tag (admin only)
 */
export const getTagAliasesContract = oc
  .input(z.object({ tagId: TagIdSchema }))
  .output(z.array(TagAliasOutputSchema));

// === User Tag Assignment Contracts ===

/**
 * Assign a tag to a user (admin only)
 * Allows admins to manage user tags directly
 */
export const assignUserTagContract = oc
  .input(AssignUserTagInputSchema)
  .output(UserTagOutputSchema);

/**
 * Remove a tag from a user (admin only)
 */
export const removeUserTagContract = oc
  .input(RemoveUserTagInputSchema)
  .output(SuccessSchema);

/**
 * Get all tags for a specific user (admin view)
 * Returns detailed tag information including metadata
 */
export const getUserTagsAdminContract = oc
  .input(z.object({
    userId: UserIdSchema,
    includeHidden: z.boolean().default(false),
  }))
  .output(z.array(UserTagOutputSchema));

/**
 * Bulk assign multiple tags to a user (admin only)
 */
export const bulkAssignUserTagsContract = oc
  .input(z.object({
    userId: UserIdSchema,
    tagIds: z.array(TagIdSchema).min(1).max(20),
  }))
  .output(z.array(UserTagOutputSchema));

/**
 * Bulk remove multiple tags from a user (admin only)
 */
export const bulkRemoveUserTagsContract = oc
  .input(z.object({
    userId: UserIdSchema,
    tagIds: z.array(TagIdSchema).min(1).max(20),
  }))
  .output(SuccessSchema);

// === Stream Tag Assignment Contracts ===

/**
 * Assign a tag to a stream (admin only)
 */
export const assignStreamTagContract = oc
  .input(AssignStreamTagInputSchema)
  .output(StreamTagOutputSchema);

/**
 * Remove a tag from a stream (admin only)
 */
export const removeStreamTagContract = oc
  .input(RemoveStreamTagInputSchema)
  .output(SuccessSchema);

/**
 * Get all tags for a specific stream (admin view)
 */
export const getStreamTagsAdminContract = oc
  .input(StreamIdentifierSchema)
  .output(z.array(StreamTagOutputSchema));

/**
 * Bulk assign multiple tags to a stream (admin only)
 */
export const bulkAssignStreamTagsContract = oc
  .input(z.object({
    scheduleId: z.number().int().positive(),
    streamId: z.number().int().positive(),
    tagIds: z.array(TagIdSchema).min(1).max(20),
  }))
  .output(z.array(StreamTagOutputSchema));

/**
 * Bulk remove multiple tags from a stream (admin only)
 */
export const bulkRemoveStreamTagsContract = oc
  .input(z.object({
    scheduleId: z.number().int().positive(),
    streamId: z.number().int().positive(),
    tagIds: z.array(TagIdSchema).min(1).max(20),
  }))
  .output(SuccessSchema);

// === Tag Category Management Contracts ===

/**
 * Create a new tag category (admin only)
 * Creates a new category for organizing tags
 */
export const createTagCategoryContract = oc
  .input(CreateTagCategoryInputSchema)
  .output(TagCategoryOutputSchema);

/**
 * Update an existing tag category (admin only)
 * Allows partial updates to tag category properties
 */
export const updateTagCategoryContract = oc
  .input(UpdateTagCategoryInputSchema)
  .output(TagCategoryOutputSchema);

/**
 * Delete a tag category (admin only)
 * Sets categoryId to null for all associated tags
 */
export const deleteTagCategoryContract = oc
  .input(DeleteTagCategoryInputSchema)
  .output(SuccessSchema);

/**
 * Get all tag categories for admin management
 * Returns all categories including hidden ones with usage statistics
 */
export const getTagCategoriesContract = oc
  .input(z.object({
    includeHidden: z.boolean().default(true),
    includeUsage: z.boolean().default(true),
    limit: PaginationLimitSchema(1, 100, 50),
  }))
  .output(z.array(TagCategoryWithUsageOutputSchema));

/**
 * Get a single tag category by ID (admin only)
 */
export const getTagCategoryContract = oc
  .input(z.object({ id: CategoryIdSchema }))
  .output(TagCategoryOutputSchema);

// === Tag Validation Contracts ===

/**
 * Check if a tag slug is available (admin only)
 * Used for validation during tag creation
 */
export const checkTagSlugAvailabilityContract = oc
  .input(z.object({
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
    excludeId: z.number().int().positive().optional(),
  }))
  .output(z.object({
    available: z.boolean(),
    slug: z.string(),
    suggestion: z.string().optional(),
  }));

/**
 * Validate tag alias uniqueness (admin only)
 * Checks if an alias is already in use
 */
export const checkAliasAvailabilityContract = oc
  .input(z.object({
    alias: z.string().min(1).max(50),
    excludeTagId: z.number().int().positive().optional(),
  }))
  .output(z.object({
    available: z.boolean(),
    alias: z.string(),
    existingTag: TagOutputSchema.optional(),
  }));


/**
 * Export all admin tag management contracts
 */
export const adminTagsContract = {
  // Core tag management
  createTag: createTagContract,
  updateTag: updateTagContract,
  deleteTag: deleteTagContract,
  getAdminTags: getAdminTagsContract,
  getTagWithAliases: getTagWithAliasesContract,

  // Alias management
  addTagAlias: addTagAliasContract,
  removeTagAlias: removeTagAliasContract,
  getTagAliases: getTagAliasesContract,

  // User tag assignment
  assignUserTag: assignUserTagContract,
  removeUserTag: removeUserTagContract,
  getUserTagsAdmin: getUserTagsAdminContract,
  bulkAssignUserTags: bulkAssignUserTagsContract,
  bulkRemoveUserTags: bulkRemoveUserTagsContract,

  // Stream tag assignment
  assignStreamTag: assignStreamTagContract,
  removeStreamTag: removeStreamTagContract,
  getStreamTagsAdmin: getStreamTagsAdminContract,
  bulkAssignStreamTags: bulkAssignStreamTagsContract,
  bulkRemoveStreamTags: bulkRemoveStreamTagsContract,

  // Tag category management
  createTagCategory: createTagCategoryContract,
  updateTagCategory: updateTagCategoryContract,
  deleteTagCategory: deleteTagCategoryContract,
  getTagCategories: getTagCategoriesContract,
  getTagCategory: getTagCategoryContract,

  // Tag validation
  checkTagSlugAvailability: checkTagSlugAvailabilityContract,
  checkAliasAvailability: checkAliasAvailabilityContract,
};
