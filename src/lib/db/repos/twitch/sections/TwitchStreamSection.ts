// src/lib/db/newRepos/twitch/sections/TwitchStreamSection.ts
import { eq } from "drizzle-orm";
import type { ActionAPIContext } from "astro:actions";
import type { RepoEnv } from "../../../../db/RepoEnv";
import { twitchStreamSchema } from "../../../../db/schema/twitch-channel-schema.ts";
import type { TwitchStream, TwitchStreamInput, TwitchStreamUpdateInput } from "../../../../db/types/twitch.ts";
import { DuplicateError, NotFoundError } from "../../../../db/errors";
import { BaseTwitchSection } from "../base/BaseTwitchSection.ts";
import type { BatchItem } from "drizzle-orm/batch";

/**
 * Section for Twitch stream operations
 */
export class TwitchStreamSection extends BaseTwitchSection<TwitchStream, TwitchStreamInput> {
  /**
   * Creates a new TwitchStreamSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a Twitch stream by ID
   * @param streamId - The Twitch stream ID
   * @returns The Twitch stream or undefined if not found
   */
  async findById(streamId: string): Promise<TwitchStream | undefined> {
    try {
      return this.db.select()
        .from(twitchStreamSchema)
        .where(eq(twitchStreamSchema.streamId, streamId))
        .get();
    } catch (error) {
      this.handleError(`Failed to find Twitch stream with ID: ${streamId}`, error);
    }
  }

  /**
   * Finds Twitch streams by Twitch channel ID
   * @param twitchId - The Twitch channel ID
   * @returns An array of Twitch streams
   */
  async findByTwitchId(twitchId: string): Promise<TwitchStream[]> {
    try {
      return await this.db.select()
        .from(twitchStreamSchema)
        .where(eq(twitchStreamSchema.twitchId, twitchId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find Twitch streams for channel: ${twitchId}`, error);
    }
  }

  /**
   * Finds all Twitch streams
   * @returns An array of Twitch streams
   */
  async findAll(): Promise<TwitchStream[]> {
    try {
      return await this.db.select()
        .from(twitchStreamSchema)
        .all();
    } catch (error) {
      this.handleError("Failed to find all Twitch streams", error);
    }
  }

  /**
   * Creates a new Twitch stream
   * @param data - The data for the new Twitch stream
   * @returns The created Twitch stream
   */
  async create(data: TwitchStreamInput): Promise<TwitchStream> {
    try {
      // Check if stream already exists
      const existingStream = await this.findById(data.streamId);
      if (existingStream) {
        throw new DuplicateError(`Twitch stream with ID ${data.streamId} already exists`);
      }

      const [result] = await this.db.insert(twitchStreamSchema)
        .values(data)
        .returning();

      return result;
    } catch (error) {
      this.handleError("Failed to create Twitch stream", error);
    }
  }

  /**
   * Updates a Twitch stream
   * @param streamId - The Twitch stream ID
   * @param data - The data to update
   * @returns The updated Twitch stream
   */
  async update(streamId: string, data: TwitchStreamUpdateInput): Promise<TwitchStream> {
    try {
      const [result] = await this.db.update(twitchStreamSchema)
        .set(data)
        .where(eq(twitchStreamSchema.streamId, streamId))
        .returning();

      if (!result) {
        throw new NotFoundError(`Twitch stream with ID ${streamId} not found`);
      }

      return result as TwitchStream;
    } catch (error) {
      this.handleError(`Failed to update Twitch stream with ID: ${streamId}`, error);
    }
  }

  /**
   * Deletes a Twitch stream
   * @param streamId - The Twitch stream ID
   */
  async delete(streamId: string): Promise<void> {
    try {
      await this.db.delete(twitchStreamSchema)
        .where(eq(twitchStreamSchema.streamId, streamId))
        .run();
    } catch (error) {
      this.handleError(`Failed to delete Twitch stream with ID: ${streamId}`, error);
    }
  }

  /**
   * Deletes multiple Twitch streams by their channel IDs
   * @param twitchIds - Array of Twitch channel IDs
   * @returns Array of deleted Twitch streams or undefined if operation fails
   */
  async deleteMultiple(twitchIds: string[]): Promise<TwitchStream[] | undefined> {
    try {
      const batch: BatchItem<'sqlite'>[] = []
      for(const twitchId of twitchIds) {
        batch.push(
          this.db
            .delete(twitchStreamSchema)
            .where(eq(twitchStreamSchema.twitchId, twitchId))
            .returning()
        )
      }

      const result = await this.executeBatch(batch);
      if (!result) {
        return undefined;
      }
      return result.flat() as TwitchStream[];
    } catch (error) {
      this.handleError(`Failed to delete multiple Twitch streams`, error);
    }
  }

  /**
   * Inserts multiple Twitch streams
   * @param streams - Array of Twitch stream data to insert
   * @returns Array of inserted Twitch streams or undefined if operation fails
   */
  async insertMultiple(streams: TwitchStreamInput[]): Promise<TwitchStream[] | undefined> {
    try {
      const batch: BatchItem<'sqlite'>[] = []
      for(const stream of streams) {
        batch.push(
          this.db
            .insert(twitchStreamSchema)
            .values(stream)
            .returning()
        )
      }
      const result = await this.executeBatch(batch);
      if (!result) {
        return undefined;
      }
      return result.flat() as TwitchStream[];
    } catch (error) {
      this.handleError(`Failed to insert multiple Twitch streams`, error);
    }
  }

  /**
   * Creates a TwitchStreamSection instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A TwitchStreamSection instance
   */
  static action(ctx: ActionAPIContext) {
    return new TwitchStreamSection(ctx.locals.runtime.env, 'action');
  }
}

/**
 * Section for Twitch stream operations scoped to a specific Twitch channel
 */
export class TwitchStreamSectionWithChannel extends BaseTwitchSection<TwitchStream, TwitchStreamInput> {
  private twitchId: string;
  private section: TwitchStreamSection;

  /**
   * Creates a new TwitchStreamSectionWithChannel instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param twitchId - The Twitch channel ID
   */
  constructor(env: Env, repoEnv: RepoEnv, twitchId: string) {
    super(env, repoEnv);
    this.twitchId = twitchId;
    this.section = new TwitchStreamSection(env, repoEnv);
  }

  /**
   * Finds all streams for this Twitch channel
   * @returns An array of Twitch streams
   */
  async findAll(): Promise<TwitchStream[]> {
    try {
      return await this.section.findByTwitchId(this.twitchId);
    } catch (error) {
      this.handleError(`Failed to find all Twitch streams for channel: ${this.twitchId}`, error);
    }
  }

  /**
   * Finds a specific stream for this Twitch channel
   * @param streamId - The stream ID
   * @returns The Twitch stream or undefined if not found
   */
  async find(streamId: string): Promise<TwitchStream | undefined> {
    try {
      const stream = await this.section.findById(streamId);
      if (stream && stream.twitchId === this.twitchId) {
        return stream;
      }
      return undefined;
    } catch (error) {
      this.handleError(`Failed to find stream with ID: ${streamId} for channel: ${this.twitchId}`, error);
    }
  }

  /**
   * Creates a new stream for this Twitch channel
   * @param data - The data for the new stream
   * @returns The created Twitch stream
   */
  async create(data: Omit<TwitchStreamInput, 'twitchId'>): Promise<TwitchStream> {
    try {
      return await this.section.create({
        ...data,
        twitchId: this.twitchId
      });
    } catch (error) {
      this.handleError("Failed to create Twitch stream for channel", error);
    }
  }

  /**
   * Updates a stream for this Twitch channel
   * @param streamId - The stream ID
   * @param data - The data to update
   * @returns The updated Twitch stream
   */
  async update(streamId: string, data: TwitchStreamUpdateInput): Promise<TwitchStream> {
    try {
      const stream = await this.find(streamId);
      if (!stream) {
        throw new NotFoundError(`Twitch stream with ID ${streamId} not found for channel ${this.twitchId}`);
      }

      return await this.section.update(streamId, data);
    } catch (error) {
      this.handleError(`Failed to update stream with ID: ${streamId} for channel: ${this.twitchId}`, error);
    }
  }

  /**
   * Deletes a stream from this Twitch channel
   * @param streamId - The stream ID
   */
  async delete(streamId: string): Promise<void> {
    try {
      const stream = await this.find(streamId);
      if (!stream) {
        throw new NotFoundError(`Twitch stream with ID ${streamId} not found for channel ${this.twitchId}`);
      }

      await this.section.delete(streamId);
    } catch (error) {
      this.handleError(`Failed to delete stream with ID: ${streamId} from channel ${this.twitchId}`, error);
    }
  }
}
