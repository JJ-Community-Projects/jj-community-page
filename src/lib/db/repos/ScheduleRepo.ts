import {DrizzleD1Database} from "drizzle-orm/d1";
import {Repo} from "./Repo";
import {schedulesTable, streamParticipantsTable, streamsTable, streamTagsTable} from "../schema/schema";
import type {InferInsertModel, InferSelectModel} from "drizzle-orm";
import {and, eq} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError";
import {DateTime} from "luxon";

/**
 * Repository for working with schedules
 */
export class ScheduleRepo extends Repo<typeof schedulesTable._['config']> {
  constructor(db: DrizzleD1Database) {
    super(db, schedulesTable);
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
      throw new DatabaseError(`Failed to find record by id: ${id}`, error);
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
      throw new DatabaseError(`Failed to find schedule by slug: ${slug}`, error);
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
      throw new DatabaseError(`Failed to find schedules by owner ID: ${ownerId}`, error);
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
      throw new DatabaseError("Failed to find visible schedules", error);
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
      throw new DatabaseError("Failed to find all records", error);
    }
  }

  /**
   * Create a new record
   * @param data The data to insert
   * @returns Promise resolving to the created record
   *
   * SQL: `INSERT INTO "schedules" (...) VALUES (...) RETURNING *`
   */
  async create(data: any): Promise<InferSelectModel<typeof schedulesTable>> {
    try {
      const [result] = await this.db.insert(this.table)
        .values(data as any)
        .returning();

      return result;
    } catch (error) {
      throw new DatabaseError("Failed to create record", error);
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
      throw new DatabaseError(`Failed to update record with id: ${id}`, error);
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
      throw new DatabaseError(`Failed to delete record with id: ${id}`, error);
    }
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
      throw new DatabaseError(`Failed to find streams with details for schedule ID: ${scheduleId}`, error);
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
      throw new DatabaseError(`Failed to find streams by schedule ID: ${scheduleId}`, error);
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
      throw new DatabaseError(`Failed to find stream by ID: ${streamId} in schedule: ${scheduleId}`, error);
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
      throw new DatabaseError(`Failed to create stream for schedule: ${data.scheduleId}`, error);
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
      throw new DatabaseError(`Failed to update stream with ID: ${streamId} in schedule: ${scheduleId}`, error);
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
      throw new DatabaseError(`Failed to delete stream with ID: ${streamId} in schedule: ${scheduleId}`, error);
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
      throw new DatabaseError(`Failed to find tags for stream: ${streamId} in schedule: ${scheduleId}`, error);
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
      throw new DatabaseError(`Failed to add tag: ${tag} to stream: ${streamId} in schedule: ${scheduleId}`, error);
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
      throw new DatabaseError(`Failed to remove tag: ${tag} from stream: ${streamId} in schedule: ${scheduleId}`, error);
    }
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
      throw new DatabaseError(`Failed to find participants for stream: ${streamId} in schedule: ${scheduleId}`, error);
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
      throw new DatabaseError(`Failed to add participant: ${userId} to stream: ${streamId} in schedule: ${scheduleId}`, error);
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
      throw new DatabaseError(`Failed to remove participant: ${userId} from stream: ${streamId} in schedule: ${scheduleId}`, error);
    }
  }

  // endregion
}
