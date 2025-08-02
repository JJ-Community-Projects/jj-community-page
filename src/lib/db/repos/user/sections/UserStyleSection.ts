// src/lib/db/newRepos/user/sections/UserStyleSection.ts
import { eq } from "drizzle-orm";
import { BaseSection } from "../../base/BaseSection";
import type { RepoEnv } from "../../../../db/RepoEnv";
import { userStyles } from "../../../schema/auth-schema";
import type { UserStyle, UserStyleInsert } from "../../../types/user";
import { NotFoundError } from "../../../errors";

/**
 * Section for user style table operations
 */
export class UserStyleSection extends BaseSection<UserStyle, UserStyleInsert> {
  /**
   * Creates a new UserStyleSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a user style by its primary key (userId)
   * @param userId - The ID of the user
   * @returns The user style or undefined if not found
   */
  async findById(userId: number): Promise<UserStyle | undefined> {
    try {
      return this.db.select()
        .from(userStyles)
        .where(eq(userStyles.userId, userId))
        .get();
    } catch (error) {
      this.handleError(`Failed to find user style for user: ${userId}`, error);
    }
  }

  /**
   * Finds all user styles
   * @returns An array of user styles
   */
  async findAll(): Promise<UserStyle[]> {
    try {
      return await this.db.select()
        .from(userStyles)
        .all();
    } catch (error) {
      this.handleError("Failed to find all user styles", error);
    }
  }

  /**
   * Creates a new user style
   * @param data - The data for the new user style
   * @returns The created user style
   */
  async create(data: UserStyleInsert): Promise<UserStyle> {
    try {
      const [userStyle] = await this.db.insert(userStyles)
        .values(data)
        .returning();
      return userStyle as UserStyle;
    } catch (error) {
      this.handleError("Failed to create user style", error);
    }
  }

  /**
   * Updates a user style
   * @param userId - The ID of the user
   * @param data - The data to update
   * @returns The updated user style
   */
  async update(userId: number, data: Partial<UserStyleInsert>): Promise<UserStyle> {
    try {
      const [userStyle] = await this.db.update(userStyles)
        .set(data)
        .where(eq(userStyles.userId, userId))
        .returning();

      if (!userStyle) {
        throw new NotFoundError(`User style for user: ${userId} not found`);
      }

      return userStyle as UserStyle;
    } catch (error) {
      this.handleError(`Failed to update user style for user: ${userId}`, error);
    }
  }

  /**
   * Deletes a user style
   * @param userId - The ID of the user
   */
  async delete(userId: number): Promise<void> {
    try {
      const result = await this.db.delete(userStyles)
        .where(eq(userStyles.userId, userId))
        .returning({ userId: userStyles.userId });

      if (result.length === 0) {
        throw new NotFoundError(`User style for user: ${userId} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete user style for user: ${userId}`, error);
    }
  }

  /**
   * Updates a user's primary color
   * @param userId - The ID of the user
   * @param primaryColor - The new primary color
   * @returns The updated user style
   */
  async updatePrimaryColor(userId: number, primaryColor: string): Promise<UserStyle> {
    try {
      return this.update(userId, { primaryColor });
    } catch (error) {
      this.handleError(`Failed to update primary color for user: ${userId}`, error);
    }
  }

  /**
   * Updates a user's accent color
   * @param userId - The ID of the user
   * @param accentColor - The new accent color
   * @returns The updated user style
   */
  async updateAccentColor(userId: number, accentColor: string): Promise<UserStyle> {
    try {
      return this.update(userId, { accentColor });
    } catch (error) {
      this.handleError(`Failed to update accent color for user: ${userId}`, error);
    }
  }

  /**
   * Updates a user's colors
   * @param userId - The ID of the user
   * @param primaryColor - The new primary color
   * @param accentColor - The new accent color
   * @returns The updated user style
   */
  async updateColors(userId: number, primaryColor: string, accentColor: string): Promise<UserStyle> {
    try {
      return this.update(userId, { primaryColor, accentColor });
    } catch (error) {
      this.handleError(`Failed to update colors for user: ${userId}`, error);
    }
  }

  /**
   * Gets or creates a user style
   * @param userId - The ID of the user
   * @returns The user style
   */
  async getOrCreate(userId: number): Promise<UserStyle> {
    try {
      const userStyle = await this.findById(userId);
      if (userStyle) {
        return userStyle;
      }

      return this.create({
        userId,
        primaryColor: '#E30E50', // Default primary color
        accentColor: '#3584BF'   // Default accent color
      });
    } catch (error) {
      this.handleError(`Failed to get or create user style for user: ${userId}`, error);
    }
  }
}
