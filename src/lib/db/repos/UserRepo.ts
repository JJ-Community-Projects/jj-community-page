import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import {Repo, type RepoEnv} from "./Repo";
import {accounts, blockedAccounts, users, userSocials, userTags} from "../schema/auth-schema";
import type {InferSelectModel} from "drizzle-orm";
import {and, desc, eq, like, not, notInArray, sql} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError";
import {TiltifyAPI, type TiltifyUserData} from "../../TiltifyAPI.ts";
import type {ActionAPIContext} from "astro:actions";
import {TwitchRepo} from "./TwitchRepo.ts";
import {UserTagRepo} from "./UserTagRepo.ts";
import {getDB} from "../db.ts";

/**
 * Repository for working with users
 */
export class UserRepo extends Repo<typeof users._['config']> {

  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv, users);
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
    return new UserRepo(ctx.locals.runtime.env, 'action')
  }

  static withEnv(env: Env, repoEnv: RepoEnv) {
    return new UserRepo(env, repoEnv)
  }

  // region Basic User Operations
  /**
   * Find a user by its primary key
   * @param id The primary key value
   * @returns Promise resolving to the user or null if not found
   *
   * SQL: `SELECT * FROM "users" WHERE "users"."id" = ?`
   */
  async findById(id: number): Promise<InferSelectModel<typeof users> | null> {
    try {
      const result = await this.db.select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .get();

      return result || null;
    } catch (error) {
      return this.handleError(`Failed to find user by id: ${id}`, error);
    }
  }

  /**
   * Find all users in the table
   * @returns Promise resolving to an array of users
   *
   * SQL: `SELECT * FROM "users"`
   */
  async findAll(): Promise<InferSelectModel<typeof users>[]> {
    try {
      return await this.db.select()
        .from(this.table)
        .all();
    } catch (error) {
      return this.handleError("Failed to find all users", error);
    }
  }

  /**
   * Create a new user
   * @param data The data to insert
   * @returns Promise resolving to the created user
   *
   * SQL: `INSERT INTO "users" (...) VALUES (...) RETURNING *`
   */
  async create(data: Partial<InferSelectModel<typeof users>>): Promise<InferSelectModel<typeof users>> {
    try {
      const [result] = await this.db.insert(this.table)
        .values(data)
        .returning();

      return result;
    } catch (error) {
      return this.handleError("Failed to create user", error);
    }
  }

  /**
   * Update a user by its primary key
   * @param id The primary key value
   * @param data The data to update
   * @returns Promise resolving to the updated user
   *
   * SQL: `UPDATE "users" SET ... WHERE "users"."id" = ? RETURNING *`
   */
  async update(id: number, data: Partial<InferSelectModel<typeof users>>): Promise<InferSelectModel<typeof users>> {
    try {
      const primaryKeyColumn = this.table.id;

      const [result] = await this.db.update(this.table)
        .set(data)
        .where(eq(primaryKeyColumn, id))
        .returning();

      return result;
    } catch (error) {
      return this.handleError(`Failed to update user with id: ${id}`, error);
    }
  }

  /**
   * Delete a user by its primary key
   * @param id The primary key value
   * @returns Promise resolving to a boolean indicating if the user was deleted
   *
   * SQL: `DELETE FROM "users" WHERE "users"."id" = ?`
   */
  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.db.delete(this.table)
        .where(eq(this.table.id, id))
        .run();

      return result.results.length > 0;
    } catch (error) {
      return this.handleError(`Failed to delete user with id: ${id}`, error);
    }
  }


  // endregion Basic User Operations


  async getAccountByProvider(userId: number, provider: string) {
    try {
      return this.db.select()
        .from(accounts)
        .where(and(
          eq(accounts.userId, userId),
          eq(accounts.provider, provider)
        ))
        .get();
    } catch (error) {
      return this.handleError(`Failed to get accounts for user with id: ${userId} with provider ${provider}`, error);
    }
  }

  // region User Search Operations
  /**
   * Search for users by a search term
   * @param searchTerm The term to search for
   * @param includeSelf Include the current user
   * @param currentUserId The ID of the current user to exclude from results
   * @param limit Maximum number of results to return
   * @returns Promise resolving to an array of matching accounts
   *
   * SQL: `SELECT "accounts"."userId", "accounts"."provider", "accounts"."providerUsername" FROM "accounts" WHERE ("accounts"."providerUsername" LIKE ? AND "accounts"."userId" != ?) LIMIT ?`
   */
  async searchUser(searchTerm: string, includeSelf: boolean, currentUserId: number, limit: number = 5): Promise<{
    userId: number,
    provider: string,
    providerName: string
  }[]> {
    try {
      const searchPattern = `%${searchTerm}%`;
      if (includeSelf) {
        return await this.db.select({
          userId: accounts.userId,
          provider: accounts.provider,
          providerName: accounts.providerUsername
        })
          .from(accounts)
          .where(
            like(accounts.providerUsername, searchPattern),
          )
          .limit(limit)
          .all();
      } else {
        return await this.db.select({
          userId: accounts.userId,
          provider: accounts.provider,
          providerName: accounts.providerUsername
        })
          .from(accounts)
          .where(
            and(
              like(accounts.providerUsername, searchPattern),
              not(eq(accounts.userId, currentUserId))
            )
          )
          .limit(limit)
          .all();
      }

    } catch (error) {
      return this.handleError(`Failed to search users with term: ${searchTerm}`, error);
    }
  }

  // endregion User Search Operations

  // region User Tags Operations
  // All user tag related functionality has been moved to UserTagRepo
  // If this functionality is required, the UserTagRepo should be directly used
  // endregion User Tags Operations

  // region User Socials Operations
  /**
   * Get all social media links for a user
   * @param userId The user ID
   * @returns Promise resolving to an array of user social media links
   *
   * SQL: `SELECT * FROM "userSocials" WHERE "userSocials"."userId" = ?`
   */
  async getUserSocials(userId: number): Promise<InferSelectModel<typeof userSocials>[]> {
    try {
      return await this.db.select()
        .from(userSocials)
        .where(eq(userSocials.userId, userId))
        .all();
    } catch (error) {
      return this.handleError(`Failed to get social media links for user with id: ${userId}`, error);
    }
  }

  /**
   * Add a social media link to a user
   * @param userId The user ID
   * @param provider The social media provider
   * @param url The social media URL
   * @returns Promise resolving to the created social media link
   *
   * SQL:
   * 1. `SELECT * FROM "userSocials" WHERE ("userSocials"."userId" = ? AND "userSocials"."provider" = ?)`
   * 2. If exists: `UPDATE "userSocials" SET "url" = ? WHERE ("userSocials"."userId" = ? AND "userSocials"."provider" = ?) RETURNING *`
   * 3. If not exists: `INSERT INTO "userSocials" ("userId", "provider", "url") VALUES (?, ?, ?) RETURNING *`
   */
  async addSocial(userId: number, provider: string, url: string): Promise<InferSelectModel<typeof userSocials>> {
    try {
      // Check if the user already has a social media link for this provider
      const existingSocial = await this.db.select()
        .from(userSocials)
        .where(
          and(
            eq(userSocials.userId, userId),
            eq(userSocials.provider, provider)
          )
        )
        .get();

      if (existingSocial) {
        // Update existing social media link
        const [result] = await this.db.update(userSocials)
          .set({url})
          .where(
            and(
              eq(userSocials.userId, userId),
              eq(userSocials.provider, provider)
            )
          )
          .returning();
        return result;
      } else {
        // Create new social media link
        const [result] = await this.db.insert(userSocials)
          .values({
            userId,
            provider,
            url
          })
          .returning();
        return result;
      }
    } catch (error) {
      return this.handleError(`Failed to add social media link for provider ${provider} to user with id: ${userId}`, error);
    }
  }

  /**
   * Remove a social media link from a user
   * @param userId The user ID
   * @param provider The social media provider
   * @returns Promise resolving to a boolean indicating if the social media link was removed
   *
   * SQL: `DELETE FROM "userSocials" WHERE ("userSocials"."userId" = ? AND "userSocials"."provider" = ?)`
   */
  async removeSocial(userId: number, provider: string): Promise<boolean> {
    try {
      const result = await this.db.delete(userSocials)
        .where(
          and(
            eq(userSocials.userId, userId),
            eq(userSocials.provider, provider)
          )
        )
        .run();

      return result.results.length > 0;
    } catch (error) {
      return this.handleError(`Failed to remove social media link for provider ${provider} from user with id: ${userId}`, error);
    }
  }

  /**
   * Add multiple social media links to a user in a single batch operation
   * @param userId The user ID
   * @param socials Array of social media objects with provider and url
   * @returns Promise resolving to an array of created/updated social media links
   */
  async addSocialsBatch(userId: number, socials: { provider: string, url: string }[]): Promise<InferSelectModel<typeof userSocials>[]> {
    try {
      if (socials.length === 0) {
        return [];
      }

      // Get existing socials for this user
      const existingSocials = await this.db.select()
        .from(userSocials)
        .where(eq(userSocials.userId, userId))
        .all();

      // Separate socials into those that need to be updated and those that need to be inserted
      const toUpdate: { provider: string, url: string }[] = [];
      const toInsert: { userId: number, provider: string, url: string }[] = [];

      socials.forEach(social => {
        const existing = existingSocials.find(es => es.provider === social.provider);
        if (existing) {
          toUpdate.push(social);
        } else {
          toInsert.push({
            userId,
            provider: social.provider,
            url: social.url
          });
        }
      });

      const results: InferSelectModel<typeof userSocials>[] = [];

      // Use a transaction to ensure all operations succeed or fail together
      await this.db.transaction(async (tx) => {
        // Handle updates
        for (const social of toUpdate) {
          const [updated] = await tx.update(userSocials)
            .set({ url: social.url })
            .where(
              and(
                eq(userSocials.userId, userId),
                eq(userSocials.provider, social.provider)
              )
            )
            .returning();
          results.push(updated);
        }

        // Handle inserts
        if (toInsert.length > 0) {
          const inserted = await tx.insert(userSocials)
            .values(toInsert)
            .returning();
          results.push(...inserted);
        }
      });

      return results;
    } catch (error) {
      return this.handleError(`Failed to add social media links in batch for user with id: ${userId}`, error);
    }
  }

  // endregion User Socials Operations


  /**
   * Get user data, tiltify account data, user socials, and user tags for a given tiltify username
   * @param tiltifyUsername The tiltify username to look up
   * @returns Promise resolving to an object containing user data, tiltify account data, user socials, and user tags, or null if not found
   *
   * SQL: `SELECT * FROM "accounts"
   *      JOIN "users" ON "accounts"."userId" = "users"."id"
   *      WHERE "accounts"."provider" = 'tiltify' AND "accounts"."providerUsername" = ?`
   */
  async getUserByTiltifyUsername(tiltifyUsername: string): Promise<{
    user: InferSelectModel<typeof users>,
    account: InferSelectModel<typeof accounts>,
    socials: InferSelectModel<typeof userSocials>[],
    tags: InferSelectModel<typeof userTags>[]
  } | null> {
    try {
      // First, find the user and account
      const userAccount = await this.db.select({
        user: users,
        account: accounts,
        userId: accounts.userId
      })
        .from(accounts)
        .innerJoin(users, eq(accounts.userId, users.id))
        .where(
          and(
            eq(accounts.provider, 'tiltify'),
            eq(accounts.providerUsername, tiltifyUsername)
          )
        )
        .get();

      if (!userAccount) {
        return null;
      }

      // Then fetch socials and tags in parallel
      const [socials, tags] = await Promise.all([
        this.db.select()
          .from(userSocials)
          .where(eq(userSocials.userId, userAccount.userId))
          .all(),
        this.db.select()
          .from(userTags)
          .where(eq(userTags.userId, userAccount.userId))
          .all()
      ]);

      return {
        user: userAccount.user,
        account: userAccount.account,
        socials,
        tags
      };
    } catch (error) {
      console.error('Error in getUserByTiltifyUsername:', error);
      return this.handleError(`Failed to get user by tiltify username: ${tiltifyUsername}`, error);
    }
  }

  /**
   * Check if a tiltify account is blocked
   * @param tiltifyUsername The tiltify username to check
   * @returns Promise resolving to a boolean indicating if the account is blocked
   *
   * SQL: `SELECT * FROM "accounts"
   *      LEFT JOIN "blockedAccounts" ON "accounts"."providerId" = "blockedAccounts"."providerId" AND "blockedAccounts"."provider" = 'tiltify'
   *      WHERE "accounts"."provider" = 'tiltify' AND "accounts"."providerUsername" = ?`
   */
  async isTiltifyAccountBlocked(tiltifyUsername: string): Promise<boolean> {
    try {
      // Use EXISTS subquery to check if the account is blocked
      const result = await this.db
        .select({ exists: sql`1` })
        .from(accounts)
        .where(
          and(
            eq(accounts.provider, 'tiltify'),
            eq(accounts.providerUsername, tiltifyUsername),
            sql`EXISTS (
              SELECT 1 FROM ${blockedAccounts}
              WHERE ${blockedAccounts.providerId} = ${accounts.providerId}
              AND ${blockedAccounts.provider} = 'tiltify'
            )`
          )
        )
        .get();

      return !!result;
    } catch (error) {
      return this.handleError(`Failed to check if tiltify account is blocked for username: ${tiltifyUsername}`, error);
    }
  }


  /**
   * Get recommended users based on shared tags with the current user
   *
   * This method finds other users who share tags with the current user,
   * counts how many tags they have in common, and returns a list of
   * recommended users sorted by the number of common tags in descending order.
   *
   * The algorithm works as follows:
   * 1. Start with the current user's tags
   * 2. Find other users who have the same tags
   * 3. Count how many tags each user has in common with the current user
   * 4. Sort users by the number of common tags (highest first)
   * 5. Return the top N users as recommendations
   *
   * @param currentUserId The ID of the current user
   * @param limit Maximum number of recommended users to return (default: 10)
   * @returns Promise resolving to an array of recommended users with their common tag count
   *
   * SQL equivalent:
   * ```sql
   * SELECT users.id, users.role, COUNT(*) as commonTagCount
   * FROM userTags
   * INNER JOIN userTags AS theirs ON userTags.tag = theirs.tag
   * INNER JOIN users ON users.id = theirs.userId
   * WHERE userTags.userId = ? AND theirs.userId != ?
   * GROUP BY users.id
   * ORDER BY commonTagCount DESC
   * LIMIT ?
   * ```
   */
  async getRecommendedUsers(currentUserId: number, limit = 10) {
    try {
      // Query to find users who share tags with the current user
      const recommendations = await this.db
        .select({
          id: users.id,
          role: users.role,
          commonTagCount: sql<number>`COUNT(*)`
        })
        .from(userTags)
        // Join to other users' tags on the same tag value
        .innerJoin(
          userTags,
          eq(userTags.tag, userTags.tag)
        )
        // Join to users table to get user information
        .innerJoin(
          users,
          eq(users.id, userTags.userId)
        )
        // Filter: only include tags belonging to the current user
        // Exclude the current user from recommendations
        .where(and(eq(userTags.userId, currentUserId), sql`commonTagCount >= 2`))
        // Group by user to count common tags per user
        .groupBy(users.id)
        // Sort by number of common tags (highest first)
        .orderBy(desc(sql`commonTagCount`))
        // Limit the number of results
        .limit(limit)
        .all();

      return recommendations;
    } catch (error) {
      return this.handleError(`Failed to get recommended users for user with id: ${currentUserId}`, error);
    }
  }


  async getTiltifyMetaData(userId: number): Promise<TiltifyUserData | undefined> {
    try {
      // Fetch from database
      const tiltifyAccount = await this.db
        .select({
          meta: accounts.meta
        })
        .from(accounts)
        .where(and(
          eq(accounts.userId, userId),
          eq(accounts.provider, 'tiltify')
        )).get();

      return tiltifyAccount ? (tiltifyAccount.meta as TiltifyUserData) : undefined;
    } catch (error) {
      return this.handleError(`Failed to get Tiltify metadata for user with id: ${userId}`, error);
    }
  }

}
