// src/lib/db/newRepos/twitch/TwitchRepo.ts
// @ts-ignore
import type { ActionAPIContext } from "astro:actions";
import { BaseRepo } from "../base/BaseRepo";
import type { RepoEnv } from "../../../db/RepoEnv";
import { TwitchChannelSection } from "./sections/TwitchChannelSection";
import { TwitchStreamSection } from "./sections/TwitchStreamSection";
import type {
  TwitchChannel,
  TwitchChannelInput,
  TwitchChannelUpdateInput,
  TwitchStream,
  TwitchStreamInput,
  TwitchStreamUpdateInput
} from "../../../db/types/twitch";
import { NotFoundError } from "../../../db/errors";

/**
 * Repository for Twitch domain operations
 * Coordinates between Twitch-related sections
 */
export class TwitchRepo extends BaseRepo {
  private readonly channelSection: TwitchChannelSection;
  private readonly streamSection: TwitchStreamSection;

  /**
   * Creates a new TwitchRepo instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.channelSection = new TwitchChannelSection(env, repoEnv);
    this.streamSection = new TwitchStreamSection(env, repoEnv);
  }

  /**
   * Creates a TwitchRepo instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A TwitchRepo instance
   */
  static action(ctx: ActionAPIContext) {
    return new TwitchRepo(ctx.locals.runtime.env, 'action');
  }

  /**
   * Gets the channel section
   * @returns The channel section
   */
  getChannelSection(): TwitchChannelSection {
    return this.channelSection;
  }

  /**
   * Gets the stream section
   * @returns The stream section
   */
  getStreamSection(): TwitchStreamSection {
    return this.streamSection;
  }

  /**
   * Finds a Twitch channel by ID
   * @param id - The Twitch channel ID
   * @returns The Twitch channel or undefined if not found
   */
  async findChannelById(id: string): Promise<TwitchChannel | undefined> {
    try {
      return await this.channelSection.findById(id);
    } catch (error) {
      this.handleError(`Failed to find Twitch channel with ID: ${id}`, error);
    }
  }

  /**
   * Finds a Twitch channel by user ID
   * @param userId - The user ID
   * @returns The Twitch channel or undefined if not found
   */
  async findChannelByUserId(userId: number): Promise<TwitchChannel | undefined> {
    try {
      return await this.channelSection.findByUserId(userId);
    } catch (error) {
      this.handleError(`Failed to find Twitch channel for user: ${userId}`, error);
    }
  }

  /**
   * Creates a new Twitch channel
   * @param data - The data for the new Twitch channel
   * @returns The created Twitch channel
   */
  async createChannel(data: TwitchChannelInput): Promise<TwitchChannel> {
    try {
      return await this.channelSection.create(data);
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
  async updateChannel(id: string, data: TwitchChannelUpdateInput): Promise<TwitchChannel> {
    try {
      return await this.channelSection.update(id, data);
    } catch (error) {
      this.handleError(`Failed to update Twitch channel with ID: ${id}`, error);
    }
  }

  /**
   * Deletes a Twitch channel
   * @param id - The Twitch channel ID
   */
  async deleteChannel(id: string): Promise<void> {
    try {
      await this.channelSection.delete(id);
    } catch (error) {
      this.handleError(`Failed to delete Twitch channel with ID: ${id}`, error);
    }
  }

  /**
   * Finds a Twitch stream by ID
   * @param streamId - The Twitch stream ID
   * @returns The Twitch stream or undefined if not found
   */
  async findStreamById(streamId: string): Promise<TwitchStream | undefined> {
    try {
      return await this.streamSection.findById(streamId);
    } catch (error) {
      this.handleError(`Failed to find Twitch stream with ID: ${streamId}`, error);
    }
  }

  /**
   * Finds Twitch streams by Twitch channel ID
   * @param twitchId - The Twitch channel ID
   * @returns An array of Twitch streams
   */
  async findStreamsByChannelId(twitchId: string): Promise<TwitchStream[]> {
    try {
      return await this.streamSection.findByTwitchId(twitchId);
    } catch (error) {
      this.handleError(`Failed to find Twitch streams for channel: ${twitchId}`, error);
    }
  }

  /**
   * Creates a new Twitch stream
   * @param data - The data for the new Twitch stream
   * @returns The created Twitch stream
   */
  async createStream(data: TwitchStreamInput): Promise<TwitchStream> {
    try {
      return await this.streamSection.create(data);
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
  async updateStream(streamId: string, data: TwitchStreamUpdateInput): Promise<TwitchStream> {
    try {
      return await this.streamSection.update(streamId, data);
    } catch (error) {
      this.handleError(`Failed to update Twitch stream with ID: ${streamId}`, error);
    }
  }

  /**
   * Deletes a Twitch stream
   * @param streamId - The Twitch stream ID
   */
  async deleteStream(streamId: string): Promise<void> {
    try {
      await this.streamSection.delete(streamId);
    } catch (error) {
      this.handleError(`Failed to delete Twitch stream with ID: ${streamId}`, error);
    }
  }

  /**
   * Inserts multiple Twitch streams
   * @param streams - Array of Twitch stream data to insert
   * @returns Array of inserted Twitch streams or undefined if operation fails
   */
  async insertMultipleStreams(streams: TwitchStreamInput[]): Promise<TwitchStream[] | undefined> {
    try {
      return await this.streamSection.insertMultiple(streams);
    } catch (error) {
      this.handleError(`Failed to insert multiple Twitch streams`, error);
    }
  }

  /**
   * Gets all Twitch channels and their streams
   * @returns An array of Twitch channels with their streams
   */
  async getAllChannelsWithStreams(): Promise<Array<{ channel: TwitchChannel, streams: TwitchStream[] }>> {
    try {
      const channels = await this.channelSection.findAll();
      const result = [];

      for (const channel of channels) {
        const streams = await this.streamSection.findByTwitchId(channel.id);
        result.push({
          channel,
          streams
        });
      }

      return result;
    } catch (error) {
      this.handleError("Failed to get all Twitch channels with streams", error);
    }
  }

  /**
   * Gets a Twitch channel and its streams by user ID
   * @param userId - The user ID
   * @returns The Twitch channel with its streams or undefined if not found
   */
  async getChannelWithStreamsByUserId(userId: number): Promise<{ channel: TwitchChannel, streams: TwitchStream[] } | undefined> {
    try {
      const channel = await this.channelSection.findByUserId(userId);
      if (!channel) {
        return undefined;
      }

      const streams = await this.streamSection.findByTwitchId(channel.id);
      return {
        channel,
        streams
      };
    } catch (error) {
      this.handleError(`Failed to get Twitch channel with streams for user: ${userId}`, error);
    }
  }
}

/**
 * Repository for Twitch operations scoped to a specific user
 */
export class TwitchRepoWithUser extends BaseRepo {
  private userId: number;
  private repo: TwitchRepo;

  /**
   * Creates a new TwitchRepoWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The user ID
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv);
    this.userId = userId;
    this.repo = new TwitchRepo(env, repoEnv);
  }

  /**
   * Gets the Twitch channel for this user
   * @returns The Twitch channel or undefined if not found
   */
  async getChannel(): Promise<TwitchChannel | undefined> {
    try {
      return await this.repo.findChannelByUserId(this.userId);
    } catch (error) {
      this.handleError(`Failed to get Twitch channel for user: ${this.userId}`, error);
    }
  }

  /**
   * Gets the Twitch channel and its streams for this user
   * @returns The Twitch channel with its streams or undefined if not found
   */
  async getChannelWithStreams(): Promise<{ channel: TwitchChannel, streams: TwitchStream[] } | undefined> {
    try {
      return await this.repo.getChannelWithStreamsByUserId(this.userId);
    } catch (error) {
      this.handleError(`Failed to get Twitch channel with streams for user: ${this.userId}`, error);
    }
  }

  /**
   * Creates a Twitch channel for this user
   * @param data - The data for the new Twitch channel
   * @returns The created Twitch channel
   */
  async createChannel(data: Omit<TwitchChannelInput, 'userId'>): Promise<TwitchChannel> {
    try {
      return await this.repo.createChannel({
        ...data,
        userId: this.userId
      });
    } catch (error) {
      this.handleError(`Failed to create Twitch channel for user: ${this.userId}`, error);
    }
  }

  /**
   * Updates the Twitch channel for this user
   * @param data - The data to update
   * @returns The updated Twitch channel
   */
  async updateChannel(data: TwitchChannelUpdateInput): Promise<TwitchChannel> {
    try {
      const channel = await this.getChannel();
      if (!channel) {
        throw new NotFoundError(`Twitch channel for user ${this.userId} not found`);
      }

      return await this.repo.updateChannel(channel.id, data);
    } catch (error) {
      this.handleError(`Failed to update Twitch channel for user: ${this.userId}`, error);
    }
  }

  /**
   * Deletes the Twitch channel for this user
   */
  async deleteChannel(): Promise<void> {
    try {
      const channel = await this.getChannel();
      if (!channel) {
        throw new NotFoundError(`Twitch channel for user ${this.userId} not found`);
      }

      await this.repo.deleteChannel(channel.id);
    } catch (error) {
      this.handleError(`Failed to delete Twitch channel for user: ${this.userId}`, error);
    }
  }
}
