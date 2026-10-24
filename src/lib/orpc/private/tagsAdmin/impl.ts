import {implement, ORPCError} from "@orpc/server";
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {adminAuthMiddleware} from "../../middleware/authAdminMiddleware.ts";
import {adminTagsContract} from "./contract.ts";
import {streamTagsTable, tagAliases, tagCategories, tags, userTagsTable} from "../../../db/schema/tags-schema.ts";
import {and, count, desc, eq, ne, sql} from "drizzle-orm";
import type {JJDrizzleDatabase} from "../../../db/db.ts";

const os = implement(adminTagsContract)
  .use(dbMiddleware);

// === Utility Functions for Tag Category Queries ===

/**
 * Create a SQL subquery to count tags in a category
 */
const createTagCountSubquery = (db: JJDrizzleDatabase) =>
  sql<number>`COALESCE((${
          db.select({ count: count() })
                  .from(tags)
                  .where(eq(tags.categoryId, tagCategories.id))
  }), 0)`;

/**
 * Create a SQL subquery to count user tag usage for a category
 */
const createUserUsageCountSubquery = () => sql<number>`COALESCE((SELECT COUNT(*) FROM
${userTagsTable}
INNER
JOIN
${tags}
ON
${userTagsTable.tagId}
=
${tags.id}
WHERE
${tags.categoryId}
=
${tagCategories.id}
),
0
)`;

/**
 * Create a SQL subquery to count stream tag usage for a category
 */
const createStreamUsageCountSubquery = () => sql<number>`COALESCE((SELECT COUNT(*) FROM
${streamTagsTable}
INNER
JOIN
${tags}
ON
${streamTagsTable.tagId}
=
${tags.id}
WHERE
${tags.categoryId}
=
${tagCategories.id}
),
0
)`;

// === Utility Functions for Individual Tag Queries ===

/**
 * Create a SQL subquery to count user usage for an individual tag
 */
const createTagUserCountSubquery = () => sql<number>`COALESCE((SELECT COUNT(*) FROM
${userTagsTable}
WHERE
${userTagsTable.tagId}
=
${tags.id}
),
0
)`;

/**
 * Create a SQL subquery to count stream usage for an individual tag
 */
const createTagStreamCountSubquery = () => sql<number>`COALESCE((SELECT COUNT(*) FROM
${streamTagsTable}
WHERE
${streamTagsTable.tagId}
=
${tags.id}
),
0
)`;

/**
 * Create a base select object for tag categories with computed fields
 */
const createTagCategorySelect = (db: JJDrizzleDatabase) => ({
  id: tagCategories.id,
  slug: tagCategories.slug,
  name: tagCategories.name,
  description: tagCategories.description,
  color: tagCategories.color,
  icon: tagCategories.icon,
  sortOrder: tagCategories.sortOrder,
  visible: tagCategories.visible,
  createdBy: tagCategories.createdBy,
  createdAt: tagCategories.createdAt,
  updatedAt: tagCategories.updatedAt,
  tagCount: createTagCountSubquery(db),
  userUsage: createUserUsageCountSubquery(),
  streamUsage: createStreamUsageCountSubquery(),
});

// === Core Tag Management Procedures ===

/**
 * Create a new tag (admin only)
 */
const createTag = os.createTag
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;

    // Check if slug already exists
    const existingTag = await db.select()
      .from(tags)
      .where(eq(tags.slug, input.slug))
      .get();

    if (existingTag) {
      throw new ORPCError('CONFLICT', {message: 'Tag with this slug already exists'});
    }

    try {

      // Insert new tag
      return db.insert(tags)
        .values({
          name: input.name,
          slug: input.slug,
          description: input.description,
          categoryId: input.categoryId,
          color: input.color,
          visible: input.visible,
          createdBy: userId,
        })
        .returning()
        .get();

    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error creating tag:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to create tag'});
    }
  });

/**
 * Update an existing tag (admin only)
 */
const updateTag = os.updateTag
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    // Check if tag exists
    const existingTag = await db.select()
      .from(tags)
      .where(eq(tags.id, input.id))
      .get();

    if (!existingTag) {
      throw new ORPCError('NOT_FOUND', {message: 'Tag not found'});
    }

    // If updating slug, check for conflicts
    if (input.slug && input.slug !== existingTag.slug) {
      const conflictingTag = await db.select()
        .from(tags)
        .where(and(eq(tags.slug, input.slug), ne(tags.id, input.id)))
        .get();

      if (conflictingTag) {
        throw new ORPCError('CONFLICT', {message: 'Tag with this slug already exists'});
      }
    }

    try {
      // Update tag
      return db.update(tags)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(tags.id, input.id))
        .returning()
        .get();
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error updating tag:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to update tag'});
    }
  });

/**
 * Delete a tag (admin only)
 */
const deleteTag = os.deleteTag
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    // Check if tag exists
    const existingTag = await db.select()
      .from(tags)
      .where(eq(tags.id, input.id))
      .get();

    if (!existingTag) {
      throw new ORPCError('NOT_FOUND', {message: 'Tag not found'});
    }

    try {

      // Delete tag (cascades to aliases, user tags, and stream tags)
      await db.delete(tags)
        .where(eq(tags.id, input.id));

      return {success: true};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error deleting tag:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to delete tag'});
    }
  });

/**
 * Get all tags with usage and aliases for a specific category (admin only)
 */
const getTagsWithUsageAndAliasesByCategory = os.getTagsWithUsageAndAliasesByCategory
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Build where conditions - categoryId is required
      let whereConditions = [eq(tags.categoryId, input.categoryId)];

      // Filter by visibility if needed
      if (!input.includeHidden) {
        whereConditions.push(eq(tags.visible, true));
      }

      // Get tags with usage statistics
      const tagsWithUsage = await db.select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        categoryId: tags.categoryId,
        color: tags.color,
        visible: tags.visible,
        createdBy: tags.createdBy,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt,
        userCount: createTagUserCountSubquery(),
        streamCount: createTagStreamCountSubquery(),
      })
        .from(tags)
        .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
        .limit(input.limit)
        .orderBy(desc(tags.createdAt));

      // If no tags found, return empty array
      if (tagsWithUsage.length === 0) {
        return [];
      }

      // Get aliases for all tags in one query
      const tagIds = tagsWithUsage.map(tag => tag.id);
      const aliases = await db.select()
        .from(tagAliases)
        .where(sql`${tagAliases.tagId} IN (${sql.join(tagIds.map(id => sql`${id}`), sql`, `)})`)
        .orderBy(tagAliases.tagId, tagAliases.alias);

      // Group aliases by tag ID
      const aliasesByTagId = aliases.reduce((acc, alias) => {
        if (!acc[alias.tagId]) {
          acc[alias.tagId] = [];
        }
        acc[alias.tagId].push(alias);
        return acc;
      }, {} as Record<number, typeof aliases>);

      // Combine tags with their aliases
      return tagsWithUsage.map(tag => ({
        ...tag,
        aliases: aliasesByTagId[tag.id] || [],
      }));
    } catch (error) {
      console.error('Error getting tags with usage and aliases by category:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get tags with usage and aliases'});
    }
  });

// === Tag Alias Management Procedures ===

/**
 * Add an alias to a tag (admin only)
 */
const addTagAlias = os.addTagAlias
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    // Check if tag exists
    const tag = await db.select()
      .from(tags)
      .where(eq(tags.id, input.tagId))
      .get();

    if (!tag) {
      throw new ORPCError('NOT_FOUND', {message: 'Tag not found'});
    }

    // Check if alias already exists
    const existingAlias = await db.select()
      .from(tagAliases)
      .where(eq(tagAliases.alias, input.alias))
      .get();

    if (existingAlias) {
      throw new ORPCError('CONFLICT', {message: 'Alias already exists'});
    }

    try {

      // Insert new alias
      return db.insert(tagAliases)
        .values({
          tagId: input.tagId,
          alias: input.alias,
        })
        .returning()
        .get();
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error adding tag alias:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to add tag alias'});
    }
  });

/**
 * Remove a tag alias (admin only)
 */
const removeTagAlias = os.removeTagAlias
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    // Check if alias exists
    const existingAlias = await db.select()
      .from(tagAliases)
      .where(eq(tagAliases.id, input.aliasId))
      .get();

    if (!existingAlias) {
      throw new ORPCError('NOT_FOUND', {message: 'Alias not found'});
    }

    try {

      // Delete alias
      await db.delete(tagAliases)
        .where(eq(tagAliases.id, input.aliasId));

      return {success: true};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error removing tag alias:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to remove tag alias'});
    }
  });

/**
 * Get all aliases for a specific tag (admin only)
 */
const getTagAliases = os.getTagAliases
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    // Check if tag exists
    const tag = await db.select()
      .from(tags)
      .where(eq(tags.id, input.tagId))
      .get();

    if (!tag) {
      throw new ORPCError('NOT_FOUND', {message: 'Tag not found'});
    }

    try {
      // Get aliases
      return db.select()
        .from(tagAliases)
        .where(eq(tagAliases.tagId, input.tagId))
        .orderBy(tagAliases.alias);
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error getting tag aliases:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get tag aliases'});
    }
  });

// === Tag Category Management Procedures ===

/**
 * Create a new tag category (admin only)
 */
const createTagCategory = os.createTagCategory
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;

    try {
      // Check if slug already exists
      const existingCategory = await db.select()
        .from(tagCategories)
        .where(eq(tagCategories.slug, input.slug))
        .get();

      if (existingCategory) {
        throw new ORPCError('CONFLICT', {message: 'Tag category with this slug already exists'});
      }

      // Insert new tag category
      const newCategory = await db.insert(tagCategories)
        .values({
          slug: input.slug,
          name: input.name,
          description: input.description,
          color: input.color,
          icon: input.icon,
          sortOrder: input.sortOrder,
          visible: input.visible,
          createdBy: userId,
        })
        .returning()
        .get();

      return newCategory;
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error creating tag category:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to create tag category'});
    }
  });

/**
 * Update an existing tag category (admin only)
 */
const updateTagCategory = os.updateTagCategory
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Check if category exists
      const existingCategory = await db.select()
        .from(tagCategories)
        .where(eq(tagCategories.id, input.id))
        .get();

      if (!existingCategory) {
        throw new ORPCError('NOT_FOUND', {message: 'Tag category not found'});
      }

      // If updating slug, check for conflicts
      if (input.slug && input.slug !== existingCategory.slug) {
        const conflictingCategory = await db.select()
          .from(tagCategories)
          .where(and(eq(tagCategories.slug, input.slug), ne(tagCategories.id, input.id)))
          .get();

        if (conflictingCategory) {
          throw new ORPCError('CONFLICT', {message: 'Tag category with this slug already exists'});
        }
      }

      // Update category
      const updatedCategory = await db.update(tagCategories)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(tagCategories.id, input.id))
        .returning()
        .get();

      return updatedCategory;
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error updating tag category:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to update tag category'});
    }
  });

/**
 * Delete a tag category (admin only)
 */
const deleteTagCategory = os.deleteTagCategory
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Check if category exists
      const existingCategory = await db.select()
        .from(tagCategories)
        .where(eq(tagCategories.id, input.id))
        .get();

      if (!existingCategory) {
        throw new ORPCError('NOT_FOUND', {message: 'Tag category not found'});
      }

      // Delete category (sets categoryId to null for associated tags via ON DELETE SET NULL)
      await db.delete(tagCategories)
        .where(eq(tagCategories.id, input.id));

      return {success: true};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error deleting tag category:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to delete tag category'});
    }
  });

/**
 * Get all tag categories for admin management
 */
const getAllTagCategories = os.getAllTagCategories
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Build where conditions
      let whereConditions = [];

      // Filter by visibility if needed
      if (!input.includeHidden) {
        whereConditions.push(eq(tagCategories.visible, true));
      }

      let query =  db
        .select({
          id: tagCategories.id,
          slug: tagCategories.slug,
          name: tagCategories.name,
          description: tagCategories.description,
          color: tagCategories.color,
          icon: tagCategories.icon,
          sortOrder: tagCategories.sortOrder,
          visible: tagCategories.visible,
          createdBy: tagCategories.createdBy,
          createdAt: tagCategories.createdAt,
          updatedAt: tagCategories.updatedAt,
          tagCount: count(tags.id),
          userUsage: createUserUsageCountSubquery(),
          streamUsage: createStreamUsageCountSubquery(),
        })
        .from(tagCategories)
        .leftJoin(tags, eq(tags.categoryId, tagCategories.id))
        .groupBy(tagCategories.id);

      // Apply where conditions if any exist
      if (whereConditions.length > 0) {
        return query
          .orderBy(tagCategories.sortOrder, tagCategories.name)
          .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
      }

      return query
        .orderBy(tagCategories.sortOrder, tagCategories.name);
    } catch (error) {
      console.error('Error getting tag categories:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get tag categories'});
    }
  });

export const adminTagsRouter = {
  createTag,
  updateTag,
  deleteTag,
  getTagsWithUsageAndAliasesByCategory,
  addTagAlias,
  removeTagAlias,
  getTagAliases,
  createTagCategory,
  updateTagCategory,
  deleteTagCategory,
  getAllTagCategories,
}
