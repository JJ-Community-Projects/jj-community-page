import type {ActionAPIContext} from "astro:actions";
import {BaseUserServiceWithUser} from "../base/BaseUserServiceWithUser.ts";
import {UserTwitchService} from "./UserTwitchService.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";
import type {TwitchChannel, TwitchChannelInput, TwitchChannelUpdateInput, TwitchStream} from "../../../types/twitch.ts";
import type {StreamResult, TwitchAPIResult, UserResult} from "../../../../model/TwitchAPIModel.ts";

/**
 * Service for Twitch-specific operations with user context
 *
 * This service provides the same functionality as UserTwitchService but
 * automatically uses the user context for authorization. It's designed to be
 * used in contexts where the user is already known, such as in Durable Objects.
 */
export class UserTwitchServiceWithUser extends BaseUserServiceWithUser {
  private twitchService: UserTwitchService;

  /**
   * Creates a new UserTwitchServiceWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The ID of the user this service operates for
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv, userId);
    this.twitchService = new UserTwitchService(env, repoEnv);
  }

  /**
   * Creates a UserTwitchServiceWithUser instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param userId - The ID of the user this service operates for
   * @returns A UserTwitchServiceWithUser instance
   */
  static action(ctx: ActionAPIContext, userId: number) {
    return new UserTwitchServiceWithUser(ctx.locals.runtime.env, 'action', userId);
  }

  /**
   * Gets the Twitch channel for the current user
   * @returns The Twitch channel or null if not found
   * @throws {ServiceError} If there was an error retrieving the channel
   */
  async getMyTwitchChannel(): Promise<TwitchChannel | undefined> {
    return await this.twitchService.getTwitchChannel(this.userId, this.userId);
  }

  /**
   * Gets a Twitch channel for another user
   * @param userId - The user ID
   * @returns The Twitch channel or null if not found
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   * @throws {ServiceError} If there was an error retrieving the channel
   */
  async getTwitchChannel(userId: number): Promise<TwitchChannel | undefined> {
    return await this.twitchService.getTwitchChannel(userId, this.userId);
  }

  /**
   * Gets a Twitch channel by ID
   * @param channelId - The Twitch channel ID
   * @returns The Twitch channel or null if not found
   * @throws {ServiceError} If there was an error retrieving the channel
   */
  async getTwitchChannelById(channelId: string): Promise<TwitchChannel | undefined> {
    return await this.twitchService.getTwitchChannelById(channelId);
  }

  /**
   * Creates a Twitch channel for the current user
   * @param data - The Twitch channel data (without userId)
   * @returns The created Twitch channel
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the channel already exists
   */
  async createMyTwitchChannel(data: Omit<TwitchChannelInput, 'userId'>): Promise<TwitchChannel> {
    // Create a new object with the userId from the context
    const channelData: TwitchChannelInput = {
      ...data,
      userId: this.userId
    };
    const result = await this.twitchService.createTwitchChannel(channelData, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Updates the Twitch channel for the current user
   * @param data - The data to update
   * @returns The updated Twitch channel
   * @throws {NotFoundError} If the channel doesn't exist
   * @throws {ValidationError} If the input data is invalid
   */
  async updateMyTwitchChannel(data: TwitchChannelUpdateInput): Promise<TwitchChannel> {
    const result = await this.twitchService.updateTwitchChannel(this.userId, data, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Deletes the Twitch channel for the current user
   * @throws {NotFoundError} If the channel doesn't exist
   */
  async deleteMyTwitchChannel(): Promise<void> {
    await this.twitchService.deleteTwitchChannel(this.userId, this.userId);
    await this.refreshDO();
  }

  /**
   * Creates a Twitch channel for another user (admin only)
   * @param userId - The user ID
   * @param data - The Twitch channel data (without userId)
   * @returns The created Twitch channel
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the channel already exists
   */
  async createTwitchChannel(userId: number, data: Omit<TwitchChannelInput, 'userId'>): Promise<TwitchChannel> {
    // Create a new object with the provided userId
    const channelData: TwitchChannelInput = {
      ...data,
      userId
    };
    return await this.twitchService.createTwitchChannel(channelData, this.userId);
  }

  /**
   * Updates a Twitch channel for another user (admin only)
   * @param userId - The user ID
   * @param data - The data to update
   * @returns The updated Twitch channel
   * @throws {NotFoundError} If the user or channel doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   */
  async updateTwitchChannel(userId: number, data: TwitchChannelUpdateInput): Promise<TwitchChannel> {
    return await this.twitchService.updateTwitchChannel(userId, data, this.userId);
  }

  /**
   * Deletes a Twitch channel for another user (admin only)
   * @param userId - The user ID
   * @throws {NotFoundError} If the user or channel doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   */
  async deleteTwitchChannel(userId: number): Promise<void> {
    await this.twitchService.deleteTwitchChannel(userId, this.userId);
  }

  /**
   * Gets a Twitch stream by ID
   * @param streamId - The Twitch stream ID
   * @returns The Twitch stream or null if not found
   * @throws {ServiceError} If there was an error retrieving the stream
   */
  async getTwitchStream(streamId: string): Promise<TwitchStream | undefined> {
    return await this.twitchService.getTwitchStream(streamId);
  }

  /**
   * Fetches Twitch user data by login name
   * @param login - The Twitch login name
   * @returns The Twitch user data or an error
   */
  async fetchTwitchUserByLogin(login: string): Promise<TwitchAPIResult<UserResult>> {
    return await this.twitchService.fetchTwitchUserByLogin(login);
  }

  /**
   * Fetches Twitch stream data for a user
   * @param twitchUserId - The Twitch user ID
   * @returns The Twitch stream data or an error
   */
  async fetchTwitchStreamsByUserId(twitchUserId: string): Promise<TwitchAPIResult<StreamResult>> {
    return await this.twitchService.fetchTwitchStreamsByUserId(twitchUserId);
  }

  /**
   * Refreshes the user's Durable Object after Twitch channel changes
   */
  async refreshTwitch(): Promise<void> {
    await this.refreshDO();
  }
}
