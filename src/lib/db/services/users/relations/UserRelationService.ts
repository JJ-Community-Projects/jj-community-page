import type {ActionAPIContext} from "astro:actions";
import {BaseUserService} from "../base/BaseUserService.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";
import {DuplicateError, NotFoundError, ServiceError, ValidationError} from "../../../errors";
import type {User} from "../../../types/user.ts";
import {UserService} from "../UserService.ts";

/**
 * Service for user relationship management
 *
 * This service handles all aspects of user relationships, including
 * friend requests, friendships, and blocked users. It provides methods
 * for sending, accepting, and rejecting friend requests, as well as
 * blocking and unblocking users.
 */
export class UserRelationService extends BaseUserService {
  private userService: UserService;

  /**
   * Creates a new UserRelationService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.userService = new UserService(env, repoEnv);
  }

  /**
   * Creates a UserRelationService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A UserRelationService instance
   */
  static action(ctx: ActionAPIContext) {
    return new UserRelationService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Gets all friends of a user
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns An array of users who are friends with the specified user
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {ServiceError} If there was an error retrieving the friends
   */
  async getFriends(userId: number, requestingUserId?: number): Promise<User[]> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    try {
      return await this.userRepo.getFriendsSection().getFriends(userId);
    } catch (error) {
      console.error(`Failed to get friends for user: ${userId}`, error);
      throw new ServiceError(`Failed to get friends for user: ${userId}`, error);
    }
  }

  /**
   * Gets users who sent friend requests to a user
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns An array of users who sent friend requests to the specified user
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {ServiceError} If there was an error retrieving the requests
   */
  async getIncomingRequestUsers(userId: number, requestingUserId?: number): Promise<User[]> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    try {
      return await this.userRepo.getFriendRequestSection().getIncomingRequestUsers(userId);
    } catch (error) {
      console.error(`Failed to get incoming request users for user: ${userId}`, error);
      throw new ServiceError(`Failed to get incoming request users for user: ${userId}`, error);
    }
  }

  /**
   * Gets users who received friend requests from a user
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns An array of users who received friend requests from the specified user
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {ServiceError} If there was an error retrieving the requests
   */
  async getOutgoingRequestUsers(userId: number, requestingUserId?: number): Promise<User[]> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    try {
      return await this.userRepo.getFriendRequestSection().getOutgoingRequestUsers(userId);
    } catch (error) {
      console.error(`Failed to get outgoing request users for user: ${userId}`, error);
      throw new ServiceError(`Failed to get outgoing request users for user: ${userId}`, error);
    }
  }

  /**
   * Gets all users blocked by a user
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns An array of users who are blocked by the specified user
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {ServiceError} If there was an error retrieving the blocked users
   */
  async getBlockedUsers(userId: number, requestingUserId?: number): Promise<User[]> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    // Authorization check (only the user themselves or an admin can see blocked users)
    if (requestingUserId && userId !== requestingUserId) {
      await this.authService.ensureIsAdmin(requestingUserId);
    }

    try {
      return await this.userRepo.getBlockedUserSection().getBlockedUsers(userId);
    } catch (error) {
      console.error(`Failed to get blocked users for user: ${userId}`, error);
      throw new ServiceError(`Failed to get blocked users for user: ${userId}`, error);
    }
  }

  /**
   * Sends a friend request to another user
   * @param fromUserId - The user sending the request
   * @param toUserId - The user receiving the request
   * @param requestingUserId - The ID of the user making the change
   * @returns True if the request was sent successfully
   * @throws {NotFoundError} If either user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the request already exists
   */
  async sendFriendRequest(fromUserId: number, toUserId: number, requestingUserId: number): Promise<boolean> {
    // Check if users exist
    await this.userService.getUserById(fromUserId, requestingUserId);
    await this.userService.getUserById(toUserId, requestingUserId);

    // Authorization check (only the user themselves or an admin can send requests)
    await this.userService.ensureCanModifyUser(fromUserId, requestingUserId);

    // Validate input
    if (fromUserId === toUserId) {
      throw new ValidationError("Cannot send friend request to yourself");
    }

    try {
      // Check if already friends
      const areFriends = await this.userRepo.getFriendsSection().areFriends(fromUserId, toUserId);
      if (areFriends) {
        throw new ValidationError("Users are already friends");
      }

      // Check if blocked
      const isBlocked = await this.isBlocked(toUserId, fromUserId);
      if (isBlocked) {
        throw new ValidationError("Cannot send friend request to a user who has blocked you");
      }

      // Send request
      await this.userRepo.getFriendRequestSection().createRequest(fromUserId, toUserId);
      return true;
    } catch (error) {
      // Handle specific errors
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error sending friend request:", error);
      throw new ServiceError("Failed to send friend request", error);
    }
  }

  /**
   * Accepts a friend request
   * @param toUserId - The user accepting the request
   * @param fromUserId - The user who sent the request
   * @param requestingUserId - The ID of the user making the change
   * @returns True if the request was accepted successfully
   * @throws {NotFoundError} If either user or the request doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async acceptFriendRequest(toUserId: number, fromUserId: number, requestingUserId: number): Promise<boolean> {
    // Check if users exist
    await this.userService.getUserById(toUserId, requestingUserId);
    await this.userService.getUserById(fromUserId, requestingUserId);

    // Authorization check (only the user themselves or an admin can accept requests)
    await this.userService.ensureCanModifyUser(toUserId, requestingUserId);

    try {
      // Check if request exists
      const hasRequest = await this.userRepo.getFriendRequestSection().hasRequest(fromUserId, toUserId);
      if (!hasRequest) {
        throw new NotFoundError(`Friend request from ${fromUserId} to ${toUserId} not found`);
      }

      // Create friendship
      await this.userRepo.getFriendsSection().createFriendship(fromUserId, toUserId);

      // Remove request
      await this.userRepo.getFriendRequestSection().removeRequest(fromUserId, toUserId);

      return true;
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error accepting friend request:", error);
      throw new ServiceError("Failed to accept friend request", error);
    }
  }

  /**
   * Rejects a friend request
   * @param toUserId - The user rejecting the request
   * @param fromUserId - The user who sent the request
   * @param requestingUserId - The ID of the user making the change
   * @returns True if the request was rejected successfully
   * @throws {NotFoundError} If either user or the request doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async rejectFriendRequest(toUserId: number, fromUserId: number, requestingUserId: number): Promise<boolean> {
    // Check if users exist
    await this.userService.getUserById(toUserId, requestingUserId);
    await this.userService.getUserById(fromUserId, requestingUserId);

    // Authorization check (only the user themselves or an admin can reject requests)
    await this.userService.ensureCanModifyUser(toUserId, requestingUserId);

    try {
      // Check if request exists
      const hasRequest = await this.userRepo.getFriendRequestSection().hasRequest(fromUserId, toUserId);
      if (!hasRequest) {
        throw new NotFoundError(`Friend request from ${fromUserId} to ${toUserId} not found`);
      }

      // Remove request
      await this.userRepo.getFriendRequestSection().removeRequest(fromUserId, toUserId);

      return true;
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error rejecting friend request:", error);
      throw new ServiceError("Failed to reject friend request", error);
    }
  }

  /**
   * Removes a friendship between two users
   * @param userId1 - The first user
   * @param userId2 - The second user
   * @param requestingUserId - The ID of the user making the change
   * @returns True if the friendship was removed successfully
   * @throws {NotFoundError} If either user or the friendship doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async removeFriend(userId1: number, userId2: number, requestingUserId: number): Promise<boolean> {
    // Check if users exist
    await this.userService.getUserById(userId1, requestingUserId);
    await this.userService.getUserById(userId2, requestingUserId);

    // Authorization check (only one of the users or an admin can remove friendship)
    if (userId1 !== requestingUserId && userId2 !== requestingUserId) {
      await this.userService.ensureIsAdmin(requestingUserId);
    }

    try {
      // Check if friendship exists
      const areFriends = await this.userRepo.getFriendsSection().areFriends(userId1, userId2);
      if (!areFriends) {
        throw new NotFoundError(`Friendship between ${userId1} and ${userId2} not found`);
      }

      // Remove friendship
      await this.userRepo.getFriendsSection().removeFriendship(userId1, userId2);

      return true;
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error removing friendship:", error);
      throw new ServiceError("Failed to remove friendship", error);
    }
  }

  /**
   * Blocks a user
   * @param userId - The user doing the blocking
   * @param blockedUserId - The user being blocked
   * @param requestingUserId - The ID of the user making the change
   * @returns True if the user was blocked successfully
   * @throws {NotFoundError} If either user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   */
  async blockUser(userId: number, blockedUserId: number, requestingUserId: number): Promise<boolean> {
    // Check if users exist
    await this.userService.getUserById(userId, requestingUserId);
    await this.userService.getUserById(blockedUserId, requestingUserId);

    // Authorization check (only the user themselves or an admin can block users)
    await this.userService.ensureCanModifyUser(userId, requestingUserId);

    // Validate input
    if (userId === blockedUserId) {
      throw new ValidationError("Cannot block yourself");
    }

    try {
      // Block user
      await this.userRepo.getBlockedUserSection().blockUser(userId, blockedUserId);

      // Remove any existing friendship
      const areFriends = await this.userRepo.getFriendsSection().areFriends(userId, blockedUserId);
      if (areFriends) {
        await this.userRepo.getFriendsSection().removeFriendship(userId, blockedUserId);
      }

      // Remove any existing friend requests
      const hasIncomingRequest = await this.userRepo.getFriendRequestSection().hasRequest(blockedUserId, userId);
      if (hasIncomingRequest) {
        await this.userRepo.getFriendRequestSection().removeRequest(blockedUserId, userId);
      }

      const hasOutgoingRequest = await this.userRepo.getFriendRequestSection().hasRequest(userId, blockedUserId);
      if (hasOutgoingRequest) {
        await this.userRepo.getFriendRequestSection().removeRequest(userId, blockedUserId);
      }

      return true;
    } catch (error) {
      // Handle specific errors
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error blocking user:", error);
      throw new ServiceError("Failed to block user", error);
    }
  }

  /**
   * Unblocks a user
   * @param userId - The user doing the unblocking
   * @param blockedUserId - The user being unblocked
   * @param requestingUserId - The ID of the user making the change
   * @returns True if the user was unblocked successfully
   * @throws {NotFoundError} If either user or the block doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async unblockUser(userId: number, blockedUserId: number, requestingUserId: number): Promise<boolean> {
    // Check if users exist
    await this.userService.getUserById(userId, requestingUserId);
    await this.userService.getUserById(blockedUserId, requestingUserId);

    // Authorization check (only the user themselves or an admin can unblock users)
    await this.userService.ensureCanModifyUser(userId, requestingUserId);

    try {
      // Check if block exists
      const isBlocked = await this.isBlocked(userId, blockedUserId);
      if (!isBlocked) {
        throw new NotFoundError(`Block of user ${blockedUserId} by user ${userId} not found`);
      }

      // Unblock user
      await this.userRepo.getBlockedUserSection().unblockUser(userId, blockedUserId);

      return true;
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error unblocking user:", error);
      throw new ServiceError("Failed to unblock user", error);
    }
  }

  /**
   * Checks if a user is blocked by another user
   * @param userId - The user who might be blocking
   * @param blockedUserId - The user who might be blocked
   * @returns True if the user is blocked, false otherwise
   * @throws {ServiceError} If there was an error checking the block status
   */
  async isBlocked(userId: number, blockedUserId: number): Promise<boolean> {
    try {
      return await this.userRepo.getBlockedUserSection().isBlocked(userId, blockedUserId);
    } catch (error) {
      console.error(`Failed to check if user ${blockedUserId} is blocked by user ${userId}`, error);
      throw new ServiceError(`Failed to check if user ${blockedUserId} is blocked by user ${userId}`, error);
    }
  }
}
