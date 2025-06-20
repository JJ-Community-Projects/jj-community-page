import {Repo, type RepoEnv} from "./Repo.ts";
import {streamTagsTable} from "../schema/schema.ts";
import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import {and, desc, eq, type InferSelectModel, like, notInArray, sql} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError.ts";
import {DateTime} from "luxon";
import type {BatchItem} from "drizzle-orm/batch";
import type {ActionAPIContext} from "astro:actions";
import type {TagUI} from "../models/schedule-ui.ts";

export class StreamTagRepo extends Repo<typeof streamTagsTable._['config']> {
  constructor(db: DrizzleD1Database, env: RepoEnv) {
    super(db, streamTagsTable, env);
  }

  static action(ctx: ActionAPIContext) {
    return new StreamTagRepo(drizzle(ctx.locals.runtime.env.DB), 'action')
  }

  /**
   * Find tags for a stream
   * @param streamId The stream ID
   * @param scheduleId The schedule ID
   * @returns Promise resolving to an array of stream tags
   *
   * SQL: `SELECT * FROM "streamTags" WHERE ("streamTags"."streamId" = ? AND "streamTags"."scheduleId" = ?)`
   */
  async findStreamTags(streamId: number, scheduleId: number): Promise<InferSelectModel<typeof streamTagsTable>[]> {
    try {
      return this.db.select()
        .from(streamTagsTable)
        .where(and(
          eq(streamTagsTable.streamId, streamId),
          eq(streamTagsTable.scheduleId, scheduleId)
        ))
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find tags for stream: ${streamId} in schedule: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find tags for stream: ${streamId} in schedule: ${scheduleId}`, error);
      }
    }
  }

  async findTagsGroupedByStream(scheduleId: number): Promise<Record<number, InferSelectModel<typeof streamTagsTable>[]>> {
    try {
      // Get all tags for all streams in the schedule in one query
      const allTags = await this.db.select()
        .from(streamTagsTable)
        .where(eq(streamTagsTable.scheduleId, scheduleId))
        .all();

      // Organize tags by streamId for efficient lookup
      const tagsByStreamId: Record<number, InferSelectModel<typeof streamTagsTable>[]> = {};

      // Group tags by streamId
      for (const tag of allTags) {
        if (!tagsByStreamId[tag.streamId]) {
          tagsByStreamId[tag.streamId] = [];
        }
        tagsByStreamId[tag.streamId].push(tag);
      }

      return tagsByStreamId;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find tags grouped by stream for schedule ID: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find tags grouped by stream for schedule ID: ${scheduleId}`, error);
      }
    }
  }

  async findTagsUIGroupedByStream(scheduleId: number): Promise<Record<number, TagUI[]>> {
    try {
      // Get all tags for all streams in the schedule in one query
      const allTags = await this.db.select()
        .from(streamTagsTable)
        .where(eq(streamTagsTable.scheduleId, scheduleId))
        .all();

      // Organize tags by streamId for efficient lookup
      const tagsByStreamId: Record<number, TagUI[]> = {};

      // Group tags by streamId and transform to TagUI format
      for (const tag of allTags) {
        if (!tagsByStreamId[tag.streamId]) {
          tagsByStreamId[tag.streamId] = [];
        }
        // Only include label and tag properties as required by TagUI type
        tagsByStreamId[tag.streamId].push({
          label: tag.label,
          tag: tag.tag
        });
      }

      return tagsByStreamId;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find TagUI grouped by stream for schedule ID: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find TagUI grouped by stream for schedule ID: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Add a tag to a stream
   * @param streamId The stream ID
   * @param scheduleId The schedule ID
   * @param tag The tag to add
   * @param label The label for the tag (defaults to the tag itself)
   * @returns Promise resolving to the created tag
   *
   * SQL: `INSERT INTO "streamTags" ("streamId", "scheduleId", "tag", "label", "addedAt") VALUES (?, ?, ?, ?, ?) RETURNING *`
   */
  async addStreamTag(streamId: number, scheduleId: number, tag: string, label?: string): Promise<InferSelectModel<typeof streamTagsTable>> {
    try {
      const normalizedTag = tag.toLowerCase();
      const tagLabel = label || normalizedTag;

      const [result] = await this.db.insert(streamTagsTable)
        .values({
          streamId,
          scheduleId,
          tag: normalizedTag,
          label: tagLabel,
          addedAt: DateTime.now().toUTC().toJSDate()
        })
        .returning();

      return result;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to add tag: ${tag} to stream: ${streamId} in schedule: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to add tag: ${tag} to stream: ${streamId} in schedule: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Remove a tag from a stream
   * @param streamId The stream ID
   * @param scheduleId The schedule ID
   * @param tag The tag to remove
   * @returns Promise resolving to a boolean indicating if the tag was removed
   *
   * SQL: `DELETE FROM "streamTags" WHERE ("streamTags"."streamId" = ? AND "streamTags"."scheduleId" = ? AND "streamTags"."tag" = ?) RETURNING *`
   */
  async removeStreamTag(streamId: number, scheduleId: number, tag: string): Promise<boolean> {
    try {
      const normalizedTag = tag.toLowerCase();

      const result = await this.db.delete(streamTagsTable)
        .where(and(
          eq(streamTagsTable.streamId, streamId),
          eq(streamTagsTable.scheduleId, scheduleId),
          eq(streamTagsTable.tag, normalizedTag)
        ))
        .returning();

      return result.length > 0;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to remove tag: ${tag} from stream: ${streamId} in schedule: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to remove tag: ${tag} from stream: ${streamId} in schedule: ${scheduleId}`, error);
      }
    }
  }

  async getPopularTags(limit: number) {
    try {
      return this.db
        .select({
          tag: streamTagsTable.tag,
          label: streamTagsTable.label,
          count: sql<number>`count(
          ${streamTagsTable.tag}
          )`.as('count')
        })
        .from(streamTagsTable)
        .groupBy(streamTagsTable.tag)
        .orderBy((s) => {
          return desc(s.count)
        })
        .limit(limit)
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError('Failed to get popular tags', error).toActionError()
      } else {
        throw new DatabaseError('Failed to get popular tags', error);
      }
    }
  }

  async getSuggestedTagsForStream(streamId: number, scheduleId: number, limit: number, tags: string[]) {
    try {
      return this.db
        .select({
          tag: streamTagsTable.tag,
          label: streamTagsTable.label,
          count: sql<number>`count(
          ${streamTagsTable.tag}
          )`.as('count')
        })
        .from(streamTagsTable)
        .where(
          notInArray(streamTagsTable.tag, tags)
        )
        .groupBy(streamTagsTable.tag)
        .orderBy((s) => {
          return desc(s.count)
        })
        .limit(limit)
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError('Failed to get suggested tags', error).toActionError()
      } else {
        throw new DatabaseError('Failed to get suggested tags', error);
      }
    }
  }

  async getSuggestedTagsForStreamBySearchTerm(streamId: number, scheduleId: number, limit: number, tags: string[], term: string) {
    try {
      return this.db
        .select({
          tag: streamTagsTable.tag,
          label: streamTagsTable.label,
          count: sql<number>`count(
          ${streamTagsTable.tag}
          )`.as('count')
        })
        .from(streamTagsTable)
        .where(
          and(
            notInArray(streamTagsTable.tag, tags),
            like(streamTagsTable.tag, `%${term.toLowerCase()}%`)
          )
        )
        .groupBy(streamTagsTable.tag)
        .orderBy((s) => {
          return desc(s.count)
        })
        .limit(limit)
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError('Failed to get suggested tags', error).toActionError()
      } else {
        throw new DatabaseError('Failed to get suggested tags', error);
      }
    }
  }

  /**
   * Add multiple tags to streams in a single batch operation
   * @param tags Array of tag objects with streamId, scheduleId, tag, and optional label
   * @returns Promise resolving when the operation is complete
   */
  async bulkAddStreamTags(tags?: Array<{
    streamId: number,
    scheduleId: number,
    tag: string,
    label?: string
  }>): Promise<void> {
    try {
      if (!tags || tags.length === 0) return;

      const operations: BatchItem<'sqlite'>[] = tags.map(tagObj => {
        const normalizedTag = tagObj.tag.toLowerCase();
        const tagLabel = tagObj.label || normalizedTag;

        return this.db.insert(streamTagsTable)
          .values({
            streamId: tagObj.streamId,
            scheduleId: tagObj.scheduleId,
            tag: normalizedTag,
            label: tagLabel,
            addedAt: DateTime.now().toUTC().toJSDate()
          });
      });

      await this.executeBatch(operations);
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to bulk add stream tags", error).toActionError();
      } else {
        throw new DatabaseError("Failed to bulk add stream tags", error);
      }
    }
  }

  /**
   * Remove multiple tags from streams in a single batch operation
   * @param tags Array of tag objects with streamId, scheduleId, and tag
   * @returns Promise resolving when the operation is complete
   */
  async bulkRemoveStreamTags(tags?: Array<{ streamId: number, scheduleId: number, tag: string }>): Promise<void> {
    try {
      if (!tags || tags.length === 0) return;

      const operations: BatchItem<'sqlite'>[] = tags.map(tagObj => {
        const normalizedTag = tagObj.tag.toLowerCase();

        return this.db.delete(streamTagsTable)
          .where(and(
            eq(streamTagsTable.streamId, tagObj.streamId),
            eq(streamTagsTable.scheduleId, tagObj.scheduleId),
            eq(streamTagsTable.tag, normalizedTag)
          ));
      });

      await this.executeBatch(operations);
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to bulk remove stream tags", error).toActionError();
      } else {
        throw new DatabaseError("Failed to bulk remove stream tags", error);
      }
    }
  }

  /**
   * Bulk write tags (create, delete) in a single batch operation
   *
   * This method combines tag creation and deletion into a single batch operation
   * for improved performance and atomicity. It uses the helper methods getTagCreateOps
   * and getTagDeleteOps to generate the database operations.
   *
   * @param writes Object containing scheduleId, tags to create and delete
   * @returns Promise resolving when the operation is complete
   */
  async bulkWriteTags(writes: {
    scheduleId: number,
    createTags?: Array<{ streamId: number, tag: string, label?: string }>,
    deleteTags?: Array<{ streamId: number, tag: string }>,
  }): Promise<void> {
    try {
      const {scheduleId, createTags, deleteTags} = writes;

      // Collect all operations using the helper methods
      const operations: BatchItem<'sqlite'>[] = [
        ...this.getTagCreateOps(scheduleId, createTags),
        ...this.getTagDeleteOps(scheduleId, deleteTags)
      ];

      // Execute all operations in a single batch
      await this.executeBatch(operations);
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to bulk write tags", error).toActionError();
      } else {
        throw new DatabaseError("Failed to bulk write tags", error);
      }
    }
  }

  /**
   * Generates database operations for creating tags
   *
   * This function takes an array of tag objects to create and generates the corresponding
   * database operations. It normalizes tag names to lowercase and ensures the correct
   * scheduleId is set for each tag.
   *
   * @param scheduleId The ID of the schedule these tags belong to
   * @param createTags Array of tag objects to create
   * @returns Array of database operations for batch execution
   */
  getTagCreateOps(scheduleId: number, createTags?: Array<{
    streamId: number,
    tag: string,
    label?: string
  }>): BatchItem<'sqlite'>[] {
    if (!createTags) return [];

    const operations: BatchItem<'sqlite'>[] = [];

    // Process tag creations
    for (const tag of createTags) {
      const normalizedTag = tag.tag.toLowerCase();
      const tagLabel = tag.label || normalizedTag;

      operations.push(
        this.db.insert(streamTagsTable)
          .values({
            streamId: tag.streamId,
            scheduleId,
            tag: normalizedTag,
            label: tagLabel,
            addedAt: DateTime.now().toUTC().toJSDate()
          })
      );
    }
    return operations;
  }

  /**
   * Generates database operations for deleting tags
   *
   * This function takes an array of tag objects to delete and generates the corresponding
   * database operations. It normalizes tag names to lowercase and ensures deletions are
   * applied only to tags with the correct scheduleId and streamId.
   *
   * @param scheduleId The ID of the schedule these tags belong to
   * @param deleteTags Array of tag objects to delete
   * @returns Array of database operations for batch execution
   */
  getTagDeleteOps(scheduleId: number, deleteTags?: Array<{ streamId: number, tag: string }>): BatchItem<'sqlite'>[] {
    if (!deleteTags) return [];

    const operations: BatchItem<'sqlite'>[] = [];

    // Process tag deletions
    for (const tag of deleteTags) {
      const normalizedTag = tag.tag.toLowerCase();

      operations.push(
        this.db.delete(streamTagsTable)
          .where(and(
            eq(streamTagsTable.streamId, tag.streamId),
            eq(streamTagsTable.scheduleId, scheduleId),
            eq(streamTagsTable.tag, normalizedTag)
          ))
      );
    }
    return operations;
  }


  getStreamTagsOperations(scheduleId: number, ops?: {
    creates?: Array<{ streamId: number, tag: string, label?: string }>,
    deletes?: Array<{ streamId: number, tag: string }>
  }): BatchItem<'sqlite'>[] {
    return [
      ...this.getTagCreateOps(scheduleId, ops?.creates),
      ...this.getTagDeleteOps(scheduleId, ops?.deletes)
    ];
  }
}
