// src/lib/db/newRepos/user/sections/UserTagSection.ts
import {and, eq} from "drizzle-orm";
import {BaseSection} from "../../base/BaseSection";
import type {RepoEnv} from "../../../../db/RepoEnv";
import {userTags} from "../../../schema/auth-schema";
import type {UserTag, UserTagInsert} from "../../../types/user";
import {NotFoundError} from "../../../errors";

/**
 * Section for user tag table operations
 */
export class UserTagSection extends BaseSection<UserTag, UserTagInsert> {
  /**
   * Creates a new UserTagSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a user tag by its primary key (userId, tag)
   * @param userId - The ID of the user
   * @param tag - The tag value
   * @returns The user tag or undefined if not found
   */
  async findById(userId: number, tag: string): Promise<UserTag | undefined> {
    try {
      return this.db.select()
        .from(userTags)
        .where(and(
          eq(userTags.userId, userId),
          eq(userTags.tag, tag)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find user tag: ${tag} for user: ${userId}`, error);
    }
  }

  /**
   * Finds all user tags
   * @returns An array of user tags
   */
  async findAll(): Promise<UserTag[]> {
    try {
      return await this.db.select()
        .from(userTags)
        .all();
    } catch (error) {
      this.handleError("Failed to find all user tags", error);
    }
  }

  /**
   * Creates a new user tag
   * @param data - The data for the new user tag
   * @returns The created user tag
   */
  async create(data: UserTagInsert): Promise<UserTag> {
    try {
      const [userTag] = await this.db.insert(userTags)
        .values(data)
        .returning();
      return userTag as UserTag;
    } catch (error) {
      this.handleError("Failed to create user tag", error);
    }
  }

  /**
   * Updates a user tag
   * @param userId - The ID of the user
   * @param tag - The tag value
   * @param data - The data to update
   * @returns The updated user tag
   */
  async update(userId: number, tag: string, data: Partial<UserTagInsert>): Promise<UserTag> {
    try {
      const [userTag] = await this.db.update(userTags)
        .set(data)
        .where(and(
          eq(userTags.userId, userId),
          eq(userTags.tag, tag)
        ))
        .returning();

      if (!userTag) {
        throw new NotFoundError(`User tag: ${tag} for user: ${userId} not found`);
      }

      return userTag as UserTag;
    } catch (error) {
      this.handleError(`Failed to update user tag: ${tag} for user: ${userId}`, error);
    }
  }

  /**
   * Deletes a user tag
   * @param userId - The ID of the user
   * @param tag - The tag value
   */
  async delete(userId: number, tag: string): Promise<void> {
    try {
      const result = await this.db.delete(userTags)
        .where(and(
          eq(userTags.userId, userId),
          eq(userTags.tag, tag)
        ))
        .returning({ tag: userTags.tag });

      if (result.length === 0) {
        throw new NotFoundError(`User tag: ${tag} for user: ${userId} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete user tag: ${tag} for user: ${userId}`, error);
    }
  }

  /**
   * Finds user tags by user ID
   * @param userId - The ID of the user
   * @returns An array of user tags
   */
  async findByUserId(userId: number): Promise<UserTag[]> {
    try {
      return this.db.select()
        .from(userTags)
        .where(eq(userTags.userId, userId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find user tags for user: ${userId}`, error);
    }
  }

  /**
   * Finds user tags by tag value
   * @param tag - The tag value
   * @returns An array of user tags
   */
  async findByTag(tag: string): Promise<UserTag[]> {
    try {
      return this.db.select()
        .from(userTags)
        .where(eq(userTags.tag, tag))
        .all();
    } catch (error) {
      this.handleError(`Failed to find user tags with tag: ${tag}`, error);
    }
  }

  /**
   * Checks if a user has a specific tag
   * @param userId - The ID of the user
   * @param tag - The tag value
   * @returns True if the user has the tag
   */
  async hasTag(userId: number, tag: string): Promise<boolean> {
    try {
      const userTag = await this.findById(userId, tag);
      return !!userTag;
    } catch (error) {
      this.handleError(`Failed to check if user: ${userId} has tag: ${tag}`, error);
    }
  }

  /**
   * Deletes all tags for a user
   * @param userId - The ID of the user
   */
  async deleteAllForUser(userId: number): Promise<void> {
    try {
      await this.db.delete(userTags)
        .where(eq(userTags.userId, userId))
        .execute();
    } catch (error) {
      this.handleError(`Failed to delete all tags for user: ${userId}`, error);
    }
  }
}
