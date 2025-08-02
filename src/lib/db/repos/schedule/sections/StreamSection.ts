// src/lib/db/newRepos/schedule/sections/StreamSection.ts
import { and, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { BaseSection } from "../../base/BaseSection";
import type {RepoEnv} from "../../../../db/RepoEnv";
import { streamsTable } from "../../../schema/jj-schema";
import type { Stream, StreamInsert } from "../../../types/schedule";
import { NotFoundError } from "../../../../db/errors";

/**
 * Section for stream table operations
 */
export class StreamSection extends BaseSection<Stream, StreamInsert> {
  /**
   * Creates a new StreamSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a stream by its ID and schedule ID
   * @param scheduleId - The ID of the schedule
   * @param id - The ID of the stream
   * @returns The stream or undefined if not found
   */
  async findById(scheduleId: number, id: number): Promise<Stream | undefined> {
    try {
      return this.db.select()
        .from(streamsTable)
        .where(and(
          eq(streamsTable.scheduleId, scheduleId),
          eq(streamsTable.id, id)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find stream by id: ${id} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds all streams
   * @returns An array of streams
   */
  async findAll(): Promise<Stream[]> {
    try {
      return await this.db.select()
        .from(streamsTable)
        .all();
    } catch (error) {
      this.handleError("Failed to find all streams", error);
    }
  }

  /**
   * Creates a new stream
   * @param data - The data for the new stream
   * @returns The created stream
   */
  async create(data: StreamInsert): Promise<Stream> {
    try {
      const [stream] = await this.db.insert(streamsTable)
        .values(data)
        .returning();
      return stream as Stream;
    } catch (error) {
      this.handleError("Failed to create stream", error);
    }
  }

  /**
   * Updates a stream
   * @param scheduleId - The ID of the schedule
   * @param id - The ID of the stream to update
   * @param data - The data to update
   * @returns The updated stream
   */
  async update(scheduleId: number, id: number, data: Partial<StreamInsert>): Promise<Stream> {
    try {
      const [stream] = await this.db.update(streamsTable)
        .set(data)
        .where(and(
          eq(streamsTable.scheduleId, scheduleId),
          eq(streamsTable.id, id)
        ))
        .returning();

      if (!stream) {
        throw new NotFoundError(`Stream with id ${id} in schedule ${scheduleId} not found`);
      }

      return stream as Stream;
    } catch (error) {
      this.handleError(`Failed to update stream with id: ${id} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Deletes a stream
   * @param scheduleId - The ID of the schedule
   * @param id - The ID of the stream to delete
   */
  async delete(scheduleId: number, id: number): Promise<void> {
    try {
      const result = await this.db.delete(streamsTable)
        .where(and(
          eq(streamsTable.scheduleId, scheduleId),
          eq(streamsTable.id, id)
        ))
        .returning({ id: streamsTable.id });

      if (result.length === 0) {
        throw new NotFoundError(`Stream with id ${id} in schedule ${scheduleId} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete stream with id: ${id} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds streams by schedule ID
   * @param scheduleId - The ID of the schedule
   * @returns An array of streams
   */
  async findByScheduleId(scheduleId: number): Promise<Stream[]> {
    try {
      return this.db.select()
        .from(streamsTable)
        .where(eq(streamsTable.scheduleId, scheduleId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find streams by schedule id: ${scheduleId}`, error);
    }
  }

  /**
   * Gets the next available stream ID for a schedule
   * @param scheduleId - The ID of the schedule
   * @returns The next available stream ID
   */
  async getNextStreamId(scheduleId: number): Promise<number> {
    try {
      const result = await this.db.select({
        maxId: sql<number>`COALESCE(MAX(${streamsTable.id}), 0)`
      })
        .from(streamsTable)
        .where(eq(streamsTable.scheduleId, scheduleId))
        .get();

      return (result?.maxId || 0) + 1;
    } catch (error) {
      this.handleError(`Failed to get next stream id for schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Creates multiple streams in a batch
   * @param streams - The streams to create
   * @returns The batch operations
   */
  createBatch(streams: StreamInsert[]): BatchItem<'sqlite'>[] {
    return streams.map(stream =>
      this.db.insert(streamsTable).values(stream)
    );
  }

  /**
   * Updates multiple streams in a batch
   * @param streams - The streams to update with their IDs and schedule IDs
   * @returns The batch operations
   */
  updateBatch(streams: Array<{ scheduleId: number, id: number } & Partial<StreamInsert>>): BatchItem<'sqlite'>[] {
    return streams.map(({ scheduleId, id, ...data }) =>
      this.db.update(streamsTable)
        .set(data)
        .where(and(
          eq(streamsTable.scheduleId, scheduleId),
          eq(streamsTable.id, id)
        ))
    );
  }

  /**
   * Deletes multiple streams in a batch
   * @param streams - The streams to delete with their IDs and schedule IDs
   * @returns The batch operations
   */
  deleteBatch(streams: Array<{ scheduleId: number, id: number }>): BatchItem<'sqlite'>[] {
    return streams.map(({ scheduleId, id }) =>
      this.db.delete(streamsTable)
        .where(and(
          eq(streamsTable.scheduleId, scheduleId),
          eq(streamsTable.id, id)
        ))
    );
  }
}
