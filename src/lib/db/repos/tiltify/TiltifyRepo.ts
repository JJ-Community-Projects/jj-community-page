// src/lib/db/newRepos/tiltify/TiltifyRepo.ts
// @ts-ignore
import type { ActionAPIContext } from "astro:actions";
import { BaseRepo } from "../base/BaseRepo";
import type { RepoEnv } from "../../../db/RepoEnv";
import { TiltifySection } from "./sections/TiltifySection";
import type { Account, AccountInput } from "../../../db/types/user";
import { NotFoundError } from "../../../db/errors";

/**
 * Repository for Tiltify domain operations
 * Coordinates Tiltify-related sections
 */
export class TiltifyRepo extends BaseRepo {
  private readonly tiltifySection: TiltifySection;

  /**
   * Creates a new TiltifyRepo instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.tiltifySection = new TiltifySection(env, repoEnv);
  }

  /**
   * Creates a TiltifyRepo instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A TiltifyRepo instance
   */
  static action(ctx: ActionAPIContext) {
    return new TiltifyRepo(ctx.locals.runtime.env, 'action');
  }

  /**
   * Gets the Tiltify section
   * @returns The Tiltify section
   */
  getTiltifySection(): TiltifySection {
    return this.tiltifySection;
  }

  /**
   * Finds a Tiltify account by provider ID
   * @param providerId - The Tiltify provider ID
   * @returns The account or undefined if not found
   */
  async findByProviderId(providerId: string): Promise<Account | undefined> {
    try {
      return await this.tiltifySection.findByProviderId(providerId);
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
      return await this.tiltifySection.findByUserId(userId);
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
      return await this.tiltifySection.findAll();
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
      return await this.tiltifySection.create(data);
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
      return await this.tiltifySection.update(userId, data);
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
      await this.tiltifySection.delete(userId);
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
      return await this.tiltifySection.exists(userId);
    } catch (error) {
      this.handleError(`Failed to check if user ${userId} has a Tiltify account`, error);
      return false;
    }
  }
}

/**
 * Repository for Tiltify operations scoped to a specific user
 */
export class TiltifyRepoWithUser extends BaseRepo {
  private userId: number;
  private repo: TiltifyRepo;

  /**
   * Creates a new TiltifyRepoWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The user ID
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv);
    this.userId = userId;
    this.repo = new TiltifyRepo(env, repoEnv);
  }

  /**
   * Gets the Tiltify account for this user
   * @returns The Tiltify account or null if not found
   */
  async getAccount(): Promise<Account | null> {
    try {
      return await this.repo.findByUserId(this.userId);
    } catch (error) {
      this.handleError(`Failed to get Tiltify account for user: ${this.userId}`, error);
    }
  }

  /**
   * Creates a Tiltify account for this user
   * @param data - The data for the new Tiltify account
   * @returns The created Tiltify account
   */
  async createAccount(data: Omit<AccountInput, 'provider' | 'userId'>): Promise<Account> {
    try {
      return await this.repo.create({
        ...data,
        userId: this.userId
      });
    } catch (error) {
      this.handleError(`Failed to create Tiltify account for user: ${this.userId}`, error);
    }
  }

  /**
   * Updates the Tiltify account for this user
   * @param data - The data to update
   * @returns The updated Tiltify account
   */
  async updateAccount(data: Partial<Omit<AccountInput, 'provider' | 'userId'>>): Promise<Account> {
    try {
      const account = await this.getAccount();
      if (!account) {
        throw new NotFoundError(`Tiltify account for user ${this.userId} not found`);
      }

      return await this.repo.update(this.userId, data);
    } catch (error) {
      this.handleError(`Failed to update Tiltify account for user: ${this.userId}`, error);
    }
  }

  /**
   * Deletes the Tiltify account for this user
   */
  async deleteAccount(): Promise<void> {
    try {
      const account = await this.getAccount();
      if (!account) {
        throw new NotFoundError(`Tiltify account for user ${this.userId} not found`);
      }

      await this.repo.delete(this.userId);
    } catch (error) {
      this.handleError(`Failed to delete Tiltify account for user: ${this.userId}`, error);
    }
  }

  /**
   * Checks if this user has a Tiltify account
   * @returns True if the user has a Tiltify account, false otherwise
   */
  async hasAccount(): Promise<boolean> {
    try {
      return await this.repo.exists(this.userId);
    } catch (error) {
      this.handleError(`Failed to check if user ${this.userId} has a Tiltify account`, error);
      return false;
    }
  }
}
