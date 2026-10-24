import {oc} from '@orpc/contract'
import z from "zod/v4";
import {PaginationLimitSchema, SuccessSchema} from "../schemas/common.ts";

/**
 * Admin-only oRPC contracts for centralized tag management
 * These procedures require admin authentication and are used for:
 * - Creating, updating, and deleting tags
 * - Managing tag aliases and tag categories
 */

// Input validation schemas
const TagIdSchema = z.number().int().positive();

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

const TagWithUsageAndAliasesOutputSchema = TagOutputSchema.extend({
  userCount: z.number(),
  streamCount: z.number(),
  aliases: z.array(TagAliasOutputSchema),
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
  userUsage: z.number(),
  streamUsage: z.number(),
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
 * Get all tags with usage and aliases for a specific category (admin only)
 * Returns tags with usage statistics and all their aliases for the given category
 */
export const getTagsWithUsageAndAliasesByCategoryContract = oc
  .input(z.object({
    categoryId: z.number().int().positive(),
    includeHidden: z.boolean().default(true),
    limit: PaginationLimitSchema(1, 100, 50),
  }))
  .output(z.array(TagWithUsageAndAliasesOutputSchema));

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

export const getAllTagCategoriesContract = oc
  .input(z.object({
    includeHidden: z.boolean().default(true),
    includeUsage: z.boolean().default(true),
  }))
  .output(z.array(TagCategoryWithUsageOutputSchema));

/**
 * Export all admin tag management contracts
 */
export const adminTagsContract = {
  // Core tag management
  createTag: createTagContract,
  updateTag: updateTagContract,
  deleteTag: deleteTagContract,
  getTagsWithUsageAndAliasesByCategory: getTagsWithUsageAndAliasesByCategoryContract,

  // Alias management
  addTagAlias: addTagAliasContract,
  removeTagAlias: removeTagAliasContract,
  getTagAliases: getTagAliasesContract,

  // Tag category management
  createTagCategory: createTagCategoryContract,
  updateTagCategory: updateTagCategoryContract,
  deleteTagCategory: deleteTagCategoryContract,
  getAllTagCategories: getAllTagCategoriesContract,
};
