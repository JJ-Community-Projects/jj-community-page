import type {ActionAPIContext} from "astro:actions";
import {BaseUserServiceWithUser} from "../base/BaseUserServiceWithUser.ts";
import {UserTiltifyService} from "./UserTiltifyService.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";
import type {AccountInput, TiltifyAccount, TiltifyMetadata} from "../../../types/user.ts";
import type {
  TiltifyAPIResult,
  TiltifyUserCampaignsResponse,
  TiltifyUserResponse
} from "../../../../model/TiltifyAPIModel.ts";
import type {AstroContext} from "../../../../AstroContext.ts";

/**
 * Service for Tiltify-specific operations with user context
 *
 * This service provides the same functionality as UserTiltifyService but
 * automatically uses the user context for authorization. It's designed to be
 * used in contexts where the user is already known, such as in Durable Objects.
 */
export class UserTiltifyServiceWithUser extends BaseUserServiceWithUser {
  private tiltifyService: UserTiltifyService;

  /**
   * Creates a new UserTiltifyServiceWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The ID of the user this service operates for
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv, userId);
    this.tiltifyService = new UserTiltifyService(env, repoEnv);
  }

  /**
   * Creates a UserTiltifyServiceWithUser instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param userId - The ID of the user this service operates for
   * @returns A UserTiltifyServiceWithUser instance
   */
  static action(ctx: ActionAPIContext, userId: number) {
    return new UserTiltifyServiceWithUser(ctx.locals.runtime.env, 'action', userId);
  }

  /**
   * Gets the Tiltify account for the current user
   * @returns The Tiltify account or null if not found
   * @throws {ServiceError} If there was an error retrieving the account
   */
  async getMyTiltifyAccount(): Promise<TiltifyAccount | undefined> {
    return await this.tiltifyService.getTiltifyAccount(this.userId, this.userId);
  }

  /**
   * Gets the Tiltify metadata for the current user
   * @returns The Tiltify metadata or null if not found
   * @throws {ServiceError} If there was an error retrieving the metadata
   */
  async getMyTiltifyMetadata(): Promise<TiltifyMetadata | undefined> {
    return await this.tiltifyService.getTiltifyMetadata(this.userId, this.userId);
  }

  /**
   * Gets a Tiltify account for another user
   * @param userId - The user ID
   * @returns The Tiltify account or null if not found
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   * @throws {ServiceError} If there was an error retrieving the account
   */
  async getTiltifyAccount(userId: number): Promise<TiltifyAccount | undefined> {
    return await this.tiltifyService.getTiltifyAccount(userId, this.userId);
  }

  /**
   * Gets Tiltify metadata for another user
   * @param userId - The user ID
   * @returns The Tiltify metadata or null if not found
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   * @throws {ServiceError} If there was an error retrieving the metadata
   */
  async getTiltifyMetadata(userId: number): Promise<TiltifyMetadata | undefined> {
    return await this.tiltifyService.getTiltifyMetadata(userId, this.userId);
  }

  /**
   * Creates a Tiltify account for the current user
   * @param data - The account data (without userId and provider)
   * @returns The created Tiltify account
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the account already exists
   */
  async createMyTiltifyAccount(data: Omit<AccountInput, 'userId' | 'provider'>): Promise<TiltifyAccount> {
    // Create a new object with the userId from the context
    const accountData: Omit<AccountInput, 'provider'> = {
      ...data,
      userId: this.userId
    };
    const result = await this.tiltifyService.createTiltifyAccount(accountData, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Updates the Tiltify account for the current user
   * @param data - The data to update
   * @returns The updated Tiltify account
   * @throws {NotFoundError} If the account doesn't exist
   * @throws {ValidationError} If the input data is invalid
   */
  async updateMyTiltifyAccount(data: Partial<Omit<AccountInput, 'userId' | 'provider'>>): Promise<TiltifyAccount> {
    const result = await this.tiltifyService.updateTiltifyAccount(this.userId, data, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Deletes the Tiltify account for the current user
   * @throws {NotFoundError} If the account doesn't exist
   */
  async deleteMyTiltifyAccount(): Promise<void> {
    await this.tiltifyService.deleteTiltifyAccount(this.userId, this.userId);
    await this.refreshDO();
  }

  /**
   * Synchronizes Tiltify data for the current user
   * @returns The updated Tiltify account
   * @throws {NotFoundError} If the account doesn't exist
   */
  async syncMyTiltifyData(): Promise<TiltifyAccount> {
    const result = await this.tiltifyService.syncTiltifyData(this.userId, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Creates a Tiltify account for another user (admin only)
   * @param userId - The user ID
   * @param data - The account data (without userId and provider)
   * @returns The created Tiltify account
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the account already exists
   */
  async createTiltifyAccount(userId: number, data: Omit<AccountInput, 'userId' | 'provider'>): Promise<TiltifyAccount> {
    // Create a new object with the provided userId
    const accountData: Omit<AccountInput, 'provider'> = {
      ...data,
      userId
    };
    return await this.tiltifyService.createTiltifyAccount(accountData, this.userId);
  }

  /**
   * Updates a Tiltify account for another user (admin only)
   * @param userId - The user ID
   * @param data - The data to update
   * @returns The updated Tiltify account
   * @throws {NotFoundError} If the user or account doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   */
  async updateTiltifyAccount(userId: number, data: Partial<Omit<AccountInput, 'userId' | 'provider'>>): Promise<TiltifyAccount> {
    return await this.tiltifyService.updateTiltifyAccount(userId, data, this.userId);
  }

  /**
   * Deletes a Tiltify account for another user (admin only)
   * @param userId - The user ID
   * @throws {NotFoundError} If the user or account doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   */
  async deleteTiltifyAccount(userId: number): Promise<void> {
    await this.tiltifyService.deleteTiltifyAccount(userId, this.userId);
  }

  /**
   * Synchronizes Tiltify data for another user (admin only)
   * @param userId - The user ID
   * @returns The updated Tiltify account
   * @throws {NotFoundError} If the user or account doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   */
  async syncTiltifyData(userId: number): Promise<TiltifyAccount> {
    return await this.tiltifyService.syncTiltifyData(userId, this.userId);
  }

  /**
   * Gets the current user from Tiltify
   * @param accessToken - The access token to use
   * @returns The user data or an error
   */
  async getTiltifyUser(accessToken: string): Promise<TiltifyAPIResult<TiltifyUserResponse>> {
    return await this.tiltifyService.getTiltifyUser(accessToken);
  }

  /**
   * Gets campaigns for a Tiltify user
   * @param tiltifyId - The Tiltify user ID
   * @returns The campaigns or an error
   */
  async getCampaignsByUser(tiltifyId: string): Promise<TiltifyUserCampaignsResponse> {
    return await this.tiltifyService.getCampaignsByUser(tiltifyId);
  }

  /**
   * Gets a token from the context
   * @param ctx - The Astro context
   * @returns The token or null
   */
  async getTokenFromContext(ctx: AstroContext): Promise<string | undefined> {
    return await this.tiltifyService.getTokenFromContext(ctx);
  }

  /**
   * Refreshes the user's Durable Object after Tiltify account changes
   */
  async refreshTiltify(): Promise<void> {
    await this.refreshDO();
  }
}
