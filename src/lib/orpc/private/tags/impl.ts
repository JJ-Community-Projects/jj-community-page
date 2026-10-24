import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { authMiddleware } from '../../middleware/authMiddleware.ts'
import { privateTagsContract } from './contract.ts'
import {
  tagCategories,
  tags,
  userTagsTable,
} from '../../../db/schema/tags-schema.ts'
import { and, desc, eq, sql } from 'drizzle-orm'
import {
  buildTagWhereConditions,
  getCategoryTagCountExpression,
  getCategoryWithStatsFields,
  getTagWithUsageFields,
  getTotalUsageExpression,
} from './util.ts'
import {
  canAddTagFrom,
  checkCanAddTagToUser,
  TAGS_PER_USER,
  userTagsCount,
} from '../util/limits.ts'

const os = implement(privateTagsContract).use(dbMiddleware)

// === User Tag Management Procedures ===

/**
 * Add an admin-created tag to the current user's profile
 */
const addUserTag = os.addUserTag
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const userId = context.userId

    try {
      const visibleTag = and(eq(tags.id, input.tagId), eq(tags.visible, true))
      const ownRow = and(
        eq(userTagsTable.userId, userId),
        eq(userTagsTable.tagId, input.tagId),
      )
      // One round trip (TAG-07). The insert checks visibility and the limit itself, so two adds
      // at once can't pass the limit together. Only a refused insert costs a second one, to say why.
      const [inserted, [tag]] = await db.batch([
        db
          .insert(userTagsTable)
          .select(
            db
              .select({
                userId: sql<number>`${userId}`.as('user_id'),
                tagId: tags.id,
                addedAt: sql<Date>`(unixepoch())`.as('added_at'),
              })
              .from(tags)
              .where(
                and(
                  visibleTag,
                  sql`(select count(*) from ${userTagsTable} where ${userTagsTable.userId} = ${userId}) < ${TAGS_PER_USER}`,
                ),
              ),
          )
          .onConflictDoNothing()
          .returning(),
        db.select().from(tags).where(visibleTag),
      ])
      const newUserTag = inserted[0]

      if (!newUserTag) {
        if (!tag) {
          throw new ORPCError('NOT_FOUND', {
            message: 'Tag not found or not visible',
          })
        }
        const [owned, countRows] = await db.batch([
          db
            .select({ tagId: userTagsTable.tagId })
            .from(userTagsTable)
            .where(ownRow),
          userTagsCount(db, userId),
        ])
        if (owned.length > 0) {
          throw new ORPCError('CONFLICT', {
            message: 'User already has this tag',
          })
        }
        throw new ORPCError('FORBIDDEN', {
          message: 'Profile tag limit reached',
          ...canAddTagFrom(countRows),
        })
      }

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
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error adding user tag:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to add user tag',
      })
    }
  })

/**
 * Remove a tag from the current user's profile
 */
const removeUserTag = os.removeUserTag
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const userId = context.userId

    try {
      // One round trip (TAG-08): nothing deleted means the user doesn't have the tag
      const deleted = await db
        .delete(userTagsTable)
        .where(
          and(
            eq(userTagsTable.userId, userId),
            eq(userTagsTable.tagId, input.tagId),
          ),
        )
        .returning({ tagId: userTagsTable.tagId })

      if (deleted.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'User does not have this tag',
        })
      }

      return { success: true }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error removing user tag:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to remove user tag',
      })
    }
  })

/**
 * Get all tags for the authenticated user
 */
const getUserTags = os.getUserTags
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db
    const userId = context.userId

    try {
      const result = await db
        .select({
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
        .innerJoin(
          tags,
          and(eq(userTagsTable.tagId, tags.id), eq(tags.visible, true)),
        )
        .where(eq(userTagsTable.userId, userId))
        .orderBy(desc(userTagsTable.addedAt))

      return result
    } catch (error) {
      console.error('Error getting user tags:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get user tags',
      })
    }
  })

// === Tag Discovery Procedures ===

/**
 * List all available admin-created tags with usage statistics
 */
const listAvailableTags = os.listAvailableTags
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db

    try {
      // Build WHERE conditions using helper function
      // - Ensures only visible tags are returned
      // - Optionally filters by category if specified in input
      const whereConditions = buildTagWhereConditions(input.categoryId)

      // Execute SELECT query with comprehensive tag information and usage statistics
      const result = await db
        .select(getTagWithUsageFields()) // SELECT: Use standardized fields with usage calculations
        .from(tags) // FROM: Query the main tags table
        .where(
          whereConditions.length === 1
            ? whereConditions[0]
            : and(...whereConditions),
        ) // WHERE: Apply visibility and category filters
        .limit(input.limit) // LIMIT: Restrict number of results as requested
        .orderBy(
          // ORDER BY: Sort by total usage count (descending) then by name (ascending)
          // Note: Using full expression instead of alias to avoid SQLite column reference errors
          desc(getTotalUsageExpression()),
          tags.name,
        )

      return result
    } catch (error) {
      console.error('Error listing available tags:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to list available tags',
      })
    }
  })

/**
 * Get available tag categories for browsing
 */
const getTagCategories = os.getTagCategories
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db

    try {
      // Build base WHERE conditions for category visibility
      // - Ensures only visible categories are returned
      let whereConditions = [eq(tagCategories.visible, true)]

      // Add filter for non-empty categories if requested
      // - Filters out categories with no visible tags
      // - Uses WHERE clause instead of HAVING to avoid SQLite aggregate query errors
      if (!input.includeEmpty) {
        whereConditions.push(
          sql`${getCategoryTagCountExpression()} > 0`, // WHERE: Only categories with at least one visible tag
        )
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
          tagCategories.name,
        )

      return result
    } catch (error) {
      console.error('Error getting tag categories:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get tag categories',
      })
    }
  })

// Limit-checks
const canAddTagToUser = os.canAddTagToUser
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const { db, userId } = context
    return checkCanAddTagToUser(db, userId)
  })

export const tagsRouter = {
  addUserTag,
  removeUserTag,
  getUserTags,
  listAvailableTags,
  getTagCategories,

  // Limit-checks
  canAddTagToUser,
}
