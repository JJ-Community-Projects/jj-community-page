// src/lib/db/newRepos/tiltify/sections/TiltifySection.ts
import { and, eq } from "drizzle-orm";
import type { ActionAPIContext } from "astro:actions";
import type { RepoEnv } from "../../../../db/RepoEnv";
import { accounts } from "../../../../db/schema/auth-schema.ts";
import type { Account, AccountInput } from "../../../../db/types/user.ts";
import { DuplicateError, NotFoundError } from "../../../../db/errors";
import { BaseTiltifySection } from "../base/BaseTiltifySection.ts";

/**
 * Section for Tiltify account operations
 */
export class TiltifySection extends BaseTiltifySection<Account, AccountInput> {
  /** The account provider name */
  private readonly provider = 'tiltify';

  /**
   * Creates a new TiltifySection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Creates a TiltifySection instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A TiltifySection instance
   */
  static action(ctx: ActionAPIContext) {
    return new TiltifySection(ctx.locals.runtime.env, 'action');
  }

  /**
   * Finds a Tiltify account by provider ID
   * @param providerId - The Tiltify provider ID
   * @returns The account or undefined if not found
   */
  async findByProviderId(providerId: string): Promise<Account | undefined> {
    try {
      return await this.db.select()
        .from(accounts)
        .where(and(
          eq(accounts.providerId, providerId),
          eq(accounts.provider, this.provider)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find Tiltify account by provider ID: ${providerId}`, error);
    }
  }

  /**
   * Finds a Tiltify account by user ID
   * @param userId - The user ID
   * @returns The Tiltify account or null if not found
   */
  async findByUserId(userId: number): Promise<Account | null> {
    try {
      return await this.db.select()
        .from(accounts)
        .where(and(
          eq(accounts.userId, userId),
          eq(accounts.provider, this.provider)
        ))
        .get() || null;
    } catch (error) {
      this.handleError(`Failed to find Tiltify account by user ID: ${userId}`, error);
    }
  }

  /**
   * Gets all Tiltify accounts
   * @returns An array of Tiltify accounts
   */
  async findAll(): Promise<Account[]> {
    try {
      return await this.db.select()
        .from(accounts)
        .where(eq(accounts.provider, this.provider))
        .all();
    } catch (error) {
      this.handleError("Failed to get all Tiltify accounts", error);
      return [];
    }
  }

  /**
   * Creates a new Tiltify account
   * @param data - The account data
   * @returns The created account
   */
  async create(data: Omit<AccountInput, 'provider'>): Promise<Account> {
    try {
      // Check if account already exists
      const existing = await this.findByProviderId(data.providerId);
      if (existing) {
        throw new DuplicateError(`Tiltify account with provider ID ${data.providerId} already exists`);
      }

      const [result] = await this.db.insert(accounts)
        .values({
          userId: data.userId,
          provider: this.provider,
          providerId: data.providerId,
          providerUsername: data.providerUsername,
          createdAt: new Date(),
          updatedAt: new Date(),
          meta: data.meta
        })
        .returning();

      return result;
    } catch (error) {
      this.handleError(`Failed to create Tiltify account for user: ${data.userId}`, error);
    }
  }

  /**
   * Updates a Tiltify account
   * @param userId - The user ID
   * @param data - The account data to update
   * @returns The updated account
   */
  async update(userId: number, data: Partial<Omit<AccountInput, 'provider'>>): Promise<Account> {
    try {
      const [result] = await this.db.update(accounts)
        .set({
          providerUsername: data.providerUsername,
          updatedAt: new Date(),
          meta: data.meta
        })
        .where(and(
          eq(accounts.userId, userId),
          eq(accounts.provider, this.provider)
        ))
        .returning();

      if (!result) {
        throw new NotFoundError(`Tiltify account for user ID ${userId} not found`);
      }

      return result;
    } catch (error) {
      this.handleError(`Failed to update Tiltify account for user: ${userId}`, error);
    }
  }

  /**
   * Deletes a Tiltify account
   * @param userId - The user ID
   */
  async delete(userId: number): Promise<void> {
    try {
      await this.db.delete(accounts)
        .where(and(
          eq(accounts.userId, userId),
          eq(accounts.provider, this.provider)
        ))
        .run();
    } catch (error) {
      this.handleError(`Failed to delete Tiltify account for user: ${userId}`, error);
    }
  }

  /**
   * Checks if a user has a Tiltify account
   * @param userId - The user ID
   * @returns True if the user has a Tiltify account, false otherwise
   */
  async exists(userId: number): Promise<boolean> {
    try {
      const count = await this.db.$count(accounts,
        and(
          eq(accounts.userId, userId),
          eq(accounts.provider, this.provider)
        ));
      return count > 0;
    } catch (error) {
      this.handleError(`Failed to check if user ${userId} has a Tiltify account`, error);
      return false;
    }
  }
}
