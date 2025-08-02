// src/lib/db/newRepos/twitch/sections/TwitchChannelSection.ts
import { eq } from "drizzle-orm";
import type { ActionAPIContext } from "astro:actions";
import type { RepoEnv } from "../../../../db/RepoEnv";
import { twitchChannelSchema } from "../../../../db/schema/twitch-channel-schema.ts";
import type { TwitchChannel, TwitchChannelInput, TwitchChannelUpdateInput } from "../../../../db/types/twitch.ts";
import { DuplicateError, NotFoundError } from "../../../../db/errors";
import { BaseTwitchSection } from "../base/BaseTwitchSection.ts";
import type { BatchItem } from "drizzle-orm/batch";

/**
 * Section for Twitch channel operations
 */
export class TwitchChannelSection extends BaseTwitchSection<TwitchChannel, TwitchChannelInput> {
  /**
   * Creates a new TwitchChannelSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a Twitch channel by ID
   * @param id - The Twitch channel ID
   * @returns The Twitch channel or undefined if not found
   */
  async findById(id: string): Promise<TwitchChannel | undefined> {
    try {
      return this.db.select()
        .from(twitchChannelSchema)
        .where(eq(twitchChannelSchema.id, id))
        .get();
    } catch (error) {
      this.handleError(`Failed to find Twitch channel with ID: ${id}`, error);
    }
  }

  /**
   * Finds a Twitch channel by user ID
   * @param userId - The user ID
   * @returns The Twitch channel or undefined if not found
   */
  async findByUserId(userId: number): Promise<TwitchChannel | undefined> {
    try {
      return this.db.select()
        .from(twitchChannelSchema)
        .where(eq(twitchChannelSchema.userId, userId))
        .get();
    } catch (error) {
      this.handleError(`Failed to find Twitch channel for user: ${userId}`, error);
    }
  }

  /**
   * Finds all Twitch channels
   * @returns An array of Twitch channels
   */
  async findAll(): Promise<TwitchChannel[]> {
    try {
      return await this.db.select()
        .from(twitchChannelSchema)
        .all();
    } catch (error) {
      this.handleError("Failed to find all Twitch channels", error);
    }
  }

  /**
   * Creates a new Twitch channel
   * @param data - The data for the new Twitch channel
   * @returns The created Twitch channel
   */
  async create(data: TwitchChannelInput): Promise<TwitchChannel> {
    try {
      // Check if channel already exists
      const existingChannel = await this.findById(data.id);
      if (existingChannel) {
        throw new DuplicateError(`Twitch channel with ID ${data.id} already exists`);
      }

      const [result] = await this.db.insert(twitchChannelSchema)
        .values(data)
        .returning();

      return result;
    } catch (error) {
      this.handleError("Failed to create Twitch channel", error);
    }
  }

  /**
   * Updates a Twitch channel
   * @param id - The Twitch channel ID
   * @param data - The data to update
   * @returns The updated Twitch channel
   */
  async update(id: string, data: TwitchChannelUpdateInput): Promise<TwitchChannel> {
    try {
      const [result] = await this.db.update(twitchChannelSchema)
        .set(data)
        .where(eq(twitchChannelSchema.id, id))
        .returning();

      if (!result) {
        throw new NotFoundError(`Twitch channel with ID ${id} not found`);
      }

      return result as TwitchChannel;
    } catch (error) {
      this.handleError(`Failed to update Twitch channel with ID: ${id}`, error);
    }
  }

  /**
   * Deletes a Twitch channel
   * @param id - The Twitch channel ID
   */
  async delete(id: string): Promise<void> {
    try {
      await this.db.delete(twitchChannelSchema)
        .where(eq(twitchChannelSchema.id, id))
        .run();
    } catch (error) {
      this.handleError(`Failed to delete Twitch channel with ID: ${id}`, error);
    }
  }

  /**
   * Deletes a Twitch channel by user ID
   * @param id - The user ID
   */
  async deleteByUserId(id: number): Promise<void> {
    try {
      await this.db.delete(twitchChannelSchema)
        .where(eq(twitchChannelSchema.userId, id))
        .run();
    } catch (error) {
      this.handleError(`Failed to delete Twitch channel for user ID: ${id}`, error);
    }
  }

  /**
   * Deletes multiple Twitch channels
   * @param ids - Array of Twitch channel IDs to delete
   * @returns Array of deleted Twitch channels or undefined if operation fails
   */
  async deleteMultiple(ids: string[]): Promise<TwitchChannel[] | undefined> {
    try {
      const batch: BatchItem<'sqlite'>[] = []
      for (const id of ids) {
        batch.push(
          this.db
            .delete(twitchChannelSchema)
            .where(eq(twitchChannelSchema.id, id))
            .returning()
        )
      }
      const result = await this.db.batch(batch);
      if (!result) {
        return undefined;
      }
      return result.flat() as TwitchChannel[];
    } catch (error) {
      this.handleError(`Failed to delete multiple Twitch channels`, error);
    }
  }

  /**
   * Creates a TwitchChannelSection instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A TwitchChannelSection instance
   */
  static action(ctx: ActionAPIContext) {
    return new TwitchChannelSection(ctx.locals.runtime.env, 'action');
  }
}

/**
 * Section for Twitch channel operations scoped to a specific user
 */
export class TwitchChannelSectionWithUser extends BaseTwitchSection<TwitchChannel, TwitchChannelInput> {
  private userId: number;
  private section: TwitchChannelSection;

  /**
   * Creates a new TwitchChannelSectionWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The user ID
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv);
    this.userId = userId;
    this.section = new TwitchChannelSection(env, repoEnv);
  }

  /**
   * Finds the Twitch channel for this user
   * @returns The Twitch channel or undefined if not found
   */
  async find(): Promise<TwitchChannel | undefined> {
    try {
      return await this.section.findByUserId(this.userId);
    } catch (error) {
      this.handleError(`Failed to find Twitch channel for user: ${this.userId}`, error);
    }
  }

  /**
   * Creates a new Twitch channel for this user
   * @param data - The data for the new Twitch channel
   * @returns The created Twitch channel
   */
  async create(data: Omit<TwitchChannelInput, 'userId'>): Promise<TwitchChannel> {
    try {
      return await this.section.create({
        ...data,
        userId: this.userId
      });
    } catch (error) {
      this.handleError("Failed to create Twitch channel for user", error);
    }
  }

  /**
   * Updates the Twitch channel for this user
   * @param data - The data to update
   * @returns The updated Twitch channel
   */
  async update(data: TwitchChannelUpdateInput): Promise<TwitchChannel> {
    try {
      const channel = await this.find();
      if (!channel) {
        throw new NotFoundError(`Twitch channel for user ${this.userId} not found`);
      }

      return await this.section.update(channel.id, data);
    } catch (error) {
      this.handleError(`Failed to update Twitch channel for user: ${this.userId}`, error);
    }
  }

  /**
   * Deletes the Twitch channel for this user
   */
  async delete(): Promise<void> {
    try {
      const channel = await this.find();
      if (!channel) {
        throw new NotFoundError(`Twitch channel for user ${this.userId} not found`);
      }

      await this.section.delete(channel.id);
    } catch (error) {
      this.handleError(`Failed to delete Twitch channel for user: ${this.userId}`, error);
    }
  }
}
