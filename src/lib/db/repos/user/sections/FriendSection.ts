// src/lib/db/newRepos/user/sections/FriendSection.ts
import {and, eq, or} from "drizzle-orm";
import type {RepoEnv} from "../../../../db/RepoEnv";
import {friendsTable} from "../../../schema/auth-schema";
import {NotFoundError} from "../../../errors";
import type {UserDisplay} from "../../../types/user.ts";
import {BaseUserSection} from "../base/BaseUserSection.ts";

/**
 * Type for friend entity from database schema
 */
export interface Friend {
  fromUserId: number;
  toUserId: number;
}

/**
 * Type for friend insert
 */
export interface FriendInsert {
  fromUserId: number;
  toUserId: number;
}

/**
 * Section for friends table operations
 */
export class FriendSection extends BaseUserSection<Friend, FriendInsert> {
  /**
   * Creates a new FriendSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a friendship by its primary key (fromUserId, toUserId)
   * @param fromUserId - The ID of the first user
   * @param toUserId - The ID of the second user
   * @returns The friendship or undefined if not found
   */
  async findById(fromUserId: number, toUserId: number): Promise<Friend | undefined> {
    try {
      return this.db.select()
        .from(friendsTable)
        .where(and(
          eq(friendsTable.fromUserId, fromUserId),
          eq(friendsTable.toUserId, toUserId)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find friendship between users: ${fromUserId} and ${toUserId}`, error);
    }
  }

  /**
   * Finds all friendships
   * @returns An array of friendships
   */
  async findAll(): Promise<Friend[]> {
    try {
      return await this.db.select()
        .from(friendsTable)
        .all();
    } catch (error) {
      this.handleError("Failed to find all friendships", error);
    }
  }

  /**
   * Creates a new friendship
   * @param data - The data for the new friendship
   * @returns The created friendship
   */
  async create(data: FriendInsert): Promise<Friend> {
    try {
      const [friend] = await this.db.insert(friendsTable)
        .values(data)
        .returning();
      return friend as Friend;
    } catch (error) {
      this.handleError("Failed to create friendship", error);
    }
  }

  /**
   * Updates a friendship
   * @param fromUserId - The ID of the first user
   * @param toUserId - The ID of the second user
   * @param data - The data to update
   * @returns The updated friendship
   */
  async update(fromUserId: number, toUserId: number, data: Partial<FriendInsert>): Promise<Friend> {
    try {
      const [friend] = await this.db.update(friendsTable)
        .set(data)
        .where(and(
          eq(friendsTable.fromUserId, fromUserId),
          eq(friendsTable.toUserId, toUserId)
        ))
        .returning();

      if (!friend) {
        throw new NotFoundError(`Friendship between users: ${fromUserId} and ${toUserId} not found`);
      }

      return friend as Friend;
    } catch (error) {
      this.handleError(`Failed to update friendship between users: ${fromUserId} and ${toUserId}`, error);
    }
  }

  /**
   * Deletes a friendship
   * @param fromUserId - The ID of the first user
   * @param toUserId - The ID of the second user
   */
  async delete(fromUserId: number, toUserId: number): Promise<void> {
    try {
      const result = await this.db.delete(friendsTable)
        .where(and(
          eq(friendsTable.fromUserId, fromUserId),
          eq(friendsTable.toUserId, toUserId)
        ))
        .returning({fromUserId: friendsTable.fromUserId});

      if (result.length === 0) {
        throw new NotFoundError(`Friendship between users: ${fromUserId} and ${toUserId} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete friendship between users: ${fromUserId} and ${toUserId}`, error);
    }
  }

  /**
   * Finds all friendships for a user
   * @param userId - The ID of the user
   * @returns An array of friendships
   */
  async findByUserId(userId: number): Promise<Friend[]> {
    try {
      return this.db.select()
        .from(friendsTable)
        .where(or(
          eq(friendsTable.fromUserId, userId),
          eq(friendsTable.toUserId, userId)
        ))
        .all();
    } catch (error) {
      this.handleError(`Failed to find friendships for user: ${userId}`, error);
    }
  }

  /**
   * Checks if two users are friends
   * @param userId1 - The ID of the first user
   * @param userId2 - The ID of the second user
   * @returns True if the users are friends
   */
  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    try {
      // Check both directions since friendship can be stored in either direction
      const friendship1 = await this.findById(userId1, userId2);
      const friendship2 = await this.findById(userId2, userId1);
      return !!(friendship1 || friendship2);
    } catch (error) {
      this.handleError(`Failed to check if users: ${userId1} and ${userId2} are friends`, error);
    }
  }

  /**
   * Creates a bidirectional friendship between two users
   * @param userId1 - The ID of the first user
   * @param userId2 - The ID of the second user
   * @returns The created friendships
   */
  async createBidirectional(userId1: number, userId2: number): Promise<Friend[]> {
    try {
      const friendship1 = await this.create({
        fromUserId: userId1,
        toUserId: userId2
      });

      const friendship2 = await this.create({
        fromUserId: userId2,
        toUserId: userId1
      });

      return [friendship1, friendship2];
    } catch (error) {
      this.handleError(`Failed to create bidirectional friendship between users: ${userId1} and ${userId2}`, error);
    }
  }

  /**
   * Deletes a bidirectional friendship between two users
   * @param userId1 - The ID of the first user
   * @param userId2 - The ID of the second user
   */
  async deleteBidirectional(userId1: number, userId2: number): Promise<void> {
    try {
      // Delete in both directions
      try {
        await this.delete(userId1, userId2);
      } catch (error) {
        // Ignore if not found
      }

      try {
        await this.delete(userId2, userId1);
      } catch (error) {
        // Ignore if not found
      }
    } catch (error) {
      this.handleError(`Failed to delete bidirectional friendship between users: ${userId1} and ${userId2}`, error);
    }
  }


  /**
   * Finds all friends of a user and returns them as UserDisplay objects
   *
   * This function returns UserDisplay objects representing friends of the specified user by:
   * 1. Finding all friendships in the "friends" table where the specified user is the sender (fromUserId)
   * 2. Joining with the userDisplayView to get the friend's display information (toUserId)
   * 3. Returning the friend's display data with additional information like username, profile image, etc.
   *
   * Note: This implementation only returns friends where the user is the sender in the
   * friendship relationship. In the current system, friendships are stored bidirectionally
   * (with two records for each friendship, one in each direction) as evidenced by methods
   * like createBidirectional and deleteBidirectional. For a complete implementation,
   * this method should also find friendships where the user is the recipient (toUserId).
   *
   * @param userId - The ID of the user whose friends to find
   * @returns An array of UserDisplay objects representing the user's friends
   */
  async findByUserIdAsUsers(userId: number): Promise<UserDisplay[]> {
    try {
      return this.findRelatedUsersAsUserDisplay(
        friendsTable,
        'fromUserId',
        userId,
        'toUserId',
        `Failed to find friends for user: ${userId}`
      )
    } catch (error) {
      this.handleError(`Failed to find friends for user: ${userId}`, error);
    }
  }
}
