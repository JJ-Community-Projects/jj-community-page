import {Repo, type RepoEnv} from "./Repo.ts";
import {twitchChannelSchema, twitchStreamSchema} from "../schema/twitch-channel-schema.ts";
import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import {and, eq, type InferInsertModel, type InferSelectModel} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError.ts";
import type {ActionAPIContext} from "astro:actions";
import type {BatchItem} from "drizzle-orm/batch";
import {TwitchLiveNotifierQueue} from "../../../queues/TwitchLiveNotifierQueue.ts";
import {getDB} from "../db.ts";

export class TwitchRepo extends Repo<typeof twitchChannelSchema._['config']> {

  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv, twitchChannelSchema);
  }

  static action(ctx: ActionAPIContext) {
    return new TwitchRepo(ctx.locals.runtime.env, 'action')
  }

  static withEnv(env: Env, repoEnv: RepoEnv) {
    return new TwitchRepo(env, repoEnv)
  }
  /**
   * Get all Twitch channels
   * @returns Promise resolving to an array of all Twitch channels
   *
   * SQL: `SELECT * FROM "twitch_channels"`
   */
  async getAllChannels(): Promise<InferSelectModel<typeof twitchChannelSchema>[]> {
    try {
      return await this.db.select()
        .from(twitchChannelSchema)
        .all();
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError("Failed to get all Twitch channels", error).toActionError();
      } else {
        throw new DatabaseError("Failed to get all Twitch channels", error);
      }
    }
  }

  /**
   * Get a Twitch channel by user ID
   * @param userId The user ID
   * @returns Promise resolving to the Twitch channel or null if not found
   *
   * SQL: `SELECT * FROM "twitch_channels" WHERE "twitch_channels"."userId" = ?`
   */
  async getChannelByUserId(userId: number): Promise<InferSelectModel<typeof twitchChannelSchema> | null> {
    try {
      const result = await this.db.select()
        .from(twitchChannelSchema)
        .where(eq(twitchChannelSchema.userId, userId))
        .get();

      return result || null;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to get Twitch channel for user ID: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get Twitch channel for user ID: ${userId}`, error);
      }
    }
  }
  /**
   * Get a Twitch channel by user ID
   * @param twitchId The twitch ID
   * @returns Promise resolving to the Twitch channel or null if not found
   *
   * SQL: `SELECT * FROM "twitch_channels" WHERE "twitch_channels"."userId" = ?`
   */
  async getChannelByTwitchId(twitchId: string): Promise<InferSelectModel<typeof twitchChannelSchema> | null> {
    try {
      const result = await this.db.select()
        .from(twitchChannelSchema)
        .where(eq(twitchChannelSchema.id, twitchId))
        .get();

      return result || null;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to get Twitch channel for twitch ID: ${twitchId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get Twitch channel for twitch ID: ${twitchId}`, error);
      }
    }
  }

  /**
   * Insert a Twitch channel
   * @param data The channel data to insert
   * @returns Promise resolving to the inserted channel
   *
   * SQL: `INSERT INTO "twitch_channels" (...) VALUES (...) RETURNING *`
   */
  async insertChannel(data: InferInsertModel<typeof twitchChannelSchema>): Promise<InferSelectModel<typeof twitchChannelSchema>> {
    try {
      const [result] = await this.db.insert(twitchChannelSchema)
        .values(data)
        .returning();

      return result;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to insert Twitch channel for user ID: ${data.userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to insert Twitch channel for user ID: ${data.userId}`, error);
      }
    }
  }

  /**
   * Delete a Twitch channel
   * @param userId The user ID
   * @returns Promise resolving to a boolean indicating if the channel was deleted
   *
   * SQL: `DELETE FROM "twitch_channels" WHERE "twitch_channels"."userId" = ? RETURNING *`
   */
  async deleteChannel(userId: number): Promise<boolean> {
    try {
      const result = await this.db.delete(twitchChannelSchema)
        .where(eq(twitchChannelSchema.userId, userId))
        .returning();

      return result.length > 0;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to delete Twitch channel for user ID: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to delete Twitch channel for user ID: ${userId}`, error);
      }
    }
  }

  /**
   * Get all Twitch streams
   * @returns Promise resolving to an array of all Twitch streams
   *
   * SQL: `SELECT * FROM "twitch_streams"`
   */
  async getAllStreams(): Promise<InferSelectModel<typeof twitchStreamSchema>[]> {
    try {
      return await this.db.select()
        .from(twitchStreamSchema)
        .all();
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError("Failed to get all Twitch streams", error).toActionError();
      } else {
        throw new DatabaseError("Failed to get all Twitch streams", error);
      }
    }
  }

  /**
   * Get a Twitch stream by user ID (Twitch user ID)
   * @param twitchId The Twitch user ID
   * @returns Promise resolving to the Twitch stream or null if not found
   *
   * SQL: `SELECT * FROM "twitch_streams" WHERE "twitch_streams"."userId" = ?`
   */
  async getStreamByUserId(twitchId: string): Promise<InferSelectModel<typeof twitchStreamSchema> | null> {
    try {
      const result = await this.db.select()
        .from(twitchStreamSchema)
        .where(eq(twitchStreamSchema.twitchId, twitchId))
        .get();

      return result || null;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to get Twitch stream for twitch ID: ${twitchId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get Twitch stream for twitch ID: ${twitchId}`, error);
      }
    }
  }

  /**
   * Insert a Twitch stream
   * @param data The stream data to insert
   * @returns Promise resolving to the inserted stream
   *
   * SQL: `INSERT INTO "twitch_streams" (...) VALUES (...) RETURNING *`
   */
  async insertStream(data: InferInsertModel<typeof twitchStreamSchema>): Promise<InferSelectModel<typeof twitchStreamSchema>> {
    try {
      const [result] = await this.db.insert(twitchStreamSchema)
        .values(data)
        .returning();

      return result;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to insert Twitch stream for user ID: ${data.twitchId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to insert Twitch stream for user ID: ${data.twitchId}`, error);
      }
    }
  }

  /**
   * Delete a Twitch stream
   * @param twitchId The Twitch stream ID
   * @returns Promise resolving to a boolean indicating if the stream was deleted
   *
   * SQL: `DELETE FROM "twitch_streams" WHERE "twitch_streams"."id" = ? RETURNING *`
   */
  async deleteStream(twitchId: string): Promise<boolean> {
    try {
      const result = await this.db.delete(twitchStreamSchema)
        .where(eq(twitchStreamSchema.twitchId, twitchId))
        .returning();

      return result.length > 0;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to delete Twitch stream for Twitch ID: ${twitchId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to delete Twitch stream for Twitch ID: ${twitchId}`, error);
      }
    }
  }

  /**
   * Insert multiple Twitch streams in a single batch operation
   * @param streams Array of stream data to insert
   * @returns Promise resolving to void
   */
  async insertMultipleStreams(streams: InferInsertModel<typeof twitchStreamSchema>[]): Promise<void> {
    try {
      if (streams.length === 0) return;

      // Generate operations for inserting streams
      const operations = this.getStreamInsertOps(streams);

      // Execute all operations in a single batch
      await this.executeBatch(operations);
      const notifierQueue = new TwitchLiveNotifierQueue();
      const ids = streams.map((stream) => stream.twitchId)

      // TODO queue TwitchLiveNotifierQueue

    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError("Failed to insert multiple Twitch streams", error).toActionError();
      } else {
        throw new DatabaseError("Failed to insert multiple Twitch streams", error);
      }
    }
  }

  /**
   * Delete multiple Twitch streams in a single batch operation
   * @param twitchIds Array of Twitch stream IDs to delete
   * @returns Promise resolving to void
   */
  async deleteMultipleStreams(twitchIds: string[]): Promise<void> {
    try {
      if (twitchIds.length === 0) return;

      // Generate operations for deleting streams
      const operations = this.getStreamDeleteOps(twitchIds);

      // Execute all operations in a single batch
      await this.executeBatch(operations);
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError("Failed to delete multiple Twitch streams", error).toActionError();
      } else {
        throw new DatabaseError("Failed to delete multiple Twitch streams", error);
      }
    }
  }

  /**
   * Generates database operations for inserting streams
   * @param streams Array of stream data to insert
   * @returns Array of database operations for batch execution
   */
  private getStreamInsertOps(streams: InferInsertModel<typeof twitchStreamSchema>[]): BatchItem<'sqlite'>[] {
    const operations: BatchItem<'sqlite'>[] = [];

    for (const stream of streams) {
      operations.push(
        this.db.insert(twitchStreamSchema).values(stream).onConflictDoNothing()
      );
    }

    return operations;
  }

  /**
   * Generates database operations for deleting streams
   * @param twitchIds Array of Twitch stream IDs to delete
   * @returns Array of database operations for batch execution
   */
  private getStreamDeleteOps(twitchIds: string[]): BatchItem<'sqlite'>[] {
    const operations: BatchItem<'sqlite'>[] = [];

    for (const twitchId of twitchIds) {
      operations.push(
        this.db.delete(twitchStreamSchema)
          .where(eq(twitchStreamSchema.twitchId, twitchId))
      );
    }

    return operations;
  }
}
