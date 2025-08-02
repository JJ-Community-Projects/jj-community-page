import type {ActionAPIContext} from "astro:actions";
import {BaseUserService} from "../base/BaseUserService.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";
import {DuplicateError, NotFoundError, ServiceError, ValidationError} from "../../../errors";
import type {Account, AccountInput, UserWithAccounts} from "../../../types/user.ts";
import {UserService} from "../UserService.ts";

/**
 * Service for user account management
 *
 * This service handles operations related to external provider accounts
 * (OAuth providers like Tiltify, Twitch, etc.) linked to users. It provides
 * methods for adding, removing, and retrieving accounts.
 * Using the Tiltify service is preferred
 */
export class UserAccountService extends BaseUserService {
  private userService: UserService;

  /**
   * Creates a new UserAccountService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.userService = new UserService(env, repoEnv);
  }

  /**
   * Creates a UserAccountService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A UserAccountService instance
   */
  static action(ctx: ActionAPIContext) {
    return new UserAccountService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Gets all accounts for a user
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns An array of accounts
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {ServiceError} If there was an error retrieving the accounts
   */
  async getUserAccounts(userId: number, requestingUserId?: number): Promise<Account[]> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    // Authorization check (only the user themselves or an admin can see accounts)
    if (requestingUserId && userId !== requestingUserId) {
      await this.authService.ensureIsAdmin(requestingUserId);
    }

    try {
      return await this.userRepo.getAccountSection().findByUserId(userId);
    } catch (error) {
      console.error(`Failed to get accounts for user: ${userId}`, error);
      throw new ServiceError(`Failed to get accounts for user: ${userId}`, error);
    }
  }

  /**
   * Adds an account to a user
   * @param data - The account data
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user with accounts
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the account already exists
   */
  async addAccount(data: AccountInput, requestingUserId: number): Promise<UserWithAccounts> {
    // Check if user exists
    const user = await this.userService.getUserById(data.userId, requestingUserId);

    // Authorization check (only the user themselves or an admin can add accounts)
    await this.authService.ensureCanModifyUser(data.userId, requestingUserId);

    // Validate input
    this.validateAccountInput(data);

    try {
      // Create account
      await this.userRepo.getAccountSection().create(data);

      // Get all accounts for the user
      const accounts = await this.userRepo.getAccountSection().findByUserId(data.userId);

      // Return user with accounts
      return {
        ...user,
        accounts
      };
    } catch (error) {
      // Handle specific errors
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error adding account:", error);
      throw new ServiceError("Failed to add account", error);
    }
  }

  /**
   * Removes an account from a user
   * @param userId - The user ID
   * @param provider - The provider
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user with accounts
   * @throws {NotFoundError} If the user or account doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async removeAccount(userId: number, provider: string, requestingUserId: number): Promise<UserWithAccounts> {
    // Check if user exists
    const user = await this.userService.getUserById(userId, requestingUserId);

    // Authorization check (only the user themselves or an admin can remove accounts)
    await this.authService.ensureCanModifyUser(userId, requestingUserId);

    // Check if account exists
    const hasAccount = await this.userRepo.getAccountSection().exists(userId, provider);
    if (!hasAccount) {
      throw new NotFoundError(`Account with provider ${provider} not found for user ${userId}`);
    }

    try {
      // Delete account
      await this.userRepo.getAccountSection().delete(userId, provider);

      // Get remaining accounts
      const accounts = await this.userRepo.getAccountSection().findByUserId(userId);

      // Return user with accounts
      return {
        ...user,
        accounts
      };
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error removing account:", error);
      throw new ServiceError("Failed to remove account", error);
    }
  }

  /**
   * Gets an account by provider and user ID
   * @param userId - The user ID
   * @param provider - The provider
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns The account or null if not found
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async getAccountByProvider(userId: number, provider: string, requestingUserId?: number): Promise<Account | undefined> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    // Authorization check (only the user themselves or an admin can see accounts)
    if (requestingUserId && userId !== requestingUserId) {
      await this.authService.ensureIsAdmin(requestingUserId);
    }

    try {
      return this.userRepo.getAccountSection().find(userId, provider);
    } catch (error) {
      console.error(`Failed to get account for user: ${userId} and provider: ${provider}`, error);
      throw new ServiceError(`Failed to get account for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Validates account input data
   * @param data - The account data to validate
   * @throws {ValidationError} If the input data is invalid
   */
  private validateAccountInput(data: AccountInput): void {
    if (!data.provider || data.provider.trim() === '') {
      throw new ValidationError("Provider is required");
    }

    if (!data.providerId || data.providerId.trim() === '') {
      throw new ValidationError("Provider ID is required");
    }

    if (!data.providerUsername || data.providerUsername.trim() === '') {
      throw new ValidationError("Provider username is required");
    }
  }
}
