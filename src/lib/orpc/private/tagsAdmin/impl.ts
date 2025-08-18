import {implement, ORPCError} from "@orpc/server";
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {adminAuthMiddleware} from "../../middleware/authAdminMiddleware.ts";
import {adminTagsContract} from "./contract.ts";
import {streamTagsTable, tagAliases, tagCategories, tags, userTagsTable} from "../../../db/schema/tags-schema.ts";
import {and, desc, eq, ne, sql} from "drizzle-orm";

const os = implement(adminTagsContract)
  .use(dbMiddleware);

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
 * Get all tags for admin management
 */
const getAdminTags = os.getAdminTags
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Build where conditions
      let whereConditions = [];

      // Filter by visibility if needed
      if (!input.includeHidden) {
        whereConditions.push(eq(tags.visible, true));
      }

      // Filter by category if provided
      if (input.categoryId) {
        whereConditions.push(eq(tags.categoryId, input.categoryId));
      }

      let query = db.select({
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
        userCount: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${userTagsTable}
        WHERE
        ${userTagsTable.tagId}
        =
        ${tags.id}
        ),
        0
        )`,
        streamCount: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${streamTagsTable}
        WHERE
        ${streamTagsTable.tagId}
        =
        ${tags.id}
        ),
        0
        )`,
        totalUsage: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${userTagsTable}
        WHERE
        ${userTagsTable.tagId}
        =
        ${tags.id}
        ),
        0
        )
        +
        COALESCE
        (
        (
        SELECT
        COUNT
        (
        *
        )
        FROM
        ${streamTagsTable}
        WHERE
        ${streamTagsTable.tagId}
        =
        ${tags.id}
        ),
        0
        )`,
      })
        .from(tags);

      // Apply where conditions if any exist
      if (whereConditions.length > 0) {
        return query
          .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
          .limit(input.limit)
          .orderBy(desc(tags.createdAt));
      }

      return query
        .limit(input.limit)
        .orderBy(desc(tags.createdAt));
    } catch (error) {
      console.error('Error getting admin tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get tags'});
    }
  });

/**
 * Get a single tag with all its aliases (admin only)
 */
const getTagWithAliases = os.getTagWithAliases
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    // Get tag
    const tag = await db.select()
      .from(tags)
      .where(eq(tags.id, input.id))
      .get();

    if (!tag) {
      throw new ORPCError('NOT_FOUND', {message: 'Tag not found'});
    }

    try {
      // Get aliases
      const aliases = await db.select()
        .from(tagAliases)
        .where(eq(tagAliases.tagId, input.id))
        .orderBy(tagAliases.alias);

      return {
        ...tag,
        aliases,
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error getting tag with aliases:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get tag'});
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

// === User Tag Assignment Procedures ===

/**
 * Assign a tag to a user (admin only)
 */
const assignUserTag = os.assignUserTag
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

    // Check if user-tag relationship already exists
    const existingUserTag = await db.select()
      .from(userTagsTable)
      .where(and(eq(userTagsTable.userId, input.userId), eq(userTagsTable.tagId, input.tagId)))
      .get();

    if (existingUserTag) {
      throw new ORPCError('CONFLICT', {message: 'User already has this tag'});
    }

    try {
      // Insert new user tag
      const newUserTag = await db.insert(userTagsTable)
        .values({
          userId: input.userId,
          tagId: input.tagId,
        })
        .returning()
        .get();

      // Return with tag information
      return {
        ...newUserTag,
        tag: tag,
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error assigning user tag:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to assign user tag'});
    }
  });

/**
 * Remove a tag from a user (admin only)
 */
const removeUserTag = os.removeUserTag
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    // Check if user-tag relationship exists
    const existingUserTag = await db.select()
      .from(userTagsTable)
      .where(and(eq(userTagsTable.userId, input.userId), eq(userTagsTable.tagId, input.tagId)))
      .get();

    if (!existingUserTag) {
      throw new ORPCError('NOT_FOUND', {message: 'User does not have this tag'});
    }

    try {
      // Delete user tag
      await db.delete(userTagsTable)
        .where(and(eq(userTagsTable.userId, input.userId), eq(userTagsTable.tagId, input.tagId)));

      return {success: true};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error removing user tag:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to remove user tag'});
    }
  });

/**
 * Get all tags for a specific user (admin view)
 */
const getUserTagsAdmin = os.getUserTagsAdmin
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Build where conditions
      let whereConditions = [eq(userTagsTable.userId, input.userId)];

      // Filter out hidden tags if not including them
      if (!input.includeHidden) {
        whereConditions.push(eq(tags.visible, true));
      }

      return db.select({
        userId: userTagsTable.userId,
        tagId: userTagsTable.tagId,
        addedAt: userTagsTable.addedAt,
        tag: {
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
        },
      })
        .from(userTagsTable)
        .innerJoin(tags, eq(userTagsTable.tagId, tags.id))
        .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
        .orderBy(userTagsTable.addedAt);
    } catch (error) {
      console.error('Error getting user tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get user tags'});
    }
  });

/**
 * Bulk assign multiple tags to a user (admin only)
 */
const bulkAssignUserTags = os.bulkAssignUserTags
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    // Check if all tags exist
    const existingTags = await db.select()
      .from(tags)
      .where(sql`${tags.id}
      IN (
      ${sql.join(input.tagIds.map(id => sql`${id}`), sql`, `)}
      )`)
      .all();

    if (existingTags.length !== input.tagIds.length) {
      throw new ORPCError('NOT_FOUND', {message: 'One or more tags not found'});
    }

    try {

      // Check for existing user-tag relationships
      const existingUserTags = await db.select()
        .from(userTagsTable)
        .where(and(
          eq(userTagsTable.userId, input.userId),
          sql`${userTagsTable.tagId}
          IN (
          ${sql.join(input.tagIds.map(id => sql`${id}`), sql`, `)}
          )`
        ))
        .all();

      // Filter out already assigned tags
      const alreadyAssignedTagIds = existingUserTags.map(ut => ut.tagId);
      const newTagIds = input.tagIds.filter(tagId => !alreadyAssignedTagIds.includes(tagId));

      if (newTagIds.length === 0) {
        throw new ORPCError('CONFLICT', {message: 'All tags are already assigned to this user'});
      }

      // Insert new user tags
      const newUserTags = await db.insert(userTagsTable)
        .values(newTagIds.map(tagId => ({
          userId: input.userId,
          tagId,
        })))
        .returning()
        .all();

      // Return with tag information
      const result = newUserTags.map(userTag => ({
        ...userTag,
        tag: existingTags.find(tag => tag.id === userTag.tagId)!,
      }));

      return result;
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error bulk assigning user tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to bulk assign user tags'});
    }
  });

/**
 * Bulk remove multiple tags from a user (admin only)
 */
const bulkRemoveUserTags = os.bulkRemoveUserTags
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    // Check if user-tag relationships exist
    const existingUserTags = await db.select()
      .from(userTagsTable)
      .where(and(
        eq(userTagsTable.userId, input.userId),
        sql`${userTagsTable.tagId}
        IN (
        ${sql.join(input.tagIds.map(id => sql`${id}`), sql`, `)}
        )`
      ))
      .all();

    if (existingUserTags.length === 0) {
      throw new ORPCError('NOT_FOUND', {message: 'User does not have any of these tags'});
    }

    try {

      // Delete user tags
      await db.delete(userTagsTable)
        .where(and(
          eq(userTagsTable.userId, input.userId),
          sql`${userTagsTable.tagId}
          IN (
          ${sql.join(input.tagIds.map(id => sql`${id}`), sql`, `)}
          )`
        ));

      return {success: true};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error bulk removing user tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to bulk remove user tags'});
    }
  });

// === Stream Tag Assignment Procedures ===

/**
 * Assign a tag to a stream (admin only)
 */
const assignStreamTag = os.assignStreamTag
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Check if tag exists
      const tag = await db.select()
        .from(tags)
        .where(eq(tags.id, input.tagId))
        .get();

      if (!tag) {
        throw new ORPCError('NOT_FOUND', {message: 'Tag not found'});
      }

      // Check if stream-tag relationship already exists
      const existingStreamTag = await db.select()
        .from(streamTagsTable)
        .where(and(
          eq(streamTagsTable.scheduleId, input.scheduleId),
          eq(streamTagsTable.streamId, input.streamId),
          eq(streamTagsTable.tagId, input.tagId)
        ))
        .get();

      if (existingStreamTag) {
        throw new ORPCError('CONFLICT', {message: 'Stream already has this tag'});
      }

      // Insert new stream tag
      const newStreamTag = await db.insert(streamTagsTable)
        .values({
          scheduleId: input.scheduleId,
          streamId: input.streamId,
          tagId: input.tagId,
        })
        .returning()
        .get();

      // Return with tag information
      return {
        ...newStreamTag,
        tag: tag,
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error assigning stream tag:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to assign stream tag'});
    }
  });

/**
 * Remove a tag from a stream (admin only)
 */
const removeStreamTag = os.removeStreamTag
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Check if stream-tag relationship exists
      const existingStreamTag = await db.select()
        .from(streamTagsTable)
        .where(and(
          eq(streamTagsTable.scheduleId, input.scheduleId),
          eq(streamTagsTable.streamId, input.streamId),
          eq(streamTagsTable.tagId, input.tagId)
        ))
        .get();

      if (!existingStreamTag) {
        throw new ORPCError('NOT_FOUND', {message: 'Stream does not have this tag'});
      }

      // Delete stream tag
      await db.delete(streamTagsTable)
        .where(and(
          eq(streamTagsTable.scheduleId, input.scheduleId),
          eq(streamTagsTable.streamId, input.streamId),
          eq(streamTagsTable.tagId, input.tagId)
        ));

      return {success: true};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error removing stream tag:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to remove stream tag'});
    }
  });

/**
 * Get all tags for a specific stream (admin view)
 */
const getStreamTagsAdmin = os.getStreamTagsAdmin
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      const result = await db.select({
        scheduleId: streamTagsTable.scheduleId,
        streamId: streamTagsTable.streamId,
        tagId: streamTagsTable.tagId,
        addedAt: streamTagsTable.addedAt,
        tag: {
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
        },
      })
        .from(streamTagsTable)
        .innerJoin(tags, eq(streamTagsTable.tagId, tags.id))
        .where(and(
          eq(streamTagsTable.scheduleId, input.scheduleId),
          eq(streamTagsTable.streamId, input.streamId)
        ))
        .orderBy(streamTagsTable.addedAt);

      return result;
    } catch (error) {
      console.error('Error getting stream tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get stream tags'});
    }
  });

/**
 * Bulk assign multiple tags to a stream (admin only)
 */
const bulkAssignStreamTags = os.bulkAssignStreamTags
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    // Check if all tags exist
    const existingTags = await db.select()
      .from(tags)
      .where(sql`${tags.id}
      IN (
      ${sql.join(input.tagIds.map(id => sql`${id}`), sql`, `)}
      )`)
      .all();

    if (existingTags.length !== input.tagIds.length) {
      throw new ORPCError('NOT_FOUND', {message: 'One or more tags not found'});
    }

    try {

      // Check for existing stream-tag relationships
      const existingStreamTags = await db.select()
        .from(streamTagsTable)
        .where(and(
          eq(streamTagsTable.scheduleId, input.scheduleId),
          eq(streamTagsTable.streamId, input.streamId),
          sql`${streamTagsTable.tagId}
          IN (
          ${sql.join(input.tagIds.map(id => sql`${id}`), sql`, `)}
          )`
        ))
        .all();

      // Filter out already assigned tags
      const alreadyAssignedTagIds = existingStreamTags.map(st => st.tagId);
      const newTagIds = input.tagIds.filter(tagId => !alreadyAssignedTagIds.includes(tagId));

      if (newTagIds.length === 0) {
        throw new ORPCError('CONFLICT', {message: 'All tags are already assigned to this stream'});
      }

      // Insert new stream tags
      const newStreamTags = await db.insert(streamTagsTable)
        .values(newTagIds.map(tagId => ({
          scheduleId: input.scheduleId,
          streamId: input.streamId,
          tagId,
        })))
        .returning()
        .all();

      // Return with tag information
      const result = newStreamTags.map(streamTag => ({
        ...streamTag,
        tag: existingTags.find(tag => tag.id === streamTag.tagId)!,
      }));

      return result;
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error bulk assigning stream tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to bulk assign stream tags'});
    }
  });

/**
 * Bulk remove multiple tags from a stream (admin only)
 */
const bulkRemoveStreamTags = os.bulkRemoveStreamTags
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    // Check if stream-tag relationships exist
    const existingStreamTags = await db.select()
      .from(streamTagsTable)
      .where(and(
        eq(streamTagsTable.scheduleId, input.scheduleId),
        eq(streamTagsTable.streamId, input.streamId),
        sql`${streamTagsTable.tagId}
        IN (
        ${sql.join(input.tagIds.map(id => sql`${id}`), sql`, `)}
        )`
      ))
      .all();

    if (existingStreamTags.length === 0) {
      throw new ORPCError('NOT_FOUND', {message: 'Stream does not have any of these tags'});
    }

    try {

      // Delete stream tags
      await db.delete(streamTagsTable)
        .where(and(
          eq(streamTagsTable.scheduleId, input.scheduleId),
          eq(streamTagsTable.streamId, input.streamId),
          sql`${streamTagsTable.tagId}
          IN (
          ${sql.join(input.tagIds.map(id => sql`${id}`), sql`, `)}
          )`
        ));

      return {success: true};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error bulk removing stream tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to bulk remove stream tags'});
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
const getTagCategories = os.getTagCategories
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

      let query = db.select({
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
        tagCount: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${tags}
        WHERE
        ${tags.categoryId}
        =
        ${tagCategories.id}
        ),
        0
        )`,
        usageCount: sql<number>`COALESCE((SELECT COUNT(*) FROM
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
        )
        +
        COALESCE
        (
        (
        SELECT
        COUNT
        (
        *
        )
        FROM
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
        )`,
      })
        .from(tagCategories);

      // Apply where conditions if any exist
      if (whereConditions.length > 0) {
        return query
          .limit(input.limit)
          .orderBy(tagCategories.sortOrder, tagCategories.name)
          .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
      }

      return query
        .limit(input.limit)
        .orderBy(tagCategories.sortOrder, tagCategories.name);
    } catch (error) {
      console.error('Error getting tag categories:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get tag categories'});
    }
  });

/**
 * Get a single tag category by ID (admin only)
 */
const getTagCategory = os.getTagCategory
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Get category
      const category = await db.select()
        .from(tagCategories)
        .where(eq(tagCategories.id, input.id))
        .get();

      if (!category) {
        throw new ORPCError('NOT_FOUND', {message: 'Tag category not found'});
      }

      return category;
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error getting tag category:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get tag category'});
    }
  });

// === Tag Validation Procedures ===

/**
 * Check if a tag slug is available (admin only)
 */
const checkTagSlugAvailability = os.checkTagSlugAvailability
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Check if slug already exists, excluding the specified tag if provided
      let select = db.select()
        .from(tags)
      let query;
      if (input.excludeId) {
        query = select.where(and(eq(tags.slug, input.slug), eq(tags.slug, input.slug), ne(tags.id, input.excludeId)));
      } else {
        query = select.where(eq(tags.slug, input.slug));
      }

      const existingTag = await query.get();

      if (existingTag) {
        // Generate a suggestion by appending a number
        let suggestion = `${input.slug}-1`;
        let counter = 1;

        while (true) {
          const suggestionExists = await db.select()
            .from(tags)
            .where(eq(tags.slug, suggestion))
            .get();

          if (!suggestionExists) {
            break;
          }

          counter++;
          suggestion = `${input.slug}-${counter}`;

          // Prevent infinite loops
          if (counter > 100) {
            suggestion = `${input.slug}-${Date.now()}`;
            break;
          }
        }

        return {
          available: false,
          slug: input.slug,
          suggestion,
        };
      }

      return {
        available: true,
        slug: input.slug,
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error checking tag slug availability:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to check tag slug availability'});
    }
  });

/**
 * Check if a tag alias is available (admin only)
 */
const checkAliasAvailability = os.checkAliasAvailability
  .use(adminAuthMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Check if alias already exists
      const existingAlias = await db.select({
        id: tagAliases.id,
        tagId: tagAliases.tagId,
        alias: tagAliases.alias,
      })
        .from(tagAliases)
        .where(eq(tagAliases.alias, input.alias))
        .get();

      if (existingAlias) {
        // If excluding a specific tag and the alias belongs to that tag, consider it available
        if (input.excludeTagId && existingAlias.tagId === input.excludeTagId) {
          return {
            available: true,
            alias: input.alias,
          };
        }

        // Get the tag information for the existing alias
        const existingTag = await db.select()
          .from(tags)
          .where(eq(tags.id, existingAlias.tagId))
          .get();

        return {
          available: false,
          alias: input.alias,
          existingTag: existingTag || undefined,
        };
      }

      // Also check if the alias matches an existing tag slug
      const tagWithSlug = await db.select()
        .from(tags)
        .where(eq(tags.slug, input.alias))
        .get();

      if (tagWithSlug) {
        // If excluding a specific tag and the slug belongs to that tag, consider it available
        if (input.excludeTagId && tagWithSlug.id === input.excludeTagId) {
          return {
            available: true,
            alias: input.alias,
          };
        }

        return {
          available: false,
          alias: input.alias,
          existingTag: tagWithSlug,
        };
      }

      return {
        available: true,
        alias: input.alias,
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error checking alias availability:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to check alias availability'});
    }
  });

export const adminTagsRouter = {
  createTag,
  updateTag,
  deleteTag,
  getAdminTags,
  getTagWithAliases,
  addTagAlias,
  removeTagAlias,
  getTagAliases,
  assignUserTag,
  removeUserTag,
  getUserTagsAdmin,
  bulkAssignUserTags,
  bulkRemoveUserTags,
  assignStreamTag,
  removeStreamTag,
  getStreamTagsAdmin,
  bulkAssignStreamTags,
  bulkRemoveStreamTags,
  createTagCategory,
  updateTagCategory,
  deleteTagCategory,
  getTagCategories,
  getTagCategory,
  checkTagSlugAvailability,
  checkAliasAvailability,
}
