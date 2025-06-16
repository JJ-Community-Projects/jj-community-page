import {Repo, type RepoEnv} from "./Repo.ts";
import {streamParticipantsTable, streamsTable, streamTagsTable} from "../schema/schema.ts";
import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import {and, eq, type InferInsertModel, type InferSelectModel} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError.ts";
import {DateTime} from "luxon";
import type {BatchItem} from "drizzle-orm/batch";
import type {ActionAPIContext} from "astro:actions";
import {type DetailedStream} from "./ScheduleRepo.ts";

export class StreamRepo extends Repo<typeof streamsTable._['config']> {
  constructor(db: DrizzleD1Database, env: RepoEnv) {
    super(db, streamsTable, env);
  }

  static action(ctx: ActionAPIContext) {
    return new StreamRepo(drizzle(ctx.locals.runtime.env.DB), 'action')
  }

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
  async findStreamsWithDetails(scheduleId: number): Promise<DetailedStream[]> {
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

  async bulkWriteStreams(writes: {
    scheduleId: number,
    createStreams?: InferInsertModel<typeof streamsTable>[],
    updateStreams?: Array<{ id: number } & Partial<InferInsertModel<typeof streamsTable>>>,
    deleteStreams?: number[],
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
  getStreamCreateOps(scheduleId: number, createStreams?: InferInsertModel<typeof streamsTable>[]): BatchItem<'sqlite'>[] {
    if (!createStreams) return [];

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
  getStreamUpdateOps(scheduleId: number, updateStreams?: Array<{
    id: number
  } & Partial<InferInsertModel<typeof streamsTable>>>): BatchItem<'sqlite'>[] {
    if (!updateStreams) return [];

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
  getStreamDeleteOps(scheduleId: number, deleteStreams?: number[]): BatchItem<'sqlite'>[] {
    if (!deleteStreams) return [];

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

  getStreamOperations(scheduleId: number, streams?: {
    creates?: InferInsertModel<typeof streamsTable>[];
    updates?: Array<{ id: number } & Partial<InferInsertModel<typeof streamsTable>>>;
    deletes?: number[];
  }): BatchItem<'sqlite'>[] {
    return [
      ...this.getStreamCreateOps(scheduleId, streams?.creates),
      ...this.getStreamUpdateOps(scheduleId, streams?.updates),
      ...this.getStreamDeleteOps(scheduleId, streams?.deletes)
    ];
  }
}
