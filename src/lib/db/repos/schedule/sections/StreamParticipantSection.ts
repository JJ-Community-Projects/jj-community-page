// src/lib/db/newRepos/schedule/sections/StreamParticipantSection.ts
import { and, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { BaseSection } from "../../base/BaseSection";
import type {RepoEnv} from "../../../../db/RepoEnv";
import { streamParticipantsTable } from "../../../schema/jj-schema";
import { streamParticipantsDisplayView } from "../../../schema/views-schema";
import type {
  StreamParticipant,
  StreamParticipantInsert,
  StreamParticipantDisplay
} from "../../../types/schedule";
import { NotFoundError } from "../../../../db/errors";

/**
 * Section for stream participant table operations
 */
export class StreamParticipantSection extends BaseSection<StreamParticipant, StreamParticipantInsert> {
  /**
   * Creates a new StreamParticipantSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a stream participant by its primary key (scheduleId, streamId, userId)
   * @param scheduleId - The ID of the schedule
   * @param streamId - The ID of the stream
   * @param userId - The ID of the user
   * @returns The stream participant or undefined if not found
   */
  async findById(scheduleId: number, streamId: number, userId: number): Promise<StreamParticipant | undefined> {
    try {
      return this.db.select()
        .from(streamParticipantsTable)
        .where(and(
          eq(streamParticipantsTable.scheduleId, scheduleId),
          eq(streamParticipantsTable.streamId, streamId),
          eq(streamParticipantsTable.userId, userId)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find stream participant for user: ${userId} in stream: ${streamId}, schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds all stream participants
   * @returns An array of stream participants
   */
  async findAll(): Promise<StreamParticipant[]> {
    try {
      return await this.db.select()
        .from(streamParticipantsTable)
        .all();
    } catch (error) {
      this.handleError("Failed to find all stream participants", error);
    }
  }

  /**
   * Creates a new stream participant
   * @param data - The data for the new stream participant
   * @returns The created stream participant
   */
  async create(data: StreamParticipantInsert): Promise<StreamParticipant> {
    try {
      const [participant] = await this.db.insert(streamParticipantsTable)
        .values(data)
        .returning();
      return participant as StreamParticipant;
    } catch (error) {
      this.handleError("Failed to create stream participant", error);
    }
  }

  /**
   * Updates a stream participant
   * @param scheduleId - The ID of the schedule
   * @param streamId - The ID of the stream
   * @param userId - The ID of the user
   * @param data - The data to update
   * @returns The updated stream participant
   */
  async update(
    scheduleId: number,
    streamId: number,
    userId: number,
    data: Partial<StreamParticipantInsert>
  ): Promise<StreamParticipant> {
    try {
      const [participant] = await this.db.update(streamParticipantsTable)
        .set(data)
        .where(and(
          eq(streamParticipantsTable.scheduleId, scheduleId),
          eq(streamParticipantsTable.streamId, streamId),
          eq(streamParticipantsTable.userId, userId)
        ))
        .returning();

      if (!participant) {
        throw new NotFoundError(`Stream participant for user: ${userId} in stream: ${streamId}, schedule: ${scheduleId} not found`);
      }

      return participant as StreamParticipant;
    } catch (error) {
      this.handleError(`Failed to update stream participant for user: ${userId} in stream: ${streamId}, schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Deletes a stream participant
   * @param scheduleId - The ID of the schedule
   * @param streamId - The ID of the stream
   * @param userId - The ID of the user
   */
  async delete(scheduleId: number, streamId: number, userId: number): Promise<void> {
    try {
      const result = await this.db.delete(streamParticipantsTable)
        .where(and(
          eq(streamParticipantsTable.scheduleId, scheduleId),
          eq(streamParticipantsTable.streamId, streamId),
          eq(streamParticipantsTable.userId, userId)
        ))
        .returning({ userId: streamParticipantsTable.userId });

      if (result.length === 0) {
        throw new NotFoundError(`Stream participant for user: ${userId} in stream: ${streamId}, schedule: ${scheduleId} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete stream participant for user: ${userId} in stream: ${streamId}, schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds stream participants by stream ID
   * @param scheduleId - The ID of the schedule
   * @param streamId - The ID of the stream
   * @returns An array of stream participants
   */
  async findByStreamId(scheduleId: number, streamId: number): Promise<StreamParticipant[]> {
    try {
      return this.db.select()
        .from(streamParticipantsTable)
        .where(and(
          eq(streamParticipantsTable.scheduleId, scheduleId),
          eq(streamParticipantsTable.streamId, streamId)
        ))
        .all();
    } catch (error) {
      this.handleError(`Failed to find stream participants for stream: ${streamId} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds stream participants by user ID
   * @param userId - The ID of the user
   * @returns An array of stream participants
   */
  async findByUserId(userId: number): Promise<StreamParticipant[]> {
    try {
      return this.db.select()
        .from(streamParticipantsTable)
        .where(eq(streamParticipantsTable.userId, userId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find stream participants for user: ${userId}`, error);
    }
  }

  /**
   * Finds stream participants by user ID and schedule ID
   * @param userId - The ID of the user
   * @param scheduleId - The ID of the schedule
   * @returns An array of stream participants
   */
  async findByUserAndSchedule(userId: number, scheduleId: number): Promise<StreamParticipant[]> {
    try {
      return this.db.select()
        .from(streamParticipantsTable)
        .where(and(
          eq(streamParticipantsTable.userId, userId),
          eq(streamParticipantsTable.scheduleId, scheduleId)
        ))
        .all();
    } catch (error) {
      this.handleError(`Failed to find stream participants for user: ${userId} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Checks if a user is a participant in a stream
   * @param scheduleId - The ID of the schedule
   * @param streamId - The ID of the stream
   * @param userId - The ID of the user
   * @returns True if the user is a participant
   */
  async isParticipant(scheduleId: number, streamId: number, userId: number): Promise<boolean> {
    try {
      const participant = await this.findById(scheduleId, streamId, userId);
      return !!participant;
    } catch (error) {
      this.handleError(`Failed to check if user: ${userId} is a participant in stream: ${streamId}, schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Deletes a stream participant by stream ID and user ID
   * @param scheduleId - The ID of the schedule
   * @param streamId - The ID of the stream
   * @param userId - The ID of the user
   */
  async deleteByStreamAndUser(scheduleId: number, streamId: number, userId: number): Promise<void> {
    try {
      await this.db.delete(streamParticipantsTable)
        .where(and(
          eq(streamParticipantsTable.scheduleId, scheduleId),
          eq(streamParticipantsTable.streamId, streamId),
          eq(streamParticipantsTable.userId, userId)
        ))
        .execute();
    } catch (error) {
      this.handleError(`Failed to delete stream participant for user: ${userId} in stream: ${streamId}, schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds all stream participants with display information for a schedule
   * @param scheduleId - The ID of the schedule
   * @returns An array of stream participants with display information
   */
  async findAllStreamParticipantDisplayBySchedule(scheduleId: number): Promise<StreamParticipantDisplay[]> {
    try {
      return this.db.select()
        .from(streamParticipantsDisplayView)
        .where(eq(streamParticipantsDisplayView.scheduleId, scheduleId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find all stream participants with display info for schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds stream participants with display information by stream ID
   * @param scheduleId - The ID of the schedule
   * @param streamId - The ID of the stream
   * @returns An array of stream participants with display information
   */
  async findStreamParticipantDisplayByStreamId(scheduleId: number, streamId: number): Promise<StreamParticipantDisplay[]> {
    try {
      return this.db.select()
        .from(streamParticipantsDisplayView)
        .where(and(
          eq(streamParticipantsDisplayView.scheduleId, scheduleId),
          eq(streamParticipantsDisplayView.streamId, streamId)
        ))
        .all();
    } catch (error) {
      this.handleError(`Failed to find stream participants with display info for stream: ${streamId} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Creates multiple stream participants in a batch
   * @param participants - The stream participants to create
   * @returns The batch operations
   */
  createBatch(participants: StreamParticipantInsert[]): BatchItem<'sqlite'>[] {
    return participants.map(participant =>
      this.db.insert(streamParticipantsTable).values(participant)
    );
  }

  /**
   * Deletes multiple stream participants in a batch
   * @param participants - The stream participants to delete with their scheduleId, streamId, and userId
   * @returns The batch operations
   */
  deleteBatch(participants: Array<{ scheduleId: number, streamId: number, userId: number }>): BatchItem<'sqlite'>[] {
    return participants.map(({ scheduleId, streamId, userId }) =>
      this.db.delete(streamParticipantsTable)
        .where(and(
          eq(streamParticipantsTable.scheduleId, scheduleId),
          eq(streamParticipantsTable.streamId, streamId),
          eq(streamParticipantsTable.userId, userId)
        ))
    );
  }
}
