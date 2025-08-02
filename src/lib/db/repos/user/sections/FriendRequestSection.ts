// src/lib/db/newRepos/user/sections/FriendRequestSection.ts
import {and, eq, or} from "drizzle-orm";
import type {RepoEnv} from "../../../../db/RepoEnv";
import {friendRequests, users} from "../../../schema/auth-schema";
import {NotFoundError} from "../../../../db/errors";
import type {FriendRequest, FriendRequestInsert, User, UserDisplay} from "../../../types/user";
import {BaseUserSection} from "../base/BaseUserSection";

/**
 * Section for friend request table operations
 */
export class FriendRequestSection extends BaseUserSection<FriendRequest, FriendRequestInsert> {
  /**
   * Creates a new FriendRequestSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a friend request by its primary key (fromUserId, toUserId)
   * @param id - The composite ID object containing fromUserId and toUserId
   * @returns The friend request or undefined if not found
   */
  async findById(id: { fromUserId: number, toUserId: number }): Promise<FriendRequest | undefined> {
    try {
      const {fromUserId, toUserId} = id;
      return this.db.select()
        .from(friendRequests)
        .where(and(
          eq(friendRequests.fromUserId, fromUserId),
          eq(friendRequests.toUserId, toUserId)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find friend request from user: ${id.fromUserId} to user: ${id.toUserId}`, error);
    }
  }

  /**
   * Helper method to find a friend request by fromUserId and toUserId
   * @param fromUserId - The ID of the user who sent the request
   * @param toUserId - The ID of the user who received the request
   * @returns The friend request or undefined if not found
   */
  async findByUserIds(fromUserId: number, toUserId: number): Promise<FriendRequest | undefined> {
    return this.findById({fromUserId, toUserId});
  }

  /**
   * Finds all friend requests
   * @returns An array of friend requests
   */
  async findAll(): Promise<FriendRequest[]> {
    try {
      return await this.db.select()
        .from(friendRequests)
        .all();
    } catch (error) {
      this.handleError("Failed to find all friend requests", error);
    }
  }

  /**
   * Creates a new friend request
   * @param data - The data for the new friend request
   * @returns The created friend request
   */
  async create(data: FriendRequestInsert): Promise<FriendRequest> {
    try {
      const [friendRequest] = await this.db.insert(friendRequests)
        .values(data)
        .returning();
      return friendRequest as FriendRequest;
    } catch (error) {
      this.handleError("Failed to create friend request", error);
    }
  }

  /**
   * Updates a friend request
   * @param id - The composite ID object containing fromUserId and toUserId
   * @param data - The data to update
   * @returns The updated friend request
   */
  async update(id: {
    fromUserId: number,
    toUserId: number
  }, data: Partial<FriendRequestInsert>): Promise<FriendRequest> {
    try {
      const {fromUserId, toUserId} = id;
      const [friendRequest] = await this.db.update(friendRequests)
        .set(data)
        .where(and(
          eq(friendRequests.fromUserId, fromUserId),
          eq(friendRequests.toUserId, toUserId)
        ))
        .returning();

      if (!friendRequest) {
        throw new NotFoundError(`Friend request from user: ${fromUserId} to user: ${toUserId} not found`);
      }

      return friendRequest as FriendRequest;
    } catch (error) {
      this.handleError(`Failed to update friend request from user: ${id.fromUserId} to user: ${id.toUserId}`, error);
    }
  }

  /**
   * Helper method to update a friend request by fromUserId and toUserId
   * @param fromUserId - The ID of the user who sent the request
   * @param toUserId - The ID of the user who received the request
   * @param data - The data to update
   * @returns The updated friend request
   */
  async updateByUserIds(fromUserId: number, toUserId: number, data: Partial<FriendRequestInsert>): Promise<FriendRequest> {
    return this.update({fromUserId, toUserId}, data);
  }

  /**
   * Deletes a friend request
   * @param id - The composite ID object containing fromUserId and toUserId
   */
  async delete(id: { fromUserId: number, toUserId: number }): Promise<void> {
    try {
      const {fromUserId, toUserId} = id;
      const result = await this.db.delete(friendRequests)
        .where(and(
          eq(friendRequests.fromUserId, fromUserId),
          eq(friendRequests.toUserId, toUserId)
        ))
        .returning({fromUserId: friendRequests.fromUserId});

      if (result.length === 0) {
        throw new NotFoundError(`Friend request from user: ${fromUserId} to user: ${toUserId} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete friend request from user: ${id.fromUserId} to user: ${id.toUserId}`, error);
    }
  }

  /**
   * Helper method to delete a friend request by fromUserId and toUserId
   * @param fromUserId - The ID of the user who sent the request
   * @param toUserId - The ID of the user who received the request
   */
  async deleteByUserIds(fromUserId: number, toUserId: number): Promise<void> {
    return this.delete({fromUserId, toUserId});
  }

  /**
   * Finds friend requests by sender
   * @param fromUserId - The ID of the user who sent the requests
   * @returns An array of friend requests
   */
  async findByFromUserId(fromUserId: number): Promise<FriendRequest[]> {
    try {
      return this.db.select()
        .from(friendRequests)
        .where(eq(friendRequests.fromUserId, fromUserId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find friend requests from user: ${fromUserId}`, error);
    }
  }

  /**
   * Finds friend requests by recipient
   * @param toUserId - The ID of the user who received the requests
   * @returns An array of friend requests
   */
  async findByToUserId(toUserId: number): Promise<FriendRequest[]> {
    try {
      return this.db.select()
        .from(friendRequests)
        .where(eq(friendRequests.toUserId, toUserId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find friend requests to user: ${toUserId}`, error);
    }
  }

  /**
   * Finds all friend requests involving a user (either as sender or recipient)
   * @param userId - The ID of the user
   * @returns An array of friend requests
   */
  async findByUserId(userId: number): Promise<FriendRequest[]> {
    try {
      return this.db.select()
        .from(friendRequests)
        .where(or(
          eq(friendRequests.fromUserId, userId),
          eq(friendRequests.toUserId, userId)
        ))
        .all();
    } catch (error) {
      this.handleError(`Failed to find friend requests involving user: ${userId}`, error);
    }
  }

  /**
   * Checks if a friend request exists between two users
   * @param fromUserId - The ID of the user who sent the request
   * @param toUserId - The ID of the user who received the request
   * @returns True if the friend request exists
   */
  async exists(fromUserId: number, toUserId: number): Promise<boolean> {
    try {
      const friendRequest = await this.findByUserIds(fromUserId, toUserId);
      return !!friendRequest;
    } catch (error) {
      this.handleError(`Failed to check if friend request exists from user: ${fromUserId} to user: ${toUserId}`, error);
    }
  }

  /**
   * Checks if there is a pending friend request between two users (in either direction)
   * @param userId1 - The ID of the first user
   * @param userId2 - The ID of the second user
   * @returns True if there is a pending friend request
   */
  async hasPendingRequest(userId1: number, userId2: number): Promise<boolean> {
    try {
      const request1 = await this.findByUserIds(userId1, userId2);
      const request2 = await this.findByUserIds(userId2, userId1);
      return !!(request1 || request2);
    } catch (error) {
      this.handleError(`Failed to check if there is a pending friend request between users: ${userId1} and ${userId2}`, error);
    }
  }

  /**
   * Finds all users who have sent friend requests to or received friend requests from a user
   *
   * This function returns User objects representing users with pending friend requests by:
   * 1. Finding incoming requests: users who have sent friend requests to the specified user
   *    (where the specified user is the recipient/toUserId)
   * 2. Finding outgoing requests: users who have received friend requests from the specified user
   *    (where the specified user is the sender/fromUserId)
   * 3. Combining both sets of users and removing any duplicates
   *
   * Unlike friendships which are bidirectional, friend requests are directional -
   * they have a specific sender and recipient. This function captures both directions
   * relative to the specified user.
   *
   * @param userId - The ID of the user whose friend requests to find
   * @returns An array of User objects representing users with pending friend requests
   */
  async findByUserIdAsUsers(userId: number): Promise<User[]> {
    try {
      // Find users who have sent friend requests to this user (incoming requests)
      const incomingRequestUsers = await this.db.select({
        id: users.id,
        createdAt: users.createdAt,
        role: users.role,
        primaryLiveStream: users.primaryLiveStream,
      })
        .from(friendRequests)
        .where(eq(friendRequests.toUserId, userId))
        .innerJoin(users, eq(friendRequests.fromUserId, users.id))
        .all();

      // Find users who have received friend requests from this user (outgoing requests)
      const outgoingRequestUsers = await this.db.select({
        id: users.id,
        createdAt: users.createdAt,
        role: users.role,
        primaryLiveStream: users.primaryLiveStream,
      })
        .from(friendRequests)
        .where(eq(friendRequests.fromUserId, userId))
        .innerJoin(users, eq(friendRequests.toUserId, users.id))
        .all();

      // Combine both sets of users and remove duplicates
      const allUsers = [...incomingRequestUsers, ...outgoingRequestUsers];
      const uniqueUsers = allUsers.filter((user, index, self) =>
        index === self.findIndex(u => u.id === user.id)
      );

      return uniqueUsers;
    } catch (error) {
      this.handleError(`Failed to find friend requests for user: ${userId}`, error);
    }
  }

  /**
   * Finds users who have sent friend requests to a specific user
   * @param userId - The ID of the user who received the requests
   * @returns An array of UserDisplay objects representing users who sent friend requests
   */
  findByFromUserIdAsUser(userId: number): Promise<UserDisplay[]> {
    try {
      return this.findRelatedUsersAsUserDisplay(
        friendRequests,
        'toUserId',
        userId,
        'fromUserId',
        `Failed to find users who sent friend requests to user: ${userId}`
      );
    } catch (error) {
      this.handleError(`Failed to find friend requests for user: ${userId}`, error);
    }
  }

  /**
   * Finds users who have received friend requests from a specific user
   * @param userId - The ID of the user who sent the requests
   * @returns An array of UserDisplay objects representing users who received friend requests
   */
  findByToUserIdAsUser(userId: number): Promise<UserDisplay[]> {
    try {
      return this.findRelatedUsersAsUserDisplay(
        friendRequests,
        'fromUserId',
        userId,
        'toUserId',
        `Failed to find users who received friend requests from user: ${userId}`
      );
    } catch (error) {
      this.handleError(`Failed to find friend requests for user: ${userId}`, error);
    }
  }
}
