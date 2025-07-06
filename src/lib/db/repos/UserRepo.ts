import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import {Repo, type RepoEnv} from "./Repo";
import {accounts, blockedAccounts, users, userSocials, userTags} from "../schema/auth-schema";
import type {InferSelectModel} from "drizzle-orm";
import {and, desc, eq, like, not, notInArray, sql} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError";
import {getTiltifyUser, type TiltifyUserData} from "../../../functions/tiltify";
import type {ActionAPIContext} from "astro:actions";
import {TwitchRepo} from "./TwitchRepo.ts";
import {getDB} from "../db.ts";

/**
 * Repository for working with users
 */
export class UserRepo extends Repo<typeof users._['config']> {
  constructor(db: DrizzleD1Database, env: RepoEnv) {
    super(db, users, env);
  }

  static action(ctx: ActionAPIContext) {
    return new UserRepo(getDB(ctx), 'action')
  }

  static withEnv(env: Env, repoEnv: RepoEnv) {
    return new UserRepo(getDB(env), repoEnv)
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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find user by id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find user by id: ${id}`, error);
      }
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
      if (this.env === 'action') {
        throw new DatabaseError("Failed to find all users", error).toActionError();
      } else {
        throw new DatabaseError("Failed to find all users", error);
      }
    }
  }

  async findAllTiltifyAccounts(): Promise<InferSelectModel<typeof accounts>[]> {
    try {
      return this.db.select()
        .from(accounts)
        .where(eq(accounts.provider, 'tiltify'))
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to find all tiltify accounts", error).toActionError();
      } else {
        throw new DatabaseError("Failed to find all tiltify accounts", error);
      }
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
      if (this.env === 'action') {
        throw new DatabaseError("Failed to create user", error).toActionError();
      } else {
        throw new DatabaseError("Failed to create user", error);
      }
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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to update user with id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to update user with id: ${id}`, error);
      }
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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to delete user with id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to delete user with id: ${id}`, error);
      }
    }
  }

  // endregion Basic User Operations

  /**
   * Get all accounts for a user
   * @param userId The user ID
   * @returns Promise resolving to an array of accounts
   *
   * SQL: `SELECT * FROM "accounts" WHERE "accounts"."userId" = ?`
   */
  async getAccounts(userId: number): Promise<InferSelectModel<typeof accounts>[]> {
    try {
      return await this.db.select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to get accounts for user with id: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get accounts for user with id: ${userId}`, error);
      }
    }
  }

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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to get accounts for user with id: ${userId} with provider ${provider}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get accounts for user with id: ${userId} with provider ${provider}`, error);
      }
    }
  }

  /**
   * Fetch social media links from Tiltify and add them to the user's profile
   * @param tiltifyToken The Tiltify API token
   * @param userId The user ID
   * @returns Promise resolving to an object with the results of adding each social media link
   */
  async fetchSocialsFromTiltify(tiltifyToken: string, userId: number): Promise<{
    success: boolean,
    results: { provider: string, success: boolean }[]
  }> {
    try {
      // Get the Tiltify user data
      const tiltifyUser = await getTiltifyUser(tiltifyToken);
      if (!tiltifyUser) {
        if (this.env === 'action') {
          throw new DatabaseError('Failed to get Tiltify user data', null).toActionError();
        } else {
          throw new DatabaseError('Failed to get Tiltify user data', null);
        }
      }

      const socials = tiltifyUser.data.social;
      const results: { provider: string, success: boolean }[] = [];

      // Add Twitch social if available
      if (socials.twitch) {
        const twitchUrl = socials.twitch.startsWith('http')
          ? socials.twitch
          : `https://twitch.tv/${socials.twitch}`;

        try {
          const result = await this.addSocial(userId, 'twitch', twitchUrl);
          results.push({provider: 'twitch', success: !!result});
        } catch (error) {
          console.error('Error adding Twitch social:', error);
          results.push({provider: 'twitch', success: false});
        }
      }

      // Add Twitter social if available
      if (socials.twitter) {
        const twitterUrl = socials.twitter.startsWith('http')
          ? socials.twitter
          : `https://twitter.com/${socials.twitter}`;

        try {
          const result = await this.addSocial(userId, 'twitter', twitterUrl);
          results.push({provider: 'twitter', success: !!result});
        } catch (error) {
          console.error('Error adding Twitter social:', error);
          results.push({provider: 'twitter', success: false});
        }
      }

      // Add YouTube social if available
      if (socials.youtube) {
        let youtubeUrl = socials.youtube;
        if (!youtubeUrl.startsWith('http')) {
          // Check if it's a channel ID or username
          if (youtubeUrl.startsWith('UC')) {
            youtubeUrl = `https://youtube.com/channel/${youtubeUrl}`;
          } else {
            youtubeUrl = `https://youtube.com/@${youtubeUrl}`;
          }
        }

        try {
          const result = await this.addSocial(userId, 'youtube', youtubeUrl);
          results.push({provider: 'youtube', success: !!result});
        } catch (error) {
          console.error('Error adding YouTube social:', error);
          results.push({provider: 'youtube', success: false});
        }
      }

      // Add Instagram social if available
      if (socials.instagram) {
        const instagramUrl = socials.instagram.startsWith('http')
          ? socials.instagram
          : `https://instagram.com/${socials.instagram}`;

        try {
          const result = await this.addSocial(userId, 'instagram', instagramUrl);
          results.push({provider: 'instagram', success: !!result});
        } catch (error) {
          console.error('Error adding Instagram social:', error);
          results.push({provider: 'instagram', success: false});
        }
      }

      // Add TikTok social if available
      if (socials.tiktok) {
        const tiktokUrl = socials.tiktok.startsWith('http')
          ? socials.tiktok
          : `https://tiktok.com/@${socials.tiktok}`;

        try {
          const result = await this.addSocial(userId, 'tiktok', tiktokUrl);
          results.push({provider: 'tiktok', success: !!result});
        } catch (error) {
          console.error('Error adding TikTok social:', error);
          results.push({provider: 'tiktok', success: false});
        }
      }

      return {
        success: true,
        results
      };
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError('Failed to fetch socials from Tiltify', error).toActionError();
      } else {
        throw new DatabaseError('Failed to fetch socials from Tiltify', error);
      }
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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to search users with term: ${searchTerm}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to search users with term: ${searchTerm}`, error);
      }
    }
  }

  // endregion User Search Operations

  // region User Tags Operations
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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to get tags for user with id: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get tags for user with id: ${userId}`, error);
      }
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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to add tag ${tag} to user with id: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to add tag ${tag} to user with id: ${userId}`, error);
      }
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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to remove tag ${tag} from user with id: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to remove tag ${tag} from user with id: ${userId}`, error);
      }
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
      return await this.db
        .select({
          tag: userTags.tag,
          label: userTags.label,
          count: sql<number>`count(
          ${userTags.tag}
          )`.as('count')
        })
        .from(userTags)
        .groupBy(userTags.tag)
        .orderBy((s) => {
          return desc(s.count);
        })
        .limit(limit)
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to get popular tags`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get popular tags`, error);
      }
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
      // Get user's existing tags
      const userTagsList = await this.db
        .select({
          tag: userTags.tag,
        })
        .from(userTags)
        .where(eq(userTags.userId, userId))
        .all();

      const userTagValues = userTagsList.map(t => t.tag);

      // Find popular tags not used by the user
      return await this.db
        .select({
          tag: userTags.tag,
          label: userTags.label,
          count: sql<number>`count(
          ${userTags.tag}
          )`.as('count')
        })
        .from(userTags)
        .where(
          notInArray(userTags.tag, userTagValues)
        )
        .groupBy(userTags.tag)
        .orderBy((s) => {
          return desc(s.count);
        })
        .limit(limit)
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to get suggested tags for user with id: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get suggested tags for user with id: ${userId}`, error);
      }
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
      // Get user's existing tags
      const userTagsList = await this.db
        .select({
          tag: userTags.tag,
        })
        .from(userTags)
        .where(eq(userTags.userId, userId))
        .all();

      const userTagValues = userTagsList.map(t => t.tag);

      // Find popular tags not used by the user and matching the search term
      return await this.db
        .select({
          tag: userTags.tag,
          label: userTags.label,
          count: sql<number>`count(
          ${userTags.tag}
          )`.as('count')
        })
        .from(userTags)
        .where(
          and(
            notInArray(userTags.tag, userTagValues),
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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to get suggested tags for user with id: ${userId} and term: ${term}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get suggested tags for user with id: ${userId} and term: ${term}`, error);
      }
    }
  }

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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to get social media links for user with id: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get social media links for user with id: ${userId}`, error);
      }
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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to add social media link for provider ${provider} to user with id: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to add social media link for provider ${provider} to user with id: ${userId}`, error);
      }
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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to remove social media link for provider ${provider} from user with id: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to remove social media link for provider ${provider} from user with id: ${userId}`, error);
      }
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
      // Query the accounts table to find the account with the given tiltify username
      const result = await this.db.select({
        user: users,
        account: accounts
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

      if (!result) {
        return null;
      }

      // Get user socials and tags
      const socials = await this.getUserSocials(result.user.id);
      const tags = await this.getUserTags(result.user.id);

      return {
        ...result,
        socials,
        tags
      };
    } catch (error) {
      console.error('Error in getUserByTiltifyUsername:', error);

      if (this.env === 'action') {
        throw new DatabaseError(`Failed to get user by tiltify username: ${tiltifyUsername}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get user by tiltify username: ${tiltifyUsername}`, error);
      }
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
      // Query accounts and join with blockedAccounts in a single query
      const result = await this.db.select({
        blockedAccount: blockedAccounts
      })
        .from(accounts)
        .leftJoin(blockedAccounts, and(
          eq(accounts.providerId, blockedAccounts.providerId),
          eq(blockedAccounts.provider, 'tiltify')
        ))
        .where(
          and(
            eq(accounts.provider, 'tiltify'),
            eq(accounts.providerUsername, tiltifyUsername)
          )
        )
        .get();

      // If no result or no blockedAccount found, the account is not blocked
      return !!result?.blockedAccount;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to check if tiltify account is blocked for username: ${tiltifyUsername}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to check if tiltify account is blocked for username: ${tiltifyUsername}`, error);
      }
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
        .where(and(eq(userTags.userId, currentUserId), not(eq(userTags.userId, currentUserId))))
        // Group by user to count common tags per user
        .groupBy(users.id)
        // Sort by number of common tags (highest first)
        .orderBy(desc(sql`commonTagCount`))
        // Limit the number of results
        .limit(limit)
        .all();

      return recommendations;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to get recommended users for user with id: ${currentUserId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get recommended users for user with id: ${currentUserId}`, error);
      }
    }
  }


  async getTiltifyMetaData(userId: number): Promise<TiltifyUserData | undefined> {
    const tiltifyAccount = await this.db
      .select({
        meta: accounts.meta
      })
      .from(accounts)
      .where(and(
        eq(accounts.userId, userId),
        eq(accounts.provider, 'tiltify')
      )).get()
    if (!tiltifyAccount) {
      return undefined;
    }
    return tiltifyAccount.meta as TiltifyUserData
  }

  async getTwitchChannelByUserId(userId: number) {
    const twitchRepo = new TwitchRepo(this.db, this.env);
    return twitchRepo.getChannelByUserId(userId);
  }

  async getTwitchStreamByUserId(userId: number) {
    // First get the channel to get its Twitch ID
    const channel = await this.getTwitchChannelByUserId(userId);
    if (!channel) return null;

    // Then get the stream using the channel's Twitch ID
    const twitchRepo = new TwitchRepo(this.db, this.env);
    return twitchRepo.getStreamByUserId(channel.id);
  }


}
