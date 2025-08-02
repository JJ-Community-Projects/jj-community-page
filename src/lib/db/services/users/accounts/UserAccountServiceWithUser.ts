import type {ActionAPIContext} from "astro:actions";
import {BaseUserServiceWithUser} from "../base/BaseUserServiceWithUser.ts";
import {UserAccountService} from "./UserAccountService.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";
import type {Account, AccountInput, UserWithAccounts} from "../../../types/user.ts";

/**
 * Service for user account management with user context
 *
 * This service provides the same functionality as UserAccountService but
 * automatically uses the user context for authorization. It's designed to be
 * used in contexts where the user is already known, such as in Durable Objects.
 */
export class UserAccountServiceWithUser extends BaseUserServiceWithUser {
  private accountService: UserAccountService;

  /**
   * Creates a new UserAccountServiceWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The ID of the user this service operates for
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv, userId);
    this.accountService = new UserAccountService(env, repoEnv);
  }

  /**
   * Creates a UserAccountServiceWithUser instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param userId - The ID of the user this service operates for
   * @returns A UserAccountServiceWithUser instance
   */
  static action(ctx: ActionAPIContext, userId: number) {
    return new UserAccountServiceWithUser(ctx.locals.runtime.env, 'action', userId);
  }

  /**
   * Gets all accounts for the current user
   * @returns An array of accounts
   * @throws {ServiceError} If there was an error retrieving the accounts
   */
  async getMyAccounts(): Promise<Account[]> {
    return await this.accountService.getUserAccounts(this.userId, this.userId);
  }

  /**
   * Gets an account by provider for the current user
   * @param provider - The provider
   * @returns The account or null if not found
   * @throws {ServiceError} If there was an error retrieving the account
   */
  async getMyAccountByProvider(provider: string): Promise<Account | undefined> {
    return await this.accountService.getAccountByProvider(this.userId, provider, this.userId);
  }

  /**
   * Adds an account to the current user
   * @param data - The account data (without userId)
   * @returns The updated user with accounts
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the account already exists
   */
  async addMyAccount(data: Omit<AccountInput, 'userId'>): Promise<UserWithAccounts> {
    // Create a new object with the userId from the context
    const accountData: AccountInput = {
      ...data,
      userId: this.userId
    };
    const result = await this.accountService.addAccount(accountData, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Removes an account from the current user
   * @param provider - The provider
   * @returns The updated user with accounts
   * @throws {NotFoundError} If the account doesn't exist
   */
  async removeMyAccount(provider: string): Promise<UserWithAccounts> {
    const result = await this.accountService.removeAccount(this.userId, provider, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Gets all accounts for another user
   * @param userId - The user ID
   * @returns An array of accounts
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   * @throws {ServiceError} If there was an error retrieving the accounts
   */
  async getUserAccounts(userId: number): Promise<Account[]> {
    return await this.accountService.getUserAccounts(userId, this.userId);
  }

  /**
   * Gets an account by provider for another user
   * @param userId - The user ID
   * @param provider - The provider
   * @returns The account or null if not found
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   * @throws {ServiceError} If there was an error retrieving the account
   */
  async getAccountByProvider(userId: number, provider: string): Promise<Account | undefined> {
    return await this.accountService.getAccountByProvider(userId, provider, this.userId);
  }

  /**
   * Adds an account to another user (admin only)
   * @param userId - The user ID
   * @param data - The account data (without userId)
   * @returns The updated user with accounts
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the account already exists
   */
  async addAccount(userId: number, data: Omit<AccountInput, 'userId'>): Promise<UserWithAccounts> {
    // Create a new object with the provided userId
    const accountData: AccountInput = {
      ...data,
      userId
    };
    return await this.accountService.addAccount(accountData, this.userId);
  }

  /**
   * Removes an account from another user (admin only)
   * @param userId - The user ID
   * @param provider - The provider
   * @returns The updated user with accounts
   * @throws {NotFoundError} If the user or account doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   */
  async removeAccount(userId: number, provider: string): Promise<UserWithAccounts> {
    return await this.accountService.removeAccount(userId, provider, this.userId);
  }

  /**
   * Refreshes the user's Durable Object after account changes
   */
  async refreshAccounts(): Promise<void> {
    await this.refreshDO();
  }
}
