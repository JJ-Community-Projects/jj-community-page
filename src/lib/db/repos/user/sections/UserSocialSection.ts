// src/lib/db/newRepos/user/sections/UserSocialSection.ts
import { and, eq } from "drizzle-orm";
import { BaseSection } from "../../base/BaseSection";
import type { RepoEnv } from "../../../../db/RepoEnv";
import { userSocials } from "../../../schema/auth-schema";
import type { UserSocial, UserSocialInsert } from "../../../types/user";
import { NotFoundError } from "../../../errors";

/**
 * Section for user social table operations
 */
export class UserSocialSection extends BaseSection<UserSocial, UserSocialInsert> {
  /**
   * Creates a new UserSocialSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a user social by its primary key (userId, provider)
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @returns The user social or undefined if not found
   */
  async findById(userId: number, provider: string): Promise<UserSocial | undefined> {
    try {
      return this.db.select()
        .from(userSocials)
        .where(and(
          eq(userSocials.userId, userId),
          eq(userSocials.provider, provider)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find user social for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Finds all user socials
   * @returns An array of user socials
   */
  async findAll(): Promise<UserSocial[]> {
    try {
      return await this.db.select()
        .from(userSocials)
        .all();
    } catch (error) {
      this.handleError("Failed to find all user socials", error);
    }
  }

  /**
   * Creates a new user social
   * @param data - The data for the new user social
   * @returns The created user social
   */
  async create(data: UserSocialInsert): Promise<UserSocial> {
    try {
      const [userSocial] = await this.db.insert(userSocials)
        .values(data)
        .returning();
      return userSocial as UserSocial;
    } catch (error) {
      this.handleError("Failed to create user social", error);
    }
  }

  /**
   * Updates a user social
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @param data - The data to update
   * @returns The updated user social
   */
  async update(userId: number, provider: string, data: Partial<UserSocialInsert>): Promise<UserSocial> {
    try {
      const [userSocial] = await this.db.update(userSocials)
        .set(data)
        .where(and(
          eq(userSocials.userId, userId),
          eq(userSocials.provider, provider)
        ))
        .returning();

      if (!userSocial) {
        throw new NotFoundError(`User social for user: ${userId} and provider: ${provider} not found`);
      }

      return userSocial as UserSocial;
    } catch (error) {
      this.handleError(`Failed to update user social for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Deletes a user social
   * @param userId - The ID of the user
   * @param provider - The provider name
   */
  async delete(userId: number, provider: string): Promise<void> {
    try {
      const result = await this.db.delete(userSocials)
        .where(and(
          eq(userSocials.userId, userId),
          eq(userSocials.provider, provider)
        ))
        .returning({ userId: userSocials.userId });

      if (result.length === 0) {
        throw new NotFoundError(`User social for user: ${userId} and provider: ${provider} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete user social for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Finds user socials by user ID
   * @param userId - The ID of the user
   * @returns An array of user socials
   */
  async findByUserId(userId: number): Promise<UserSocial[]> {
    try {
      return this.db.select()
        .from(userSocials)
        .where(eq(userSocials.userId, userId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find user socials for user: ${userId}`, error);
    }
  }

  /**
   * Finds user socials by provider
   * @param provider - The provider name
   * @returns An array of user socials
   */
  async findByProvider(provider: string): Promise<UserSocial[]> {
    try {
      return this.db.select()
        .from(userSocials)
        .where(eq(userSocials.provider, provider))
        .all();
    } catch (error) {
      this.handleError(`Failed to find user socials for provider: ${provider}`, error);
    }
  }

  /**
   * Updates a user social's URL
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @param url - The new URL
   * @returns The updated user social
   */
  async updateUrl(userId: number, provider: string, url: string): Promise<UserSocial> {
    try {
      return this.update(userId, provider, { url });
    } catch (error) {
      this.handleError(`Failed to update URL for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Checks if a user has a social for a specific provider
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @returns True if the user has a social for the provider
   */
  async hasSocial(userId: number, provider: string): Promise<boolean> {
    try {
      const userSocial = await this.findById(userId, provider);
      return !!userSocial;
    } catch (error) {
      this.handleError(`Failed to check if user: ${userId} has social for provider: ${provider}`, error);
    }
  }

  /**
   * Deletes all socials for a user
   * @param userId - The ID of the user
   */
  async deleteAllForUser(userId: number): Promise<void> {
    try {
      await this.db.delete(userSocials)
        .where(eq(userSocials.userId, userId))
        .execute();
    } catch (error) {
      this.handleError(`Failed to delete all socials for user: ${userId}`, error);
    }
  }
}
