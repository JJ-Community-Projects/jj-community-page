import {implement, ORPCError} from '@orpc/server'
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {privateTagsContract} from "./contract.ts";
import {streamTags, tagCategories, tags, userTags} from "../../../db/schema/tags-schema.ts";
import {users} from "../../../db/schema/auth-schema.ts";
import {and, count, desc, eq, like, or, sql} from "drizzle-orm";

const os = implement(privateTagsContract)
  .use(dbMiddleware);

// === User Tag Management Procedures ===

/**
 * Add an admin-created tag to the current user's profile
 */
const addUserTag = os.addUserTag
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;

    try {
      // Check if tag exists and is visible
      const tag = await db.select()
        .from(tags)
        .where(and(eq(tags.id, input.tagId), eq(tags.visible, true)))
        .get();

      if (!tag) {
        throw new ORPCError('NOT_FOUND', {message: 'Tag not found or not visible'});
      }

      // Check if user already has this tag
      const existingUserTag = await db.select()
        .from(userTags)
        .where(and(eq(userTags.userId, userId), eq(userTags.tagId, input.tagId)))
        .get();

      if (existingUserTag) {
        throw new ORPCError('CONFLICT', {message: 'User already has this tag'});
      }

      // Insert new user tag
      const newUserTag = await db.insert(userTags)
        .values({
          userId: userId,
          tagId: input.tagId,
        })
        .returning()
        .get();

      // Return with tag information
      return {
        ...newUserTag,
        tag: {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          description: tag.description,
          categoryId: tag.categoryId,
          color: tag.color,
        },
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error adding user tag:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to add user tag'});
    }
  });

/**
 * Remove a tag from the current user's profile
 */
const removeUserTag = os.removeUserTag
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;

    try {
      // Check if user has this tag
      const existingUserTag = await db.select()
        .from(userTags)
        .where(and(eq(userTags.userId, userId), eq(userTags.tagId, input.tagId)))
        .get();

      if (!existingUserTag) {
        throw new ORPCError('NOT_FOUND', {message: 'User does not have this tag'});
      }

      // Delete user tag
      await db.delete(userTags)
        .where(and(eq(userTags.userId, userId), eq(userTags.tagId, input.tagId)));

      return {success: true};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error removing user tag:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to remove user tag'});
    }
  });

/**
 * Get all tags for the authenticated user
 */
const getUserTags = os.getUserTags
  .use(authMiddleware)
  .handler(async ({context}) => {
    const db = context.db;
    const userId = context.userId;

    try {
      const result = await db.select({
        userId: userTags.userId,
        tagId: userTags.tagId,
        addedAt: userTags.addedAt,
        tag: {
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          description: tags.description,
          categoryId: tags.categoryId,
          color: tags.color,
        },
      })
        .from(userTags)
        .innerJoin(tags, and(eq(userTags.tagId, tags.id), eq(tags.visible, true)))
        .where(eq(userTags.userId, userId))
        .orderBy(desc(userTags.addedAt));

      return result;
    } catch (error) {
      console.error('Error getting user tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get user tags'});
    }
  });

// === Tag Discovery Procedures ===

/**
 * List all available admin-created tags with usage statistics
 */
const listAvailableTags = os.listAvailableTags
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Build where conditions
      let whereConditions = [eq(tags.visible, true)];

      // Filter by category if provided
      if (input.categoryId) {
        whereConditions.push(eq(tags.categoryId, input.categoryId));
      }

      const result = await db.select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        categoryId: tags.categoryId,
        color: tags.color,
        userCount: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${userTags}
        WHERE
        ${userTags.tagId}
        =
        ${tags.id}
        ),
        0
        )`,
        streamCount: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${streamTags}
        WHERE
        ${streamTags.tagId}
        =
        ${tags.id}
        ),
        0
        )`,
        totalUsage: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${userTags}
        WHERE
        ${userTags.tagId}
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
        ${streamTags}
        WHERE
        ${streamTags.tagId}
        =
        ${tags.id}
        ),
        0
        )`,
      })
        .from(tags)
        .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
        .limit(input.limit)
        .orderBy(desc(sql`totalUsage`), tags.name);

      return result;
    } catch (error) {
      console.error('Error listing available tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to list available tags'});
    }
  });

/**
 * Find users who have a specific admin-created tag
 */
const findUsersByTag = os.findUsersByTag
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // First check if tag exists and is visible
      const tag = await db.select()
        .from(tags)
        .where(and(eq(tags.id, input.tagId), eq(tags.visible, true)))
        .get();

      if (!tag) {
        throw new ORPCError('NOT_FOUND', {message: 'Tag not found or not visible'});
      }

      // Find users with this tag
      const result = await db.select({
        userId: users.id,
        username: sql<string>`COALESCE(
        ${users.id}
        :
        :
        text,
        'User '
        ||
        ${users.id}
        )`, // Placeholder username logic
        profileImage: sql<string | null>`NULL`, // Placeholder for profile image
        tags: sql<any[]>`'[]'`, // This would need to be populated separately
        tagCount: sql<number>`1`, // This would need actual count
      })
        .from(userTags)
        .innerJoin(users, eq(userTags.userId, users.id))
        .where(eq(userTags.tagId, input.tagId))
        .limit(input.limit)
        .orderBy(desc(userTags.addedAt));

      return result;
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error finding users by tag:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to find users by tag'});
    }
  });

/**
 * Get popular admin-created tags across the platform
 */
const getPopularTags = os.getPopularTags
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Build where conditions
      let whereConditions = [eq(tags.visible, true)];

      // Filter by category if provided
      if (input.categoryId) {
        whereConditions.push(eq(tags.categoryId, input.categoryId));
      }

      // Get popular tags with usage statistics
      const popularTags = await db.select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        categoryId: tags.categoryId,
        color: tags.color,
        userCount: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${userTags}
        WHERE
        ${userTags.tagId}
        =
        ${tags.id}
        ),
        0
        )`,
        streamCount: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${streamTags}
        WHERE
        ${streamTags.tagId}
        =
        ${tags.id}
        ),
        0
        )`,
        totalUsage: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${userTags}
        WHERE
        ${userTags.tagId}
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
        ${streamTags}
        WHERE
        ${streamTags.tagId}
        =
        ${tags.id}
        ),
        0
        )`,
      })
        .from(tags)
        .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
        .having(sql`totalUsage
        > 0`)
        .limit(input.limit)
        .orderBy(desc(sql`totalUsage`), tags.name);

      // Get total visible tags count
      const totalTagsResult = await db.select({count: count()})
        .from(tags)
        .where(eq(tags.visible, true))
        .get();

      return {
        tags: popularTags,
        totalTags: totalTagsResult?.count || 0,
        timeRange: input.timeRange,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error getting popular tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get popular tags'});
    }
  });

/**
 * Search admin-created tags by name or alias
 */
const searchTags = os.searchTags
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Build where conditions
      let whereConditions = [eq(tags.visible, true)];

      // Filter by category if provided
      if (input.categoryId) {
        whereConditions.push(eq(tags.categoryId, input.categoryId));
      }

      // Search in tag names and descriptions
      const searchPattern = `%${input.query.toLowerCase()}%`;
      const searchConditions = or(
        like(sql`lower(
        ${tags.name}
        )`, searchPattern),
        like(sql`lower(
        ${tags.description}
        )`, searchPattern)
      );

      if (searchConditions) {
        whereConditions.push(searchConditions);
      }

      const result = await db.select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        categoryId: tags.categoryId,
        color: tags.color,
        userCount: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${userTags}
        WHERE
        ${userTags.tagId}
        =
        ${tags.id}
        ),
        0
        )`,
        streamCount: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${streamTags}
        WHERE
        ${streamTags.tagId}
        =
        ${tags.id}
        ),
        0
        )`,
        totalUsage: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${userTags}
        WHERE
        ${userTags.tagId}
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
        ${streamTags}
        WHERE
        ${streamTags.tagId}
        =
        ${tags.id}
        ),
        0
        )`,
      })
        .from(tags)
        .where(and(...whereConditions))
        .limit(input.limit)
        .orderBy(desc(sql`totalUsage`), tags.name);

      return result;
    } catch (error) {
      console.error('Error searching tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to search tags'});
    }
  });

/**
 * Get available tag categories for browsing
 */
const getTagCategories = os.getTagCategories
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Build where conditions
      let whereConditions = [eq(tagCategories.visible, true)];

      let query = db.select({
        id: tagCategories.id,
        slug: tagCategories.slug,
        name: tagCategories.name,
        description: tagCategories.description,
        color: tagCategories.color,
        icon: tagCategories.icon,
        sortOrder: tagCategories.sortOrder,
        visible: tagCategories.visible,
        tagCount: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${tags}
        WHERE
        ${tags.categoryId}
        =
        ${tagCategories.id}
        AND
        ${tags.visible}
        =
        true
        ),
        0
        )`,
        usageCount: sql<number>`COALESCE((SELECT COUNT(*) FROM
        ${userTags}
        INNER
        JOIN
        ${tags}
        ON
        ${userTags.tagId}
        =
        ${tags.id}
        WHERE
        ${tags.categoryId}
        =
        ${tagCategories.id}
        AND
        ${tags.visible}
        =
        true
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
        ${streamTags}
        INNER
        JOIN
        ${tags}
        ON
        ${streamTags.tagId}
        =
        ${tags.id}
        WHERE
        ${tags.categoryId}
        =
        ${tagCategories.id}
        AND
        ${tags.visible}
        =
        true
        ),
        0
        )`,
      })
        .from(tagCategories)
        .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));

      // Filter out empty categories if requested
      if (!input.includeEmpty) {
        return query.orderBy(tagCategories.sortOrder, tagCategories.name).having(sql`tagCount
        > 0`);
      }

      return query.orderBy(tagCategories.sortOrder, tagCategories.name);
    } catch (error) {
      console.error('Error getting tag categories:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get tag categories'});
    }
  });

export const tagsRouter = {
  addUserTag,
  removeUserTag,
  getUserTags,
  listAvailableTags,
  findUsersByTag,
  getPopularTags,
  searchTags,
  getTagCategories,
}
