// src/lib/db/newRepos/schedule/sections/StreamTagSection.ts
import { and, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { BaseSection } from "../../base/BaseSection";
import type {RepoEnv} from "../../../../db/RepoEnv";
import { streamTagsTable } from "../../../schema/jj-schema";
import type { StreamTag, StreamTagInsert } from "../../../types/schedule";
import { NotFoundError } from "../../../../db/errors";

/**
 * Section for stream tag table operations
 */
export class StreamTagSection extends BaseSection<StreamTag, StreamTagInsert> {
  /**
   * Creates a new StreamTagSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a stream tag by its primary key (scheduleId, streamId, tag)
   * @param scheduleId - The ID of the schedule
   * @param streamId - The ID of the stream
   * @param tag - The tag value
   * @returns The stream tag or undefined if not found
   */
  async findById(scheduleId: number, streamId: number, tag: string): Promise<StreamTag | undefined> {
    try {
      return this.db.select()
        .from(streamTagsTable)
        .where(and(
          eq(streamTagsTable.scheduleId, scheduleId),
          eq(streamTagsTable.streamId, streamId),
          eq(streamTagsTable.tag, tag)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find stream tag: ${tag} for stream: ${streamId} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds all stream tags
   * @returns An array of stream tags
   */
  async findAll(): Promise<StreamTag[]> {
    try {
      return await this.db.select()
        .from(streamTagsTable)
        .all();
    } catch (error) {
      this.handleError("Failed to find all stream tags", error);
    }
  }

  /**
   * Creates a new stream tag
   * @param data - The data for the new stream tag
   * @returns The created stream tag
   */
  async create(data: StreamTagInsert): Promise<StreamTag> {
    try {
      const [streamTag] = await this.db.insert(streamTagsTable)
        .values(data)
        .returning();
      return streamTag as StreamTag;
    } catch (error) {
      this.handleError("Failed to create stream tag", error);
    }
  }

  /**
   * Updates a stream tag
   * @param scheduleId - The ID of the schedule
   * @param streamId - The ID of the stream
   * @param tag - The tag value
   * @param data - The data to update
   * @returns The updated stream tag
   */
  async update(
    scheduleId: number,
    streamId: number,
    tag: string,
    data: Partial<StreamTagInsert>
  ): Promise<StreamTag> {
    try {
      const [streamTag] = await this.db.update(streamTagsTable)
        .set(data)
        .where(and(
          eq(streamTagsTable.scheduleId, scheduleId),
          eq(streamTagsTable.streamId, streamId),
          eq(streamTagsTable.tag, tag)
        ))
        .returning();

      if (!streamTag) {
        throw new NotFoundError(`Stream tag: ${tag} for stream: ${streamId} in schedule: ${scheduleId} not found`);
      }

      return streamTag as StreamTag;
    } catch (error) {
      this.handleError(`Failed to update stream tag: ${tag} for stream: ${streamId} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Deletes a stream tag
   * @param scheduleId - The ID of the schedule
   * @param streamId - The ID of the stream
   * @param tag - The tag value
   */
  async delete(scheduleId: number, streamId: number, tag: string): Promise<void> {
    try {
      const result = await this.db.delete(streamTagsTable)
        .where(and(
          eq(streamTagsTable.scheduleId, scheduleId),
          eq(streamTagsTable.streamId, streamId),
          eq(streamTagsTable.tag, tag)
        ))
        .returning({ tag: streamTagsTable.tag });

      if (result.length === 0) {
        throw new NotFoundError(`Stream tag: ${tag} for stream: ${streamId} in schedule: ${scheduleId} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete stream tag: ${tag} for stream: ${streamId} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds stream tags by stream ID
   * @param scheduleId - The ID of the schedule
   * @param streamId - The ID of the stream
   * @returns An array of stream tags
   */
  async findByStreamId(scheduleId: number, streamId: number): Promise<StreamTag[]> {
    try {
      return this.db.select()
        .from(streamTagsTable)
        .where(and(
          eq(streamTagsTable.scheduleId, scheduleId),
          eq(streamTagsTable.streamId, streamId)
        ))
        .all();
    } catch (error) {
      this.handleError(`Failed to find stream tags for stream: ${streamId} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds all stream tags for a schedule
   * @param scheduleId - The ID of the schedule
   * @returns An array of stream tags
   */
  async findAllBySchedule(scheduleId: number): Promise<StreamTag[]> {
    try {
      return this.db.select()
        .from(streamTagsTable)
        .where(eq(streamTagsTable.scheduleId, scheduleId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find all stream tags for schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Deletes a stream tag by stream ID and tag
   * @param scheduleId - The ID of the schedule
   * @param streamId - The ID of the stream
   * @param tag - The tag value
   */
  async deleteByStreamAndTag(scheduleId: number, streamId: number, tag: string): Promise<void> {
    try {
      await this.db.delete(streamTagsTable)
        .where(and(
          eq(streamTagsTable.scheduleId, scheduleId),
          eq(streamTagsTable.streamId, streamId),
          eq(streamTagsTable.tag, tag)
        ))
        .execute();
    } catch (error) {
      this.handleError(`Failed to delete stream tag: ${tag} for stream: ${streamId} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Creates multiple stream tags in a batch
   * @param tags - The stream tags to create
   * @returns The batch operations
   */
  createBatch(tags: StreamTagInsert[]): BatchItem<'sqlite'>[] {
    return tags.map(tag =>
      this.db.insert(streamTagsTable).values(tag)
    );
  }

  /**
   * Deletes multiple stream tags in a batch
   * @param tags - The stream tags to delete with their scheduleId, streamId, and tag
   * @returns The batch operations
   */
  deleteBatch(tags: Array<{ scheduleId: number, streamId: number, tag: string }>): BatchItem<'sqlite'>[] {
    return tags.map(({ scheduleId, streamId, tag }) =>
      this.db.delete(streamTagsTable)
        .where(and(
          eq(streamTagsTable.scheduleId, scheduleId),
          eq(streamTagsTable.streamId, streamId),
          eq(streamTagsTable.tag, tag)
        ))
    );
  }
}
