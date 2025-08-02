// src/lib/db/newRepos/user/sections/BlockedAccountSection.ts
import { and, eq } from "drizzle-orm";
import { BaseSection } from "../../base/BaseSection";
import type { RepoEnv } from "../../../../db/RepoEnv";
import { blockedAccounts } from "../../../schema/auth-schema";
import type { BlockedAccount, BlockedAccountInsert } from "../../../types/user";
import { NotFoundError } from "../../../errors";

/**
 * Section for blocked account table operations
 */
export class BlockedAccountSection extends BaseSection<BlockedAccount, BlockedAccountInsert> {
  /**
   * Creates a new BlockedAccountSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a blocked account by its primary key (providerId, provider)
   * @param providerId - The provider-specific ID
   * @param provider - The provider name
   * @returns The blocked account or undefined if not found
   */
  async findById(providerId: string, provider: string): Promise<BlockedAccount | undefined> {
    try {
      return this.db.select()
        .from(blockedAccounts)
        .where(and(
          eq(blockedAccounts.providerId, providerId),
          eq(blockedAccounts.provider, provider)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find blocked account for provider ID: ${providerId} and provider: ${provider}`, error);
    }
  }

  /**
   * Finds all blocked accounts
   * @returns An array of blocked accounts
   */
  async findAll(): Promise<BlockedAccount[]> {
    try {
      return await this.db.select()
        .from(blockedAccounts)
        .all();
    } catch (error) {
      this.handleError("Failed to find all blocked accounts", error);
    }
  }

  /**
   * Creates a new blocked account
   * @param data - The data for the new blocked account
   * @returns The created blocked account
   */
  async create(data: BlockedAccountInsert): Promise<BlockedAccount> {
    try {
      const [blockedAccount] = await this.db.insert(blockedAccounts)
        .values(data)
        .returning();
      return blockedAccount as BlockedAccount;
    } catch (error) {
      this.handleError("Failed to create blocked account", error);
    }
  }

  /**
   * Updates a blocked account
   * @param providerId - The provider-specific ID
   * @param provider - The provider name
   * @param data - The data to update
   * @returns The updated blocked account
   */
  async update(providerId: string, provider: string, data: Partial<BlockedAccountInsert>): Promise<BlockedAccount> {
    try {
      const [blockedAccount] = await this.db.update(blockedAccounts)
        .set(data)
        .where(and(
          eq(blockedAccounts.providerId, providerId),
          eq(blockedAccounts.provider, provider)
        ))
        .returning();

      if (!blockedAccount) {
        throw new NotFoundError(`Blocked account for provider ID: ${providerId} and provider: ${provider} not found`);
      }

      return blockedAccount as BlockedAccount;
    } catch (error) {
      this.handleError(`Failed to update blocked account for provider ID: ${providerId} and provider: ${provider}`, error);
    }
  }

  /**
   * Deletes a blocked account
   * @param providerId - The provider-specific ID
   * @param provider - The provider name
   */
  async delete(providerId: string, provider: string): Promise<void> {
    try {
      const result = await this.db.delete(blockedAccounts)
        .where(and(
          eq(blockedAccounts.providerId, providerId),
          eq(blockedAccounts.provider, provider)
        ))
        .returning({ providerId: blockedAccounts.providerId });

      if (result.length === 0) {
        throw new NotFoundError(`Blocked account for provider ID: ${providerId} and provider: ${provider} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete blocked account for provider ID: ${providerId} and provider: ${provider}`, error);
    }
  }

  /**
   * Finds blocked accounts by provider
   * @param provider - The provider name
   * @returns An array of blocked accounts
   */
  async findByProvider(provider: string): Promise<BlockedAccount[]> {
    try {
      return this.db.select()
        .from(blockedAccounts)
        .where(eq(blockedAccounts.provider, provider))
        .all();
    } catch (error) {
      this.handleError(`Failed to find blocked accounts for provider: ${provider}`, error);
    }
  }

  /**
   * Updates a blocked account's reason
   * @param providerId - The provider-specific ID
   * @param provider - The provider name
   * @param reason - The new reason
   * @returns The updated blocked account
   */
  async updateReason(providerId: string, provider: string, reason: string): Promise<BlockedAccount> {
    try {
      return this.update(providerId, provider, { reason });
    } catch (error) {
      this.handleError(`Failed to update reason for provider ID: ${providerId} and provider: ${provider}`, error);
    }
  }

  /**
   * Checks if an account is blocked
   * @param providerId - The provider-specific ID
   * @param provider - The provider name
   * @returns True if the account is blocked
   */
  async isBlocked(providerId: string, provider: string): Promise<boolean> {
    try {
      const blockedAccount = await this.findById(providerId, provider);
      return !!blockedAccount;
    } catch (error) {
      this.handleError(`Failed to check if account is blocked for provider ID: ${providerId} and provider: ${provider}`, error);
    }
  }
}
