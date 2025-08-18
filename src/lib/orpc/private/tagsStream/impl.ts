import {implement, ORPCError} from '@orpc/server'
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {streamTagsContract} from "./contract.ts";
import {streamTagsTable, tags, userTagsTable} from "../../../db/schema/tags-schema.ts";
import {and, count, desc, eq, like, or, sql} from "drizzle-orm";

const os = implement(streamTagsContract)
  .use(dbMiddleware);

// === Stream Tag Management Procedures ===

/**
 * Add an admin-created tag to a stream
 */
const addStreamTag = os.addStreamTag
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Check if tag exists and is visible
      const tag = await db.select()
        .from(tags)
        .where(and(eq(tags.id, input.tagId), eq(tags.visible, true)))
        .get();

      if (!tag) {
        throw new ORPCError('NOT_FOUND', {message: 'Tag not found or not visible'});
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
      console.error('Error adding stream tag:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to add stream tag'});
    }
  });

/**
 * Remove a tag from a stream
 */
const removeStreamTag = os.removeStreamTag
  .use(authMiddleware)
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
 * Get all tags for a specific stream
 */
const getStreamTags = os.getStreamTags
  .use(authMiddleware)
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
        },
      })
        .from(streamTagsTable)
        .innerJoin(tags, and(eq(streamTagsTable.tagId, tags.id), eq(tags.visible, true)))
        .where(and(
          eq(streamTagsTable.scheduleId, input.scheduleId),
          eq(streamTagsTable.streamId, input.streamId)
        ))
        .orderBy(desc(streamTagsTable.addedAt));

      return result;
    } catch (error) {
      console.error('Error getting stream tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get stream tags'});
    }
  });

/**
 * Find popular stream tags across all streams in schedule
 */
const getPopularStreamTags = os.getPopularStreamTags
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;

    try {
      // Build where conditions
      let whereConditions = [eq(tags.visible, true)];

      // Filter by schedule if provided
      if (input.scheduleId) {
        whereConditions.push(eq(streamTagsTable.scheduleId, input.scheduleId));
      }

      // Get popular stream tags with usage statistics
      const popularTags = await db.select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        categoryId: tags.categoryId,
        color: tags.color,
        streamCount: sql<number>`COUNT(DISTINCT ${streamTagsTable.scheduleId} || '-' || ${streamTagsTable.streamId})`,
        totalUsage: sql<number>`COUNT(${streamTagsTable.tagId})`,
      })
        .from(tags)
        .innerJoin(streamTagsTable, eq(tags.id, streamTagsTable.tagId))
        .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
        .groupBy(tags.id)
        .orderBy(desc(sql`totalUsage`), tags.name)
        .limit(input.limit);

      // Get total tags count
      const totalTagsResult = await db.select({count: count()})
        .from(tags)
        .innerJoin(streamTagsTable, eq(tags.id, streamTagsTable.tagId))
        .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
        .get();

      return {
        tags: popularTags,
        totalTags: totalTagsResult?.count || 0,
        scheduleId: input.scheduleId,
      };
    } catch (error) {
      console.error('Error getting popular stream tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get popular stream tags'});
    }
  });

/**
 * Search available admin-created tags for stream assignment
 */
const searchStreamTags = os.searchStreamTags
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
        like(sql`lower(${tags.name})`, searchPattern),
        like(sql`lower(${tags.description})`, searchPattern)
      );
      if(searchConditions) {
        whereConditions.push(searchConditions);
      }
      // Get tags with usage statistics
      const baseQuery = db.select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        categoryId: tags.categoryId,
        color: tags.color,
        userCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${userTagsTable} WHERE ${userTagsTable.tagId} = ${tags.id}), 0)`,
        streamCount: sql<number>`COALESCE((SELECT COUNT(DISTINCT ${streamTagsTable.scheduleId} || '-' || ${streamTagsTable.streamId}) FROM ${streamTagsTable} WHERE ${streamTagsTable.tagId} = ${tags.id}), 0)`,
        totalUsage: sql<number>`COALESCE((SELECT COUNT(*) FROM ${userTagsTable} WHERE ${userTagsTable.tagId} = ${tags.id}), 0) + COALESCE((SELECT COUNT(*) FROM ${streamTagsTable} WHERE ${streamTagsTable.tagId} = ${tags.id}), 0)`,
      })
        .from(tags)
        .where(and(...whereConditions));

      // If excluding assigned tags for a specific stream, add that condition
      if (input.excludeAssigned && input.streamId && input.scheduleId) {
        const result = await db.select({
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          description: tags.description,
          categoryId: tags.categoryId,
          color: tags.color,
          userCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${userTagsTable} WHERE ${userTagsTable.tagId} = ${tags.id}), 0)`,
          streamCount: sql<number>`COALESCE((SELECT COUNT(DISTINCT ${streamTagsTable.scheduleId} || '-' || ${streamTagsTable.streamId}) FROM ${streamTagsTable} WHERE ${streamTagsTable.tagId} = ${tags.id}), 0)`,
          totalUsage: sql<number>`COALESCE((SELECT COUNT(*) FROM ${userTagsTable} WHERE ${userTagsTable.tagId} = ${tags.id}), 0) + COALESCE((SELECT COUNT(*) FROM ${streamTagsTable} WHERE ${streamTagsTable.tagId} = ${tags.id}), 0)`,
          isAssignedToStream: sql<boolean>`CASE WHEN EXISTS(SELECT 1 FROM ${streamTagsTable} WHERE ${streamTagsTable.tagId} = ${tags.id} AND ${streamTagsTable.scheduleId} = ${input.scheduleId} AND ${streamTagsTable.streamId} = ${input.streamId}) THEN true ELSE false END`,
        })
          .from(tags)
          .where(and(
            ...whereConditions,
            sql`NOT EXISTS(SELECT 1 FROM ${streamTagsTable} WHERE ${streamTagsTable.tagId} = ${tags.id} AND ${streamTagsTable.scheduleId} = ${input.scheduleId} AND ${streamTagsTable.streamId} = ${input.streamId})`
          ))
          .limit(input.limit)
          .orderBy(desc(sql`totalUsage`), tags.name);

        return result;
      }

      // If checking assignment status but not excluding
      if (input.streamId && input.scheduleId) {
        const result = await db.select({
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          description: tags.description,
          categoryId: tags.categoryId,
          color: tags.color,
          userCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${userTagsTable} WHERE ${userTagsTable.tagId} = ${tags.id}), 0)`,
          streamCount: sql<number>`COALESCE((SELECT COUNT(DISTINCT ${streamTagsTable.scheduleId} || '-' || ${streamTagsTable.streamId}) FROM ${streamTagsTable} WHERE ${streamTagsTable.tagId} = ${tags.id}), 0)`,
          totalUsage: sql<number>`COALESCE((SELECT COUNT(*) FROM ${userTagsTable} WHERE ${userTagsTable.tagId} = ${tags.id}), 0) + COALESCE((SELECT COUNT(*) FROM ${streamTagsTable} WHERE ${streamTagsTable.tagId} = ${tags.id}), 0)`,
          isAssignedToStream: sql<boolean>`CASE WHEN EXISTS(SELECT 1 FROM ${streamTagsTable} WHERE ${streamTagsTable.tagId} = ${tags.id} AND ${streamTagsTable.scheduleId} = ${input.scheduleId} AND ${streamTagsTable.streamId} = ${input.streamId}) THEN true ELSE false END`,
        })
          .from(tags)
          .where(and(...whereConditions))
          .limit(input.limit)
          .orderBy(desc(sql`totalUsage`), tags.name);

        return result;
      }

      // Basic search without assignment status
      const result = await baseQuery
        .limit(input.limit)
        .orderBy(desc(sql`totalUsage`), tags.name);

      return result.map(tag => ({
        ...tag,
        isAssignedToStream: undefined,
      }));
    } catch (error) {
      console.error('Error searching stream tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to search stream tags'});
    }
  });

export const streamTagsRouter = {
  addStreamTag,
  removeStreamTag,
  getStreamTags,
  getPopularStreamTags,
  searchStreamTags,
}
