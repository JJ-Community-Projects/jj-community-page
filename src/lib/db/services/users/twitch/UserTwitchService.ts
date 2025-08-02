import type {ActionAPIContext} from "astro:actions";
import {BaseUserService} from "../base/BaseUserService.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";
import {TwitchWebService} from "../../../../externalAPI/TwitchWebService.ts";
import type {
  TwitchChannel,
  TwitchChannelInput,
  TwitchChannelUpdateInput,
  TwitchStream,
  TwitchStreamInput
} from "../../../types/twitch.ts";
import {DuplicateError, NotFoundError, ServiceError, ValidationError} from "../../../errors";
import type {StreamResult, TwitchAPIResult, UserResult} from "../../../../model/TwitchAPIModel.ts";
import {UserService} from "../UserService.ts";

/**
 * Service for Twitch-specific operations
 *
 * This service handles operations related to Twitch channels, including
 * creating, updating, and deleting channels, as well as fetching Twitch
 * user and stream data. It provides methods for interacting with the
 * Twitch API and managing Twitch channel data in the database.
 */
export class UserTwitchService extends BaseUserService {
  private twitchAPIService: TwitchWebService;
  private userService: UserService;

  /**
   * Creates a new UserTwitchService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.twitchAPIService = new TwitchWebService(env, repoEnv);
    this.userService = new UserService(env, repoEnv);
  }

  /**
   * Creates a UserTwitchService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A UserTwitchService instance
   */
  static action(ctx: ActionAPIContext) {
    return new UserTwitchService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Gets a Twitch channel by user ID
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns The Twitch channel or null if not found
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {ServiceError} If there was an error retrieving the channel
   */
  async getTwitchChannel(userId: number, requestingUserId?: number): Promise<TwitchChannel | undefined> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    try {
      const channel = await this.twitchRepo.findChannelByUserId(userId);
      return channel || undefined;
    } catch (error) {
      console.error(`Failed to get Twitch channel for user: ${userId}`, error);
      throw new ServiceError(`Failed to get Twitch channel for user: ${userId}`, error);
    }
  }

  /**
   * Gets a Twitch channel by ID
   * @param channelId - The Twitch channel ID
   * @returns The Twitch channel or null if not found
   * @throws {ServiceError} If there was an error retrieving the channel
   */
  async getTwitchChannelById(channelId: string): Promise<TwitchChannel | undefined> {
    try {
      const channel = await this.twitchRepo.findChannelById(channelId);
      return channel || undefined;
    } catch (error) {
      console.error(`Failed to get Twitch channel with ID: ${channelId}`, error);
      throw new ServiceError(`Failed to get Twitch channel with ID: ${channelId}`, error);
    }
  }

  /**
   * Creates a Twitch channel for a user
   * @param data - The Twitch channel data
   * @param requestingUserId - The ID of the user making the request
   * @returns The created Twitch channel
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the channel already exists
   */
  async createTwitchChannel(data: TwitchChannelInput, requestingUserId: number): Promise<TwitchChannel> {
    // Check if user exists
    await this.userService.getUserById(data.userId, requestingUserId);

    // Authorization check (only the user themselves or an admin can create a channel)
    await this.userService.ensureCanModifyUser(data.userId, requestingUserId);

    // Validate input
    this.validateTwitchChannelInput(data);

    try {
      // Check if channel already exists
      const existingChannel = await this.getTwitchChannel(data.userId, requestingUserId);
      if (existingChannel) {
        throw new DuplicateError(`Twitch channel already exists for user: ${data.userId}`);
      }

      // Create the channel
      return await this.twitchRepo.createChannel(data);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }
      console.error(`Failed to create Twitch channel for user: ${data.userId}`, error);
      throw new ServiceError(`Failed to create Twitch channel for user: ${data.userId}`, error);
    }
  }

  /**
   * Updates a Twitch channel
   * @param userId - The user ID
   * @param data - The data to update
   * @param requestingUserId - The ID of the user making the request
   * @returns The updated Twitch channel
   * @throws {NotFoundError} If the user or channel doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   */
  async updateTwitchChannel(userId: number, data: TwitchChannelUpdateInput, requestingUserId: number): Promise<TwitchChannel> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    // Authorization check (only the user themselves or an admin can update)
    await this.userService.ensureCanModifyUser(userId, requestingUserId);

    // Check if channel exists
    const channel = await this.getTwitchChannel(userId, requestingUserId);
    if (!channel) {
      throw new NotFoundError(`Twitch channel not found for user: ${userId}`);
    }

    try {
      // Update the channel
      return await this.twitchRepo.updateChannel(channel.id, data);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error(`Failed to update Twitch channel for user: ${userId}`, error);
      throw new ServiceError(`Failed to update Twitch channel for user: ${userId}`, error);
    }
  }

  /**
   * Deletes a Twitch channel
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request
   * @throws {NotFoundError} If the user or channel doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async deleteTwitchChannel(userId: number, requestingUserId: number): Promise<void> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    // Authorization check (only the user themselves or an admin can delete)
    await this.userService.ensureCanModifyUser(userId, requestingUserId);

    // Check if channel exists
    const channel = await this.getTwitchChannel(userId, requestingUserId);
    if (!channel) {
      throw new NotFoundError(`Twitch channel not found for user: ${userId}`);
    }

    try {
      // Delete the channel
      await this.twitchRepo.deleteChannel(channel.id);
    } catch (error) {
      console.error(`Failed to delete Twitch channel for user: ${userId}`, error);
      throw new ServiceError(`Failed to delete Twitch channel for user: ${userId}`, error);
    }
  }

  /**
   * Gets a Twitch stream by ID
   * @param streamId - The Twitch stream ID
   * @returns The Twitch stream or null if not found
   * @throws {ServiceError} If there was an error retrieving the stream
   */
  async getTwitchStream(streamId: string): Promise<TwitchStream | undefined> {
    try {
      const stream = await this.twitchRepo.findStreamById(streamId);
      return stream || undefined;
    } catch (error) {
      console.error(`Failed to get Twitch stream with ID: ${streamId}`, error);
      throw new ServiceError(`Failed to get Twitch stream with ID: ${streamId}`, error);
    }
  }

  /**
   * Updates Twitch stream data (used by background processes)
   * @param streamData - The stream data to update
   * @throws {ServiceError} If there was an error updating the stream data
   */
  async updateStreamData(streamData: TwitchStreamInput[]): Promise<void> {
    try {
      const operations = streamData.map(stream => {
        return this.twitchRepo.upsertStream(stream);
      });

      await this.executeBatch(operations);
    } catch (error) {
      console.error("Error updating Twitch stream data:", error);
      throw new ServiceError("Failed to update Twitch stream data", error);
    }
  }

  /**
   * Fetches Twitch user data by login name
   * @param login - The Twitch login name
   * @returns The Twitch user data or an error
   */
  async fetchTwitchUserByLogin(login: string): Promise<TwitchAPIResult<UserResult>> {
    return await this.twitchAPIService.fetchUserByLogin(login);
  }

  /**
   * Fetches Twitch stream data for a user
   * @param userId - The Twitch user ID
   * @returns The Twitch stream data or an error
   */
  async fetchTwitchStreamsByUserId(userId: string): Promise<TwitchAPIResult<StreamResult>> {
    return await this.twitchAPIService.fetchStreamsByUserId(userId);
  }

  /**
   * Validates Twitch channel input data
   * @param data - The data to validate
   * @throws {ValidationError} If the input data is invalid
   */
  private validateTwitchChannelInput(data: TwitchChannelInput): void {
    if (!data.id || data.id.trim() === '') {
      throw new ValidationError("Twitch channel ID is required");
    }

    if (!data.login || data.login.trim() === '') {
      throw new ValidationError("Twitch login is required");
    }

    if (!data.displayName || data.displayName.trim() === '') {
      throw new ValidationError("Twitch display name is required");
    }

    if (data.userId === undefined || data.userId === null) {
      throw new ValidationError("User ID is required");
    }
  }
}
