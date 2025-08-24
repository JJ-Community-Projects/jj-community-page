import {implement, ORPCError} from '@orpc/server'
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {privateTagsContract} from "./contract.ts";
import {tagCategories, tags, userTagsTable} from "../../../db/schema/tags-schema.ts";
import {users} from "../../../db/schema/auth-schema.ts";
import {and, count, desc, eq, inArray, like, or, sql} from "drizzle-orm";
import {
  buildTagWhereConditions,
  getCategoryTagCountExpression,
  getCategoryWithStatsFields,
  getTagUsageFilterCondition,
  getTagWithUsageFields,
  getTagWithUsageAndCategoryFields,
  getTotalUsageExpression,
  getVisibleTagsCondition
} from "./util.ts";

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
        .from(userTagsTable)
        .where(and(eq(userTagsTable.userId, userId), eq(userTagsTable.tagId, input.tagId)))
        .get();

      if (existingUserTag) {
        throw new ORPCError('CONFLICT', {message: 'User already has this tag'});
      }

      // Insert new user tag
      const newUserTag = await db.insert(userTagsTable)
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
        .from(userTagsTable)
        .where(and(eq(userTagsTable.userId, userId), eq(userTagsTable.tagId, input.tagId)))
        .get();

      if (!existingUserTag) {
        throw new ORPCError('NOT_FOUND', {message: 'User does not have this tag'});
      }

      // Delete user tag
      await db.delete(userTagsTable)
        .where(and(eq(userTagsTable.userId, userId), eq(userTagsTable.tagId, input.tagId)));

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
        },
      })
        .from(userTagsTable)
        .innerJoin(tags, and(eq(userTagsTable.tagId, tags.id), eq(tags.visible, true)))
        .where(eq(userTagsTable.userId, userId))
        .orderBy(desc(userTagsTable.addedAt));

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
      // Build WHERE conditions using helper function
      // - Ensures only visible tags are returned
      // - Optionally filters by category if specified in input
      const whereConditions = buildTagWhereConditions(input.categoryId);

      // Execute SELECT query with comprehensive tag information and usage statistics
      const result = await db
        .select(getTagWithUsageFields()) // SELECT: Use standardized fields with usage calculations
        .from(tags) // FROM: Query the main tags table
        .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions)) // WHERE: Apply visibility and category filters
        .limit(input.limit) // LIMIT: Restrict number of results as requested
        .orderBy(
          // ORDER BY: Sort by total usage count (descending) then by name (ascending)
          // Note: Using full expression instead of alias to avoid SQLite column reference errors
          desc(getTotalUsageExpression()),
          tags.name
        );

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
        .from(userTagsTable)
        .innerJoin(users, eq(userTagsTable.userId, users.id))
        .where(eq(userTagsTable.tagId, input.tagId))
        .limit(input.limit)
        .orderBy(desc(userTagsTable.addedAt));

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
      // Build WHERE conditions using helper functions
      // - Ensures only visible tags are returned
      // - Optionally filters by category if specified in input
      const baseWhereConditions = buildTagWhereConditions(input.categoryId);

      // Add usage filter to only return tags that are actually used
      // - Filters out tags with zero user count AND zero stream count
      const usageFilter = getTagUsageFilterCondition();
      const allWhereConditions = [...baseWhereConditions, usageFilter];

      // Execute main SELECT query for popular tags with comprehensive statistics
      const popularTags = await db
        .select(getTagWithUsageFields()) // SELECT: Use standardized fields with usage calculations
        .from(tags) // FROM: Query the main tags table
        .where(and(...allWhereConditions)) // WHERE: Apply visibility, category, and usage filters
        .limit(input.limit) // LIMIT: Restrict number of results as requested
        .orderBy(
          // ORDER BY: Sort by total usage count (descending) then by name (ascending)
          // Note: Using full expression instead of alias to avoid SQLite column reference errors
          desc(getTotalUsageExpression()),
          tags.name
        );

      // Execute secondary COUNT query to get total visible tags statistics
      const totalTagsResult = await db
        .select({count: count()}) // SELECT: Count all matching rows
        .from(tags) // FROM: Query the main tags table
        .where(getVisibleTagsCondition()) // WHERE: Only count visible tags
        .get();

      // Return comprehensive response with tags, metadata, and statistics
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
      // Build base WHERE conditions using helper functions
      // - Ensures only visible tags are returned
      // - Optionally filters by category if specified in input
      const baseWhereConditions = buildTagWhereConditions(input.categoryId);

      // Build search conditions for text matching
      // - Performs case-insensitive search in tag names and descriptions
      // - Uses LIKE operator with wildcard patterns for flexible matching
      const searchPattern = `%${input.query.toLowerCase()}%`;
      const searchConditions = or(
        like(sql`lower(${tags.name})`, searchPattern), // Search in tag names (case-insensitive)
        like(sql`lower(${tags.description})`, searchPattern) // Search in tag descriptions (case-insensitive)
      );

      // Combine all WHERE conditions
      const allWhereConditions = [...baseWhereConditions, searchConditions];

      // Execute SELECT query with comprehensive tag information and usage statistics
      const result = await db
        .select(getTagWithUsageFields()) // SELECT: Use standardized fields with usage calculations
        .from(tags) // FROM: Query the main tags table
        .where(and(...allWhereConditions)) // WHERE: Apply visibility, category, and search filters
        .limit(input.limit) // LIMIT: Restrict number of results as requested
        .orderBy(
          // ORDER BY: Sort by total usage count (descending) then by name (ascending)
          // Note: Using full expression instead of alias to avoid SQLite column reference errors
          desc(getTotalUsageExpression()),
          tags.name
        );

      return result;
    } catch (error) {
      console.error('Error searching tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to search tags'});
    }
  });

/**
 * Enhanced search for admin-created tags including category names
 * Searches in tag names, slugs, descriptions, AND category names
 */
const fullTagsSearch = os.fullTagsSearch
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Build base WHERE conditions for tag visibility
      let whereConditions = [eq(tags.visible, true)];

      // Add category filtering if category IDs are provided
      if (input.categoryIds.length > 0) {
        whereConditions.push(inArray(tags.categoryId, input.categoryIds));
      }

      // Build comprehensive search conditions
      // - Performs case-insensitive search in tag names, slugs, descriptions, AND category names
      // - Uses LIKE operator with wildcard patterns for flexible matching
      const searchPattern = `%${input.query.toLowerCase()}%`;
      const searchConditions = or(
        like(sql`lower(${tags.name})`, searchPattern), // Search in tag names (case-insensitive)
        like(sql`lower(${tags.slug})`, searchPattern), // Search in tag slugs (case-insensitive)
        like(sql`lower(${tags.description})`, searchPattern), // Search in tag descriptions (case-insensitive)
        like(sql`lower(${tagCategories.name})`, searchPattern) // Search in category names (case-insensitive)
      );

      // Combine all WHERE conditions
      const allWhereConditions = [...whereConditions, searchConditions];

      // Execute SELECT query with comprehensive tag information and usage statistics
      // Uses LEFT JOIN to include category information for searching and response
      const result = await db
        .select(getTagWithUsageAndCategoryFields()) // SELECT: Use extended fields with category information
        .from(tags) // FROM: Query the main tags table
        .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id)) // LEFT JOIN: Include category data for search and response
        .where(and(...allWhereConditions)) // WHERE: Apply visibility, category, and search filters
        .limit(input.limit) // LIMIT: Restrict number of results as requested
        .orderBy(
          // ORDER BY: Sort by total usage count (descending) then by name (ascending)
          // Note: Using full expression instead of alias to avoid SQLite column reference errors
          desc(getTotalUsageExpression()),
          tags.name
        );

      return result;
    } catch (error) {
      console.error('Error in fullTagsSearch:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to search tags with categories'});
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
      // Build base WHERE conditions for category visibility
      // - Ensures only visible categories are returned
      let whereConditions = [eq(tagCategories.visible, true)];

      // Add filter for non-empty categories if requested
      // - Filters out categories with no visible tags
      // - Uses WHERE clause instead of HAVING to avoid SQLite aggregate query errors
      if (!input.includeEmpty) {
        whereConditions.push(
          sql`${getCategoryTagCountExpression()} > 0` // WHERE: Only categories with at least one visible tag
        );
      }

      // Execute SELECT query with comprehensive category information and statistics
      const result = await db
        .select(getCategoryWithStatsFields()) // SELECT: Use standardized fields with category statistics
        .from(tagCategories) // FROM: Query the tag categories table
        .where(and(...whereConditions)) // WHERE: Apply visibility and empty category filters
        .orderBy(
          // ORDER BY: Sort by assigned sort order then by name
          // - Primary sort: sortOrder (ascending) for admin-controlled ordering
          // - Secondary sort: name (ascending) for consistent alphabetical fallback
          tagCategories.sortOrder,
          tagCategories.name
        );

      return result;
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
  fullTagsSearch,
  getTagCategories,
}
