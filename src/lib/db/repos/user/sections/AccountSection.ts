// src/lib/db/newRepos/user/sections/AccountSection.ts
import {and, eq} from "drizzle-orm";
import {BaseSection} from "../..//base/BaseSection";
import type {RepoEnv} from "../../../../db/RepoEnv";
import {accounts} from "../../../schema/auth-schema";
import type {Account, AccountInsert} from "../../../types/user";
import {NotFoundError} from "../../../errors";

/**
 * Section for account table operations
 */
export class AccountSection extends BaseSection<Account, AccountInsert> {
  /**
   * Creates a new AccountSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds an account by its primary key (userId, provider)
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @returns The account or undefined if not found
   */
  async find(userId: number, provider: string): Promise<Account | undefined> {
    try {
      return this.db.select()
        .from(accounts)
        .where(and(
          eq(accounts.userId, userId),
          eq(accounts.provider, provider)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find account for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Finds all accounts
   * @returns An array of accounts
   */
  async findAll(): Promise<Account[]> {
    try {
      return await this.db.select()
        .from(accounts)
        .all();
    } catch (error) {
      this.handleError("Failed to find all accounts", error);
    }
  }

  /**
   * Creates a new account
   * @param data - The data for the new account
   * @returns The created account
   */
  async create(data: AccountInsert): Promise<Account> {
    try {
      const [account] = await this.db.insert(accounts)
        .values(data)
        .returning();
      return account as Account;
    } catch (error) {
      this.handleError("Failed to create account", error);
    }
  }

  /**
   * Updates an account
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @param data - The data to update
   * @returns The updated account
   */
  async update(userId: number, provider: string, data: Partial<AccountInsert>): Promise<Account> {
    try {
      const [account] = await this.db.update(accounts)
        .set(data)
        .where(and(
          eq(accounts.userId, userId),
          eq(accounts.provider, provider)
        ))
        .returning();

      if (!account) {
        throw new NotFoundError(`Account for user: ${userId} and provider: ${provider} not found`);
      }

      return account as Account;
    } catch (error) {
      this.handleError(`Failed to update account for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Deletes an account
   * @param userId - The ID of the user
   * @param provider - The provider name
   */
  async delete(userId: number, provider: string): Promise<void> {
    try {
      const result = await this.db.delete(accounts)
        .where(and(
          eq(accounts.userId, userId),
          eq(accounts.provider, provider)
        ))
        .returning({ userId: accounts.userId });

      if (result.length === 0) {
        throw new NotFoundError(`Account for user: ${userId} and provider: ${provider} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete account for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Finds accounts by user ID
   * @param userId - The ID of the user
   * @returns An array of accounts
   */
  async findByUserId(userId: number): Promise<Account[]> {
    try {
      return this.db.select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find accounts for user: ${userId}`, error);
    }
  }

  /**
   * Finds accounts by provider
   * @param provider - The provider name
   * @returns An array of accounts
   */
  async findByProvider(provider: string): Promise<Account[]> {
    try {
      return this.db.select()
        .from(accounts)
        .where(eq(accounts.provider, provider))
        .all();
    } catch (error) {
      this.handleError(`Failed to find accounts for provider: ${provider}`, error);
    }
  }

  /**
   * Finds an account by provider and provider ID
   * @param provider - The provider name
   * @param providerId - The provider-specific ID
   * @returns The account or undefined if not found
   */
  async findByProviderAndProviderId(provider: string, providerId: string): Promise<Account | undefined> {
    try {
      return this.db.select()
        .from(accounts)
        .where(and(
          eq(accounts.provider, provider),
          eq(accounts.providerId, providerId)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find account for provider: ${provider} and provider ID: ${providerId}`, error);
    }
  }

  /**
   * Updates an account's metadata
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @param meta - The new metadata
   * @returns The updated account
   */
  async updateMeta(userId: number, provider: string, meta: any): Promise<Account> {
    try {
      return this.update(userId, provider, { meta });
    } catch (error) {
      this.handleError(`Failed to update metadata for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Checks if an account exists
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @returns True if the account exists
   */
  async exists(userId: number, provider: string): Promise<boolean> {
    try {
      const account = await this.find(userId, provider);
      return !!account;
    } catch (error) {
      this.handleError(`Failed to check if account exists for user: ${userId} and provider: ${provider}`, error);
    }
  }
}
