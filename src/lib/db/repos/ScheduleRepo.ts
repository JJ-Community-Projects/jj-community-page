import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import {Repo, type RepoEnv} from "./Repo";
import {schedulesTable, streamParticipantsTable, streamsTable, streamTagsTable} from "../schema/schema";
import {and, desc, eq, type InferInsertModel, type InferSelectModel, like, notInArray, sql} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError";
import {DateTime} from "luxon";
import type {ActionAPIContext} from "astro:actions";
import type {BatchItem} from "drizzle-orm/batch";

/**
 * Repository for working with schedules
 */
export class ScheduleRepo extends Repo<typeof schedulesTable._['config']> {
  constructor(db: DrizzleD1Database, env: RepoEnv) {
    super(db, schedulesTable, env);
  }

  static action(ctx: ActionAPIContext) {
    return new ScheduleRepo(drizzle(ctx.locals.runtime.env.DB), 'action')
  }

  // region Schedule Operations

  /**
   * Find a record by its primary key
   * @param id The primary key value
   * @returns Promise resolving to the record or null if not found
   *
   * SQL: `SELECT * FROM "schedules" WHERE "schedules"."id" = ?`
   */
  async findById(id: number): Promise<InferSelectModel<typeof schedulesTable> | null> {
    try {
      const result = await this.db.select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .get();

      return result || null;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find record by id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find record by id: ${id}`, error);
      }
    }
  }

  /**
   * Find a schedule by its slug
   * @param slug The schedule slug
   * @returns Promise resolving to the schedule or null if not found
   *
   * SQL: `SELECT * FROM "schedules" WHERE "schedules"."slug" = ?`
   */
  async findBySlug(slug: string): Promise<InferSelectModel<typeof schedulesTable> | null> {
    try {
      const result = await this.db.select()
        .from(this.table)
        .where(eq(this.table.slug, slug))
        .get();

      return result || null;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find schedule by slug: ${slug}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find schedule by slug: ${slug}`, error);
      }
    }
  }

  /**
   * Find schedules by owner ID
   * @param ownerId The owner ID
   * @returns Promise resolving to an array of schedules
   *
   * SQL: `SELECT * FROM "schedules" WHERE "schedules"."ownerId" = ?`
   */
  async findByOwnerId(ownerId: number): Promise<InferSelectModel<typeof schedulesTable>[]> {
    try {
      return await this.db.select()
        .from(this.table)
        .where(eq(this.table.ownerId, ownerId))
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find schedules by owner ID: ${ownerId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find schedules by owner ID: ${ownerId}`, error);
      }
    }
  }

  /**
   * Find visible schedules
   * @returns Promise resolving to an array of visible schedules
   *
   * SQL: `SELECT * FROM "schedules" WHERE "schedules"."visible" = ?`
   */
  async findVisible(): Promise<InferSelectModel<typeof schedulesTable>[]> {
    try {
      return await this.db.select()
        .from(this.table)
        .where(eq(this.table.visible, true))
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to find visible schedules", error).toActionError();
      } else {
        throw new DatabaseError("Failed to find visible schedules", error);
      }
    }
  }

  /**
   * Find all records in the table
   * @returns Promise resolving to an array of records
   *
   * SQL: `SELECT * FROM "schedules"`
   */
  async findAll(): Promise<InferSelectModel<typeof schedulesTable>[]> {
    try {
      return await this.db.select()
        .from(this.table)
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to find all records", error).toActionError();
      } else {
        throw new DatabaseError("Failed to find all records", error);
      }
    }
  }

  /**
   * Create a new record
   * @param data The data to insert
   * @returns Promise resolving to the created record
   *
   * SQL: `INSERT INTO "schedules" (...) VALUES (...) RETURNING *`
   */
  async create(data: InferInsertModel<typeof schedulesTable>): Promise<InferSelectModel<typeof schedulesTable>> {
    try {
      const [result] = await this.db.insert(this.table)
        .values(data as any)
        .returning();

      return result;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to create record", error).toActionError();
      } else {
        throw new DatabaseError("Failed to create record", error);
      }
    }
  }

  /**
   * Update a record by its primary key
   * @param id The primary key value
   * @param data The data to update
   * @returns Promise resolving to the updated record
   *
   * SQL: `UPDATE "schedules" SET ... WHERE "schedules"."id" = ? RETURNING *`
   */
  async update(id: number | string, data: any): Promise<InferSelectModel<typeof schedulesTable>> {
    try {
      // Assuming the primary key column is named 'id'
      const primaryKeyColumn = this.table.id as any;

      const [result] = await this.db.update(this.table)
        .set(data as any)
        .where(eq(primaryKeyColumn, id))
        .returning();

      return result;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to update record with id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to update record with id: ${id}`, error);
      }
    }
  }

  /**
   * Delete a record by its primary key
   * @param id The primary key value
   * @returns Promise resolving to a boolean indicating if the record was deleted
   *
   * SQL: `DELETE FROM "schedules" WHERE "schedules"."id" = ?`
   */
  async delete(id: number | string): Promise<boolean> {
    try {
      // Assuming the primary key column is named 'id'
      const primaryKeyColumn = this.table.id as any;

      const result = await this.db.delete(this.table)
        .where(eq(primaryKeyColumn, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to delete record with id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to delete record with id: ${id}`, error);
      }
    }
  }

  /**
   * Bulk write streams (create, update, delete) in a single batch operation
   *
   * This method combines stream creation, updates, and deletions into a single batch operation
   * for improved performance and atomicity. It uses the helper methods getStreamCreateOps,
   * getStreamUpdateOps, and getStreamDeleteOps to generate the database operations.
   *
   * @param writes Object containing scheduleId, streams to create, update, and delete
   * @returns Promise resolving when the operation is complete
   */
  async bulkWriteStreams(writes: {
    scheduleId: number,
    createStreams: InferInsertModel<typeof streamsTable>[],
    updateStreams: Array<{ id: number } & Partial<InferInsertModel<typeof streamsTable>>>,
    deleteStreams: number[],
  }): Promise<void> {
    try {
      const {scheduleId, createStreams, updateStreams, deleteStreams} = writes;

      // Collect all operations using the helper methods
      const operations: BatchItem<'sqlite'>[] = [
        ...this.getStreamCreateOps(scheduleId, createStreams),
        ...this.getStreamUpdateOps(scheduleId, updateStreams),
        ...this.getStreamDeleteOps(scheduleId, deleteStreams)
      ];

      // Execute all operations in a single batch
      await this.executeBatch(operations);
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to bulk write streams", error).toActionError();
      } else {
        throw new DatabaseError("Failed to bulk write streams", error);
      }
    }
  }

  /**
   * Generates database operations for creating streams
   *
   * This function takes an array of stream objects to create and generates the corresponding
   * database operations. It handles date conversion from ISO strings to Date objects and
   * ensures the correct scheduleId is set for each stream.
   *
   * @param scheduleId The ID of the schedule these streams belong to
   * @param createStreams Array of stream objects to create
   * @returns Array of database operations for batch execution
   */
  private getStreamCreateOps(scheduleId: number, createStreams: InferInsertModel<typeof streamsTable>[]): BatchItem<'sqlite'>[] {
    const operations: BatchItem<'sqlite'>[] = [];

    // Process stream creations
    for (const stream of createStreams) {
      // Process dates if they are strings
      const processedData = {
        ...stream,
        scheduleId, // Ensure scheduleId is set correctly
        start: stream.start instanceof Date ? stream.start : DateTime.fromISO(stream.start as unknown as string).toUTC().toJSDate(),
        end: stream.end instanceof Date ? stream.end : DateTime.fromISO(stream.end as unknown as string).toUTC().toJSDate()
      };

      operations.push(
        this.db.insert(streamsTable).values(processedData)
      );
    }
    return operations;
  }

  /**
   * Generates database operations for updating streams
   *
   * This function takes an array of stream objects to update and generates the corresponding
   * database operations. It handles date conversion from ISO strings to Date objects and
   * ensures updates are applied only to streams with the correct scheduleId.
   *
   * @param scheduleId The ID of the schedule these streams belong to
   * @param updateStreams Array of stream objects with ID and fields to update
   * @returns Array of database operations for batch execution
   */
  private getStreamUpdateOps(scheduleId: number, updateStreams: Array<{ id: number } & Partial<InferInsertModel<typeof streamsTable>>>): BatchItem<'sqlite'>[] {
    const operations: BatchItem<'sqlite'>[] = [];

    // Process stream updates
    for (const stream of updateStreams) {
      const {id, ...updateData} = stream;

      // Process dates if they are strings
      const processedData: any = {...updateData};
      if (updateData.start && !(updateData.start instanceof Date)) {
        processedData.start = DateTime.fromISO(updateData.start as unknown as string).toUTC().toJSDate();
      }
      if (updateData.end && !(updateData.end instanceof Date)) {
        processedData.end = DateTime.fromISO(updateData.end as unknown as string).toUTC().toJSDate();
      }

      operations.push(
        this.db.update(streamsTable)
          .set(processedData)
          .where(and(
            eq(streamsTable.id, id),
            eq(streamsTable.scheduleId, scheduleId)
          ))
      );
    }
    return operations;
  }

  /**
   * Generates database operations for deleting streams
   *
   * This function takes an array of stream IDs to delete and generates the corresponding
   * database operations. It ensures deletions are applied only to streams with the correct
   * scheduleId to prevent accidental deletion of streams from other schedules.
   *
   * @param scheduleId The ID of the schedule these streams belong to
   * @param deleteStreams Array of stream IDs to delete
   * @returns Array of database operations for batch execution
   */
  private getStreamDeleteOps(scheduleId: number, deleteStreams: number[]): BatchItem<'sqlite'>[] {
    const operations: BatchItem<'sqlite'>[] = [];

    // Process stream deletions
    for (const streamId of deleteStreams) {
      operations.push(
        this.db.delete(streamsTable)
          .where(and(
            eq(streamsTable.id, streamId),
            eq(streamsTable.scheduleId, scheduleId)
          ))
      );
    }
    return operations;
  }

  // endregion

  // region Stream Operations

  /**
   * Find streams by schedule ID with their tags and participants
   * @param scheduleId The schedule ID
   * @returns Promise resolving to an array of streams with their tags and participants
   *
   * SQL:
   * 1. `SELECT * FROM "streams" WHERE "streams"."scheduleId" = ?`
   * 2. `SELECT * FROM "streamTags" WHERE "streamTags"."scheduleId" = ?`
   * 3. `SELECT * FROM "streamParticipants" WHERE "streamParticipants"."scheduleId" = ?`
   */
  async findStreamsWithDetails(scheduleId: number): Promise<Array<InferSelectModel<typeof streamsTable> & {
    tags: InferSelectModel<typeof streamTagsTable>[],
    participants: InferSelectModel<typeof streamParticipantsTable>[]
  }>> {
    try {

      // Get all streams for the schedule in one query
      const streams = await this.db.select()
        .from(streamsTable)
        .where(eq(streamsTable.scheduleId, scheduleId))
        .all();

      // Get all tags for all streams in the schedule in one query
      const allTags = await this.db.select()
        .from(streamTagsTable)
        .where(eq(streamTagsTable.scheduleId, scheduleId))
        .all();

      // Get all participants for all streams in the schedule in one query
      const allParticipants = await this.db.select()
        .from(streamParticipantsTable)
        .where(eq(streamParticipantsTable.scheduleId, scheduleId))
        .all();

      // Organize tags and participants by streamId for efficient lookup
      const tagsByStreamId: Record<number, InferSelectModel<typeof streamTagsTable>[]> = {};
      const participantsByStreamId: Record<number, InferSelectModel<typeof streamParticipantsTable>[]> = {};

      // Group tags by streamId
      for (const tag of allTags) {
        if (!tagsByStreamId[tag.streamId]) {
          tagsByStreamId[tag.streamId] = [];
        }
        tagsByStreamId[tag.streamId].push(tag);
      }

      // Group participants by streamId
      for (const participant of allParticipants) {
        if (!participantsByStreamId[participant.streamId]) {
          participantsByStreamId[participant.streamId] = [];
        }
        participantsByStreamId[participant.streamId].push(participant);
      }

      // Combine streams with their tags and participants
      const result = streams.map(stream => ({
        ...stream,
        tags: tagsByStreamId[stream.id] || [],
        participants: participantsByStreamId[stream.id] || []
      }));

      return result;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find streams with details for schedule ID: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find streams with details for schedule ID: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Find streams by schedule ID
   * @param scheduleId The schedule ID
   * @returns Promise resolving to an array of streams
   *
   * SQL: `SELECT * FROM "streams" WHERE "streams"."scheduleId" = ?`
   */
  async findStreamsByScheduleId(scheduleId: number): Promise<InferSelectModel<typeof streamsTable>[]> {
    try {
      return await this.db.select()
        .from(streamsTable)
        .where(eq(streamsTable.scheduleId, scheduleId))
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find streams by schedule ID: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find streams by schedule ID: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Find a stream by its ID and schedule ID
   * @param streamId The stream ID
   * @param scheduleId The schedule ID
   * @returns Promise resolving to the stream or null if not found
   *
   * SQL: `SELECT * FROM "streams" WHERE ("streams"."id" = ? AND "streams"."scheduleId" = ?)`
   */
  async findStreamById(streamId: number, scheduleId: number): Promise<InferSelectModel<typeof streamsTable> | null> {
    try {
      const result = await this.db.select()
        .from(streamsTable)
        .where(and(
          eq(streamsTable.id, streamId),
          eq(streamsTable.scheduleId, scheduleId)
        ))
        .get();

      return result || null;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find stream by ID: ${streamId} in schedule: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find stream by ID: ${streamId} in schedule: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Create a new stream
   * @param data The stream data to insert
   * @returns Promise resolving to the created stream
   *
   * SQL: `INSERT INTO "streams" (...) VALUES (...) RETURNING *`
   */
  async createStream(data: InferInsertModel<typeof streamsTable>): Promise<InferSelectModel<typeof streamsTable>> {
    try {
      // Convert date strings to Date objects if needed
      const processedData = {
        ...data,
        start: data.start instanceof Date ? data.start : DateTime.fromISO(data.start as unknown as string).toUTC().toJSDate(),
        end: data.end instanceof Date ? data.end : DateTime.fromISO(data.end as unknown as string).toUTC().toJSDate()
      };

      const [result] = await this.db.insert(streamsTable)
        .values(processedData)
        .returning();

      return result;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to create stream for schedule: ${data.scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to create stream for schedule: ${data.scheduleId}`, error);
      }
    }
  }

  /**
   * Update a stream
   * @param streamId The stream ID
   * @param scheduleId The schedule ID
   * @param data The data to update
   * @returns Promise resolving to the updated stream
   *
   * SQL: `UPDATE "streams" SET ... WHERE ("streams"."id" = ? AND "streams"."scheduleId" = ?) RETURNING *`
   */
  async updateStream(streamId: number, scheduleId: number, data: Partial<InferInsertModel<typeof streamsTable>>): Promise<InferSelectModel<typeof streamsTable>> {
    try {
      // Process dates if they are strings
      const processedData: any = {...data};
      if (data.start && !(data.start instanceof Date)) {
        processedData.start = DateTime.fromISO(data.start as unknown as string).toUTC().toJSDate();
      }
      if (data.end && !(data.end instanceof Date)) {
        processedData.end = DateTime.fromISO(data.end as unknown as string).toUTC().toJSDate();
      }

      const [result] = await this.db.update(streamsTable)
        .set(processedData)
        .where(and(
          eq(streamsTable.id, streamId),
          eq(streamsTable.scheduleId, scheduleId)
        ))
        .returning();

      return result;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to update stream with ID: ${streamId} in schedule: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to update stream with ID: ${streamId} in schedule: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Delete a stream
   * @param streamId The stream ID
   * @param scheduleId The schedule ID
   * @returns Promise resolving to a boolean indicating if the stream was deleted
   *
   * SQL: `DELETE FROM "streams" WHERE ("streams"."id" = ? AND "streams"."scheduleId" = ?) RETURNING *`
   */
  async deleteStream(streamId: number, scheduleId: number): Promise<boolean> {
    try {
      const result = await this.db.delete(streamsTable)
        .where(and(
          eq(streamsTable.id, streamId),
          eq(streamsTable.scheduleId, scheduleId)
        ))
        .returning();

      return result.length > 0;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to delete stream with ID: ${streamId} in schedule: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to delete stream with ID: ${streamId} in schedule: ${scheduleId}`, error);
      }
    }
  }

  // endregion

  // region Stream Tag Operations

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
      return await this.db.select()
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
  async bulkAddStreamTags(tags: Array<{
    streamId: number,
    scheduleId: number,
    tag: string,
    label?: string
  }>): Promise<void> {
    try {
      if (tags.length === 0) return;

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
  async bulkRemoveStreamTags(tags: Array<{ streamId: number, scheduleId: number, tag: string }>): Promise<void> {
    try {
      if (tags.length === 0) return;

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
    createTags: Array<{ streamId: number, tag: string, label?: string }>,
    deleteTags: Array<{ streamId: number, tag: string }>,
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
  private getTagCreateOps(scheduleId: number, createTags: Array<{ streamId: number, tag: string, label?: string }>): BatchItem<'sqlite'>[] {
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
  private getTagDeleteOps(scheduleId: number, deleteTags: Array<{ streamId: number, tag: string }>): BatchItem<'sqlite'>[] {
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

  // endregion

  // region Stream Participant Operations

  /**
   * Find participants for a stream
   * @param streamId The stream ID
   * @param scheduleId The schedule ID
   * @returns Promise resolving to an array of stream participants
   *
   * SQL: `SELECT * FROM "streamParticipants" WHERE ("streamParticipants"."streamId" = ? AND "streamParticipants"."scheduleId" = ?)`
   */
  async findStreamParticipants(streamId: number, scheduleId: number): Promise<InferSelectModel<typeof streamParticipantsTable>[]> {
    try {
      return await this.db.select()
        .from(streamParticipantsTable)
        .where(and(
          eq(streamParticipantsTable.streamId, streamId),
          eq(streamParticipantsTable.scheduleId, scheduleId)
        ))
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find participants for stream: ${streamId} in schedule: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find participants for stream: ${streamId} in schedule: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Add a participant to a stream
   * @param streamId The stream ID
   * @param scheduleId The schedule ID
   * @param userId The user ID to add as a participant
   * @returns Promise resolving to the created participant
   *
   * SQL: `INSERT INTO "streamParticipants" ("streamId", "scheduleId", "userId") VALUES (?, ?, ?) RETURNING *`
   */
  async addStreamParticipant(streamId: number, scheduleId: number, userId: number): Promise<InferSelectModel<typeof streamParticipantsTable>> {
    try {
      const [result] = await this.db.insert(streamParticipantsTable)
        .values({
          streamId,
          scheduleId,
          userId
        })
        .returning();

      return result;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to add participant: ${userId} to stream: ${streamId} in schedule: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to add participant: ${userId} to stream: ${streamId} in schedule: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Remove a participant from a stream
   * @param streamId The stream ID
   * @param scheduleId The schedule ID
   * @param userId The user ID to remove as a participant
   * @returns Promise resolving to a boolean indicating if the participant was removed
   *
   * SQL: `DELETE FROM "streamParticipants" WHERE ("streamParticipants"."streamId" = ? AND "streamParticipants"."scheduleId" = ? AND "streamParticipants"."userId" = ?) RETURNING *`
   */
  async removeStreamParticipant(streamId: number, scheduleId: number, userId: number): Promise<boolean> {
    try {
      const result = await this.db.delete(streamParticipantsTable)
        .where(and(
          eq(streamParticipantsTable.streamId, streamId),
          eq(streamParticipantsTable.scheduleId, scheduleId),
          eq(streamParticipantsTable.userId, userId)
        ))
        .returning();

      return result.length > 0;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to remove participant: ${userId} from stream: ${streamId} in schedule: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to remove participant: ${userId} from stream: ${streamId} in schedule: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Add multiple participants to streams in a single batch operation
   * @param participants Array of participant objects with streamId, scheduleId, and userId
   * @returns Promise resolving when the operation is complete
   */
  async bulkAddStreamParticipants(participants: Array<{
    streamId: number,
    scheduleId: number,
    userId: number
  }>): Promise<void> {
    try {
      if (participants.length === 0) return;

      const operations: BatchItem<'sqlite'>[] = participants.map(participant => {
        return this.db.insert(streamParticipantsTable)
          .values({
            streamId: participant.streamId,
            scheduleId: participant.scheduleId,
            userId: participant.userId
          });
      });

      await this.executeBatch(operations);
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to bulk add stream participants", error).toActionError();
      } else {
        throw new DatabaseError("Failed to bulk add stream participants", error);
      }
    }
  }

  /**
   * Remove multiple participants from streams in a single batch operation
   * @param participants Array of participant objects with streamId, scheduleId, and userId
   * @returns Promise resolving when the operation is complete
   */
  async bulkRemoveStreamParticipants(participants: Array<{
    streamId: number,
    scheduleId: number,
    userId: number
  }>): Promise<void> {
    try {
      if (participants.length === 0) return;

      const operations: BatchItem<'sqlite'>[] = participants.map(participant => {
        return this.db.delete(streamParticipantsTable)
          .where(and(
            eq(streamParticipantsTable.streamId, participant.streamId),
            eq(streamParticipantsTable.scheduleId, participant.scheduleId),
            eq(streamParticipantsTable.userId, participant.userId)
          ));
      });

      await this.executeBatch(operations);
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to bulk remove stream participants", error).toActionError();
      } else {
        throw new DatabaseError("Failed to bulk remove stream participants", error);
      }
    }
  }

  /**
   * Bulk write participants (create, delete) in a single batch operation
   *
   * This method combines participant creation and deletion into a single batch operation
   * for improved performance and atomicity. It uses the helper methods getParticipantCreateOps
   * and getParticipantDeleteOps to generate the database operations.
   *
   * @param writes Object containing scheduleId, participants to create and delete
   * @returns Promise resolving when the operation is complete
   */
  async bulkWriteParticipants(writes: {
    scheduleId: number,
    createParticipants: Array<{ streamId: number, userId: number }>,
    deleteParticipants: Array<{ streamId: number, userId: number }>,
  }): Promise<void> {
    try {
      const {scheduleId, createParticipants, deleteParticipants} = writes;

      // Collect all operations using the helper methods
      const operations: BatchItem<'sqlite'>[] = [
        ...this.getParticipantCreateOps(scheduleId, createParticipants),
        ...this.getParticipantDeleteOps(scheduleId, deleteParticipants)
      ];

      // Execute all operations in a single batch
      await this.executeBatch(operations);
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to bulk write participants", error).toActionError();
      } else {
        throw new DatabaseError("Failed to bulk write participants", error);
      }
    }
  }

  /**
   * Generates database operations for creating participants
   *
   * This function takes an array of participant objects to create and generates the corresponding
   * database operations. It ensures the correct scheduleId is set for each participant.
   *
   * @param scheduleId The ID of the schedule these participants belong to
   * @param createParticipants Array of participant objects to create
   * @returns Array of database operations for batch execution
   */
  private getParticipantCreateOps(scheduleId: number, createParticipants: Array<{ streamId: number, userId: number }>): BatchItem<'sqlite'>[] {
    const operations: BatchItem<'sqlite'>[] = [];

    // Process participant creations
    for (const participant of createParticipants) {
      operations.push(
        this.db.insert(streamParticipantsTable)
          .values({
            streamId: participant.streamId,
            scheduleId,
            userId: participant.userId
          })
      );
    }
    return operations;
  }

  /**
   * Generates database operations for deleting participants
   *
   * This function takes an array of participant objects to delete and generates the corresponding
   * database operations. It ensures deletions are applied only to participants with the correct
   * scheduleId, streamId, and userId.
   *
   * @param scheduleId The ID of the schedule these participants belong to
   * @param deleteParticipants Array of participant objects to delete
   * @returns Array of database operations for batch execution
   */
  private getParticipantDeleteOps(scheduleId: number, deleteParticipants: Array<{ streamId: number, userId: number }>): BatchItem<'sqlite'>[] {
    const operations: BatchItem<'sqlite'>[] = [];

    // Process participant deletions
    for (const participant of deleteParticipants) {
      operations.push(
        this.db.delete(streamParticipantsTable)
          .where(and(
            eq(streamParticipantsTable.streamId, participant.streamId),
            eq(streamParticipantsTable.scheduleId, scheduleId),
            eq(streamParticipantsTable.userId, participant.userId)
          ))
      );
    }
    return operations;
  }

  // endregion


  /**
   * Updates a schedule with all related streams, participants, and tags in a single batch operation
   *
   * This function handles multiple database operations in a single atomic batch:
   * - Creating new streams
   * - Updating existing streams
   * - Deleting streams
   * - Adding participants to streams
   * - Removing participants from streams
   * - Adding tags to streams
   * - Removing tags from streams
   *
   * Using a batch operation ensures that all changes are applied together or not at all,
   * maintaining database consistency.
   *
   * @param data Object containing all the changes to apply:
   *   - scheduleId: The ID of the schedule being updated
   *   - streams: Object containing streams to create, update, and delete
   *   - participants: Object containing participants to add and remove
   *   - tags: Object containing tags to add and remove
   * @returns Promise resolving when the operation is complete
   */
  async updateSchedule(data: {
    scheduleId: number;
    streams: {
      creates: InferInsertModel<typeof streamsTable>[],
      updates: Array<{ id: number } & Partial<InferInsertModel<typeof streamsTable>>>,
      deletes: number[],
    }
    participants: {
      creates: Array<{ streamId: number, userId: number }>;
      deletes: Array<{ streamId: number, userId: number }>;
    },
    tags: {
      creates: Array<{ streamId: number, tag: string, label: string }>;
      deletes: Array<{ streamId: number, tag: string }>;
    }
  }): Promise<void> {
    try {
      const { scheduleId, streams, participants, tags } = data;

      // Collect all operations using the helper methods
      const operations: BatchItem<'sqlite'>[] = [
        // Stream operations
        ...this.getStreamCreateOps(scheduleId, streams.creates),
        ...this.getStreamUpdateOps(scheduleId, streams.updates),
        ...this.getStreamDeleteOps(scheduleId, streams.deletes),

        // Participant operations
        ...this.getParticipantCreateOps(scheduleId, participants.creates),
        ...this.getParticipantDeleteOps(scheduleId, participants.deletes),

        // Tag operations
        ...this.getTagCreateOps(scheduleId, tags.creates),
        ...this.getTagDeleteOps(scheduleId, tags.deletes)
      ];

      // Execute all operations in a single batch
      await this.executeBatch(operations);
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to update schedule", error).toActionError();
      } else {
        throw new DatabaseError("Failed to update schedule", error);
      }
    }
  }




}
