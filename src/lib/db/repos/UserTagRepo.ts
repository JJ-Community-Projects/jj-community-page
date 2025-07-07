import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import {Repo, type RepoEnv} from "./Repo";
import {userTags} from "../schema/auth-schema";
import {type InferSelectModel, notInArray} from "drizzle-orm";
import {and, desc, eq, like, not, sql} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError";
import type {ActionAPIContext} from "astro:actions";

/**
 * Repository for working with user tags
 */
export class UserTagRepo extends Repo<typeof userTags._['config']> {
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv, userTags);
  }

  /**
   * Helper method to handle database errors consistently
   * @param message Error message
   * @param error Original error
   * @throws DatabaseError
   */
  private handleError(message: string, error: any): never {
    if (this.isAction()) {
      throw new DatabaseError(message, error).toActionError();
    } else {
      throw new DatabaseError(message, error);
    }
  }

  static action(ctx: ActionAPIContext) {
    return new UserTagRepo(ctx.locals.runtime.env, 'action')
  }

  static withEnv(env: Env, repoEnv: RepoEnv) {
    return new UserTagRepo(env, repoEnv)
  }

  /**
   * Get all tags for a user
   * @param userId The user ID
   * @returns Promise resolving to an array of user tags
   *
   * SQL: `SELECT * FROM "userTags" WHERE "userTags"."userId" = ?`
   */
  async getUserTags(userId: number): Promise<InferSelectModel<typeof userTags>[]> {
    try {
      return await this.db.select()
        .from(userTags)
        .where(eq(userTags.userId, userId))
        .all();
    } catch (error) {
      return this.handleError(`Failed to get tags for user with id: ${userId}`, error);
    }
  }

  /**
   * Add a tag to a user
   * @param userId The user ID
   * @param tag The tag to add
   * @param label The label for the tag
   * @returns Promise resolving to the created tag
   *
   * SQL: `INSERT INTO "userTags" ("userId", "tag", "label", "addedAt") VALUES (?, ?, ?, ?) RETURNING *`
   */
  async addTag(userId: number, tag: string, label: string): Promise<InferSelectModel<typeof userTags>> {
    try {
      const [result] = await this.db.insert(userTags)
        .values({
          userId,
          tag,
          label,
          addedAt: new Date()
        })
        .returning();

      return result;
    } catch (error) {
      return this.handleError(`Failed to add tag ${tag} to user with id: ${userId}`, error);
    }
  }

  /**
   * Remove a tag from a user
   * @param userId The user ID
   * @param tag The tag to remove
   * @returns Promise resolving to a boolean indicating if the tag was removed
   *
   * SQL: `DELETE FROM "userTags" WHERE ("userTags"."userId" = ? AND "userTags"."tag" = ?)`
   */
  async removeTag(userId: number, tag: string): Promise<boolean> {
    try {
      const result = await this.db.delete(userTags)
        .where(
          and(
            eq(userTags.userId, userId),
            eq(userTags.tag, tag)
          )
        )
        .run();

      return result.results.length > 0;
    } catch (error) {
      return this.handleError(`Failed to remove tag ${tag} from user with id: ${userId}`, error);
    }
  }

  /**
   * Get popular tags across all users
   * @param limit Maximum number of tags to return
   * @returns Promise resolving to an array of popular tags with counts
   *
   * SQL: `SELECT "userTags"."tag", "userTags"."label", count("userTags"."tag") as "count" FROM "userTags" GROUP BY "userTags"."tag" ORDER BY "count" DESC LIMIT ?`
   */
  async getPopularTags(limit: number = 5): Promise<{ tag: string, label: string, count: number }[]> {
    try {
      // Fetch from database
      const tags = await this.db
        .select({
          tag: userTags.tag,
          label: userTags.label,
          count: sql<number>`count(${userTags.tag})`.as('count')
        })
        .from(userTags)
        .groupBy(userTags.tag)
        .orderBy((s) => {
          return desc(s.count);
        })
        .all();

      // Return requested number of tags
      return tags.slice(0, limit);
    } catch (error) {
      return this.handleError(`Failed to get popular tags`, error);
    }
  }

  /**
   * Get suggested tags for a user
   * @param userId The user ID
   * @param limit Maximum number of tags to return
   * @returns Promise resolving to an array of suggested tags
   *
   * SQL:
   * 1. `SELECT "userTags"."tag" FROM "userTags" WHERE "userTags"."userId" = ?`
   * 2. `SELECT "userTags"."tag", "userTags"."label", count("userTags"."tag") as "count" FROM "userTags" WHERE "userTags"."tag" NOT IN (?) GROUP BY "userTags"."tag" ORDER BY "count" DESC LIMIT ?`
   */
  async getSuggestedTagsForUser(userId: number, limit: number = 5): Promise<{
    tag: string,
    label: string,
    count: number
  }[]> {
    try {
      // First, get all tags used by the user
      const userTagsResult = await this.db
        .select({ tag: userTags.tag })
        .from(userTags)
        .where(eq(userTags.userId, userId))
        .all();

      const userTagValues = userTagsResult.map(t => t.tag);

      // Find popular tags not used by the user
      return await this.db
        .select({
          tag: userTags.tag,
          label: userTags.label,
          count: sql<number>`count(${userTags.tag})`.as('count')
        })
        .from(userTags)
        .where(
          userTagValues.length > 0
            ? notInArray(userTags.tag, userTagValues)
            : undefined
        )
        .groupBy(userTags.tag)
        .orderBy((s) => {
          return desc(s.count);
        })
        .limit(limit)
        .all();
    } catch (error: any) {
      console.log('getSuggestedTagsForUser', error?.message, error);
      return this.handleError(`Failed to get suggested tags for user with id: ${userId}`, error);
    }
  }

  /**
   * Get suggested tags for a user by search term
   * @param userId The user ID
   * @param term The search term
   * @param limit Maximum number of tags to return
   * @returns Promise resolving to an array of suggested tags matching the search term
   *
   * SQL:
   * 1. `SELECT "userTags"."tag" FROM "userTags" WHERE "userTags"."userId" = ?`
   * 2. `SELECT "userTags"."tag", "userTags"."label", count("userTags"."tag") as "count" FROM "userTags" WHERE ("userTags"."tag" NOT IN (?) AND "userTags"."tag" LIKE ?) GROUP BY "userTags"."tag" ORDER BY "count" DESC LIMIT ?`
   */
  async getSuggestedTagsForUserBySearchTerm(userId: number, term: string, limit: number = 5): Promise<{
    tag: string,
    label: string,
    count: number
  }[]> {
    try {
      // First, get all tags used by the user
      const userTagsResult = await this.db
        .select({ tag: userTags.tag })
        .from(userTags)
        .where(eq(userTags.userId, userId))
        .all();

      const userTagValues = userTagsResult.map(t => t.tag);

      // Find popular tags not used by the user and matching the search term
      return await this.db
        .select({
          tag: userTags.tag,
          label: userTags.label,
          count: sql<number>`count(${userTags.tag})`.as('count')
        })
        .from(userTags)
        .where(
          and(
            userTagValues.length > 0
              ? notInArray(userTags.tag, userTagValues)
              : undefined,
            like(userTags.tag, `%${term.toLowerCase()}%`)
          )
        )
        .groupBy(userTags.tag)
        .orderBy((s) => {
          return desc(s.count);
        })
        .limit(limit)
        .all();
    } catch (error) {
      return this.handleError(`Failed to get suggested tags for user with id: ${userId} and term: ${term}`, error);
    }
  }

  /**
   * Add multiple tags to a user in a single batch operation
   * @param userId The user ID
   * @param tags Array of tag objects with tag and label
   * @returns Promise resolving to an array of created tags
   */
  async addTagsBatch(userId: number, tags: { tag: string, label: string }[]): Promise<InferSelectModel<typeof userTags>[]> {
    try {
      if (tags.length === 0) {
        return [];
      }

      // Get existing tags for this user
      const existingTags = await this.db.select()
        .from(userTags)
        .where(eq(userTags.userId, userId))
        .all();

      // Filter out tags that already exist
      const existingTagValues = existingTags.map(t => t.tag);
      const newTags = tags.filter(t => !existingTagValues.includes(t.tag));

      if (newTags.length === 0) {
        return existingTags;
      }

      // Prepare values for insertion
      const tagsToInsert = newTags.map(tag => ({
        userId,
        tag: tag.tag,
        label: tag.label,
        addedAt: new Date()
      }));

      // Insert new tags in a transaction
      const insertedTags = await this.db.transaction(async (tx) => {
        return await tx.insert(userTags)
          .values(tagsToInsert)
          .returning();
      });

      return [...existingTags.filter(et => tags.some(t => t.tag === et.tag)), ...insertedTags];
    } catch (error) {
      return this.handleError(`Failed to add tags in batch for user with id: ${userId}`, error);
    }
  }
}
