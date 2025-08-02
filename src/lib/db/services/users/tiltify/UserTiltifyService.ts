import type {ActionAPIContext} from "astro:actions";
import {BaseUserService} from "../base/BaseUserService.ts";
import {TiltifyWebService} from "../../../../externalAPI/TiltifyWebService.ts";
import {DuplicateError, NotFoundError, ServiceError, ValidationError} from "../../../errors";
import type {Account, AccountInput, TiltifyAccount, TiltifyMetadata} from "../../../types/user.ts";
import type {
  TiltifyAPIResult,
  TiltifyUserCampaignsResponse,
  TiltifyUserResponse
} from "../../../../model/TiltifyAPIModel.ts";
import type {AstroContext} from "../../../../AstroContext.ts";
import {UserService} from "../UserService.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";

/**
 * Service for Tiltify-specific operations
 *
 * This service handles operations related to Tiltify accounts, including
 * creating, updating, and deleting accounts, as well as fetching Tiltify
 * user data and campaigns. It provides methods for interacting with the
 * Tiltify API and managing Tiltify account data in the database.
 */
export class UserTiltifyService extends BaseUserService {
  private tiltifyAPIService: TiltifyWebService;
  private userService: UserService;

  /**
   * Creates a new UserTiltifyService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.tiltifyAPIService = new TiltifyWebService(env, repoEnv);
    this.userService = new UserService(env, repoEnv);
  }

  /**
   * Creates a UserTiltifyService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A UserTiltifyService instance
   */
  static action(ctx: ActionAPIContext) {
    return new UserTiltifyService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Gets a Tiltify account by user ID
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns The Tiltify account or null if not found
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async getTiltifyAccount(userId: number, requestingUserId?: number): Promise<TiltifyAccount | undefined> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    // Authorization check (only the user themselves or an admin can see the account)
    if (requestingUserId && userId !== requestingUserId) {
      await this.authService.ensureIsAdmin(requestingUserId);
    }

    try {
      return await this.tiltifyRepo.findByUserId(userId);
    } catch (error) {
      console.error(`Failed to get Tiltify account for user: ${userId}`, error);
      throw new ServiceError(`Failed to get Tiltify account for user: ${userId}`, error);
    }
  }

  /**
   * Gets Tiltify metadata for a user
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns The Tiltify metadata or null if not found
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async getTiltifyMetadata(userId: number, requestingUserId?: number): Promise<TiltifyMetadata | undefined> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    try {
      return await this.tiltifyRepo.getMetadata(userId);
    } catch (error) {
      console.error(`Failed to get Tiltify metadata for user: ${userId}`, error);
      throw new ServiceError(`Failed to get Tiltify metadata for user: ${userId}`, error);
    }
  }

  /**
   * Gets a Tiltify account by provider ID
   * @param providerId - The Tiltify provider ID
   * @returns The Tiltify account or null if not found
   * @throws {ServiceError} If there was an error retrieving the account
   */
  async getTiltifyAccountByProviderId(providerId: string): Promise<Account | undefined> {
    try {
      const account = await this.tiltifyRepo.findByProviderId(providerId);
      return account || undefined;
    } catch (error) {
      console.error(`Failed to get Tiltify account with provider ID: ${providerId}`, error);
      throw new ServiceError(`Failed to get Tiltify account with provider ID: ${providerId}`, error);
    }
  }

  /**
   * Creates a Tiltify account for a user
   * @param data - The account data (without provider)
   * @param requestingUserId - The ID of the user making the request
   * @returns The created Tiltify account
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the account already exists
   */
  async createTiltifyAccount(data: Omit<AccountInput, 'provider'>, requestingUserId: number): Promise<TiltifyAccount> {
    // Check if user exists
    await this.userService.getUserById(data.userId, requestingUserId);

    // Authorization check (only the user themselves or an admin can create an account)
    await this.authService.ensureCanModifyUser(data.userId, requestingUserId);

    // Validate input
    this.validateTiltifyAccountInput(data);

    try {
      // Create the account with provider set to 'tiltify'
      const accountData: AccountInput = {
        ...data,
        provider: 'tiltify'
      };

      return await this.tiltifyRepo.create(accountData);
    } catch (error) {
      if (error instanceof DuplicateError || error instanceof ValidationError) {
        throw error;
      }
      console.error(`Failed to create Tiltify account for user: ${data.userId}`, error);
      throw new ServiceError(`Failed to create Tiltify account for user: ${data.userId}`, error);
    }
  }

  /**
   * Updates a Tiltify account
   * @param userId - The user ID
   * @param data - The data to update
   * @param requestingUserId - The ID of the user making the request
   * @returns The updated Tiltify account
   * @throws {NotFoundError} If the account doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   */
  async updateTiltifyAccount(userId: number, data: Partial<Omit<AccountInput, 'provider' | 'userId'>>, requestingUserId: number): Promise<TiltifyAccount> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    // Authorization check (only the account owner or an admin can update)
    await this.authService.ensureCanModifyUser(userId, requestingUserId);

    // Check if account exists
    const account = await this.getTiltifyAccount(userId, requestingUserId);
    if (!account) {
      throw new NotFoundError(`Tiltify account for user ${userId} not found`);
    }

    try {
      // Update the account
      return await this.tiltifyRepo.update(userId, data);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error(`Failed to update Tiltify account for user: ${userId}`, error);
      throw new ServiceError(`Failed to update Tiltify account for user: ${userId}`, error);
    }
  }

  /**
   * Deletes a Tiltify account
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request
   * @throws {NotFoundError} If the account doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async deleteTiltifyAccount(userId: number, requestingUserId: number): Promise<void> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    // Authorization check (only the account owner or an admin can delete)
    await this.authService.ensureCanModifyUser(userId, requestingUserId);

    // Check if account exists
    const account = await this.getTiltifyAccount(userId, requestingUserId);
    if (!account) {
      throw new NotFoundError(`Tiltify account for user ${userId} not found`);
    }

    try {
      // Delete the account
      await this.tiltifyRepo.delete(userId);
    } catch (error) {
      console.error(`Failed to delete Tiltify account for user: ${userId}`, error);
      throw new ServiceError(`Failed to delete Tiltify account for user: ${userId}`, error);
    }
  }

  /**
   * Synchronizes Tiltify data for a user
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request
   * @returns The updated Tiltify account
   * @throws {NotFoundError} If the user or account doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async syncTiltifyData(userId: number, requestingUserId: number): Promise<TiltifyAccount> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    // Authorization check (only the account owner or an admin can sync)
    await this.authService.ensureCanModifyUser(userId, requestingUserId);

    // Check if account exists
    const account = await this.getTiltifyAccount(userId, requestingUserId);
    if (!account) {
      throw new NotFoundError(`Tiltify account for user ${userId} not found`);
    }

    try {
      // Get token for the user
      const token = await this.tiltifyRepo.getToken(userId);
      if (!token) {
        throw new NotFoundError(`Tiltify token for user ${userId} not found`);
      }

      // Get user data from Tiltify API
      const userData = await this.tiltifyAPIService.getUser(token.accessToken);
      if (!userData.data) {
        throw new ServiceError(`Failed to get Tiltify user data for user ${userId}`);
      }

      // Update account with new data
      const account = await  this.tiltifyRepo.update(userId, {
        meta: userData.data
      });

      return account as TiltifyAccount;
    } catch (error) {
      console.error(`Failed to sync Tiltify data for user: ${userId}`, error);
      throw new ServiceError(`Failed to sync Tiltify data for user: ${userId}`, error);
    }
  }

  /**
   * Gets the current user from Tiltify
   * @param accessToken - The access token to use
   * @returns The user data or an error
   */
  async getTiltifyUser(accessToken: string): Promise<TiltifyAPIResult<TiltifyUserResponse>> {
    return await this.tiltifyAPIService.getUser(accessToken);
  }

  /**
   * Gets campaigns by user
   * @param tiltifyId - The Tiltify user ID
   * @returns The campaigns or an error
   */
  async getCampaignsByUser(tiltifyId: string): Promise<TiltifyUserCampaignsResponse> {
    return await this.tiltifyAPIService.getCampaignsByUser(tiltifyId);
  }

  /**
   * Gets a token from the context
   * @param ctx - The Astro context
   * @returns The token or null
   */
  async getTokenFromContext(ctx: AstroContext): Promise<string | undefined> {
    return await this.tiltifyAPIService.getTokenFromContext(ctx);
  }

  /**
   * Validates Tiltify account input data
   * @param data - The data to validate
   * @throws {ValidationError} If the input data is invalid
   */
  private validateTiltifyAccountInput(data: Omit<AccountInput, 'provider'>): void {
    if (!data.providerId || data.providerId.trim() === '') {
      throw new ValidationError("Tiltify provider ID is required");
    }

    if (!data.providerUsername || data.providerUsername.trim() === '') {
      throw new ValidationError("Tiltify username is required");
    }

    if (data.userId === undefined || data.userId === null) {
      throw new ValidationError("User ID is required");
    }
  }
}
