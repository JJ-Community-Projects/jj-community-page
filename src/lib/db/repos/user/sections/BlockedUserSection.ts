// src/lib/db/newRepos/user/sections/BlockedUserSection.ts
import { and, eq } from "drizzle-orm";
import type { RepoEnv } from "../../../../db/RepoEnv";
import { blockedUsers, friendsTable, users } from "../../../schema/auth-schema";
import type { BlockedUser, BlockedUserInsert, User, UserDisplay } from "../../../types/user";
import { NotFoundError } from "../../../errors";
import { BaseUserSection } from "../base/BaseUserSection";

/**
 * Section for blocked user table operations
 */
export class BlockedUserSection extends BaseUserSection<BlockedUser, BlockedUserInsert> {
  /**
   * Creates a new BlockedUserSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a blocked user by its primary key (userId, blockedUser)
   * @param userId - The ID of the user who blocked
   * @param blockedUserId - The ID of the blocked user
   * @returns The blocked user or undefined if not found
   */
  async findById(userId: number, blockedUserId: number): Promise<BlockedUser | undefined> {
    try {
      return this.db.select()
        .from(blockedUsers)
        .where(and(
          eq(blockedUsers.userId, userId),
          eq(blockedUsers.blockedUser, blockedUserId)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find blocked user: ${blockedUserId} for user: ${userId}`, error);
    }
  }

  /**
   * Finds all blocked users
   * @returns An array of blocked users
   */
  async findAll(): Promise<BlockedUser[]> {
    try {
      return await this.db.select()
        .from(blockedUsers)
        .all();
    } catch (error) {
      this.handleError("Failed to find all blocked users", error);
    }
  }

  /**
   * Creates a new blocked user
   * @param data - The data for the new blocked user
   * @returns The created blocked user
   */
  async create(data: BlockedUserInsert): Promise<BlockedUser> {
    try {
      const [blockedUser] = await this.db.insert(blockedUsers)
        .values(data)
        .returning();
      return blockedUser as BlockedUser;
    } catch (error) {
      this.handleError("Failed to create blocked user", error);
    }
  }

  /**
   * Updates a blocked user
   * @param userId - The ID of the user who blocked
   * @param blockedUserId - The ID of the blocked user
   * @param data - The data to update
   * @returns The updated blocked user
   */
  async update(userId: number, blockedUserId: number, data: Partial<BlockedUserInsert>): Promise<BlockedUser> {
    try {
      const [blockedUser] = await this.db.update(blockedUsers)
        .set(data)
        .where(and(
          eq(blockedUsers.userId, userId),
          eq(blockedUsers.blockedUser, blockedUserId)
        ))
        .returning();

      if (!blockedUser) {
        throw new NotFoundError(`Blocked user: ${blockedUserId} for user: ${userId} not found`);
      }

      return blockedUser as BlockedUser;
    } catch (error) {
      this.handleError(`Failed to update blocked user: ${blockedUserId} for user: ${userId}`, error);
    }
  }

  /**
   * Deletes a blocked user
   * @param userId - The ID of the user who blocked
   * @param blockedUserId - The ID of the blocked user
   */
  async delete(userId: number, blockedUserId: number): Promise<void> {
    try {
      const result = await this.db.delete(blockedUsers)
        .where(and(
          eq(blockedUsers.userId, userId),
          eq(blockedUsers.blockedUser, blockedUserId)
        ))
        .returning({ userId: blockedUsers.userId });

      if (result.length === 0) {
        throw new NotFoundError(`Blocked user: ${blockedUserId} for user: ${userId} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete blocked user: ${blockedUserId} for user: ${userId}`, error);
    }
  }

  /**
   * Finds blocked users by user ID
   * @param userId - The ID of the user who blocked
   * @returns An array of blocked users
   */
  async findByUserId(userId: number): Promise<BlockedUser[]> {
    try {
      return this.db.select()
        .from(blockedUsers)
        .where(eq(blockedUsers.userId, userId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find blocked users for user: ${userId}`, error);
    }
  }

  /**
   * Finds users who blocked a specific user
   * @param blockedUserId - The ID of the blocked user
   * @returns An array of users who blocked the specified user
   */
  async findByBlockedUserId(blockedUserId: number): Promise<BlockedUser[]> {
    try {
      return this.db.select()
        .from(blockedUsers)
        .where(eq(blockedUsers.blockedUser, blockedUserId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find users who blocked user: ${blockedUserId}`, error);
    }
  }

  /**
   * Checks if a user is blocked by another user
   * @param userId - The ID of the user who might have blocked
   * @param blockedUserId - The ID of the potentially blocked user
   * @returns True if the user is blocked
   */
  async isBlocked(userId: number, blockedUserId: number): Promise<boolean> {
    try {
      const blockedUser = await this.findById(userId, blockedUserId);
      return !!blockedUser;
    } catch (error) {
      this.handleError(`Failed to check if user: ${blockedUserId} is blocked by user: ${userId}`, error);
    }
  }

  /**
   * Blocks a user
   * @param userId - The ID of the user who is blocking
   * @param blockedUserId - The ID of the user to block
   * @returns The created blocked user
   */
  async blockUser(userId: number, blockedUserId: number): Promise<BlockedUser> {
    try {
      // Check if already blocked
      const existing = await this.findById(userId, blockedUserId);
      if (existing) {
        return existing;
      }

      return this.create({
        userId,
        blockedUser: blockedUserId
      });
    } catch (error) {
      this.handleError(`Failed to block user: ${blockedUserId} by user: ${userId}`, error);
    }
  }

  /**
   * Unblocks a user
   * @param userId - The ID of the user who is unblocking
   * @param blockedUserId - The ID of the user to unblock
   */
  async unblockUser(userId: number, blockedUserId: number): Promise<void> {
    try {
      // Check if blocked
      const existing = await this.findById(userId, blockedUserId);
      if (!existing) {
        return; // Not blocked, nothing to do
      }

      await this.delete(userId, blockedUserId);
    } catch (error) {
      this.handleError(`Failed to unblock user: ${blockedUserId} by user: ${userId}`, error);
    }
  }

  /**
   * Finds all users blocked by a user and returns them as UserDisplay objects
   * @param userId - The ID of the user whose blocked users to find
   * @returns An array of UserDisplay objects representing the users blocked by the specified user
   */
  async findByUserIdAsUsers(userId: number): Promise<UserDisplay[]> {
    try {
      return this.findRelatedUsersAsUserDisplay(
        blockedUsers,
        'userId',
        userId,
        'blockedUser',
        `Failed to find blocked users for user: ${userId}`
      );
    } catch (error) {
      this.handleError(`Failed to find blocked users for user: ${userId}`, error);
    }
  }
}
