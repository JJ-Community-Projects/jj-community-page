import {BaseUserServiceWithUser} from "../base/BaseUserServiceWithUser.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";
import type {ActionAPIContext} from "astro:actions";
import type {User} from "../../../types/user.ts";
import {UserRelationService} from "./UserRelationService.ts";

/**
 * Service for user relationship management with user context
 *
 * This service provides the same functionality as UserRelationService but
 * automatically uses the user context for authorization. It's designed to be
 * used in contexts where the user is already known, such as in Durable Objects.
 */
export class UserRelationServiceWithUser extends BaseUserServiceWithUser {
  private relationService: UserRelationService;

  /**
   * Creates a new UserRelationServiceWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The ID of the user this service operates for
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv, userId);
    this.relationService = new UserRelationService(env, repoEnv);
  }

  /**
   * Creates a UserRelationServiceWithUser instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param userId - The ID of the user this service operates for
   * @returns A UserRelationServiceWithUser instance
   */
  static action(ctx: ActionAPIContext, userId: number) {
    return new UserRelationServiceWithUser(ctx.locals.runtime.env, 'action', userId);
  }

  /**
   * Gets all friends of the current user
   * @returns An array of users who are friends with the current user
   * @throws {ServiceError} If there was an error retrieving the friends
   */
  async getFriends(): Promise<User[]> {
    return await this.relationService.getFriends(this.userId, this.userId);
  }

  /**
   * Gets users who sent friend requests to the current user
   * @returns An array of users who sent friend requests to the current user
   * @throws {ServiceError} If there was an error retrieving the requests
   */
  async getIncomingRequestUsers(): Promise<User[]> {
    return await this.relationService.getIncomingRequestUsers(this.userId, this.userId);
  }

  /**
   * Gets users who received friend requests from the current user
   * @returns An array of users who received friend requests from the current user
   * @throws {ServiceError} If there was an error retrieving the requests
   */
  async getOutgoingRequestUsers(): Promise<User[]> {
    return await this.relationService.getOutgoingRequestUsers(this.userId, this.userId);
  }

  /**
   * Gets all users blocked by the current user
   * @returns An array of users who are blocked by the current user
   * @throws {ServiceError} If there was an error retrieving the blocked users
   */
  async getBlockedUsers(): Promise<User[]> {
    return await this.relationService.getBlockedUsers(this.userId, this.userId);
  }

  /**
   * Sends a friend request to another user
   * @param toUserId - The user receiving the request
   * @returns True if the request was sent successfully
   * @throws {NotFoundError} If either user doesn't exist
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the request already exists
   */
  async sendFriendRequest(toUserId: number): Promise<boolean> {
    const result = await this.relationService.sendFriendRequest(this.userId, toUserId, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Accepts a friend request
   * @param fromUserId - The user who sent the request
   * @returns True if the request was accepted successfully
   * @throws {NotFoundError} If either user or the request doesn't exist
   */
  async acceptFriendRequest(fromUserId: number): Promise<boolean> {
    const result = await this.relationService.acceptFriendRequest(this.userId, fromUserId, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Rejects a friend request
   * @param fromUserId - The user who sent the request
   * @returns True if the request was rejected successfully
   * @throws {NotFoundError} If either user or the request doesn't exist
   */
  async rejectFriendRequest(fromUserId: number): Promise<boolean> {
    const result = await this.relationService.rejectFriendRequest(this.userId, fromUserId, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Removes a friendship between the current user and another user
   * @param otherUserId - The other user
   * @returns True if the friendship was removed successfully
   * @throws {NotFoundError} If either user or the friendship doesn't exist
   */
  async removeFriend(otherUserId: number): Promise<boolean> {
    const result = await this.relationService.removeFriend(this.userId, otherUserId, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Blocks a user
   * @param blockedUserId - The user being blocked
   * @returns True if the user was blocked successfully
   * @throws {NotFoundError} If either user doesn't exist
   * @throws {ValidationError} If the input data is invalid
   */
  async blockUser(blockedUserId: number): Promise<boolean> {
    const result = await this.relationService.blockUser(this.userId, blockedUserId, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Unblocks a user
   * @param blockedUserId - The user being unblocked
   * @returns True if the user was unblocked successfully
   * @throws {NotFoundError} If either user or the block doesn't exist
   */
  async unblockUser(blockedUserId: number): Promise<boolean> {
    const result = await this.relationService.unblockUser(this.userId, blockedUserId, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Checks if a user is blocked by the current user
   * @param blockedUserId - The user to check
   * @returns True if the user is blocked, false otherwise
   * @throws {ServiceError} If there was an error checking the block status
   */
  async isBlocked(blockedUserId: number): Promise<boolean> {
    return await this.relationService.isBlocked(this.userId, blockedUserId);
  }

  /**
   * Refreshes the user's Durable Object after relationship changes
   */
  async refreshRelations(): Promise<void> {
    await this.refreshDO();
  }
}
