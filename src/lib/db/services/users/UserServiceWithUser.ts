import type {ActionAPIContext} from "astro:actions";
import {BaseUserServiceWithUser} from "./base/BaseUserServiceWithUser.ts";
import {UserService} from "./UserService.ts";
import type {
  FullUser,
  User,
  UserProfile,
  UserSearch
} from "../../types/user.ts";
import type {RepoEnv} from "../../RepoEnv.ts";

/**
 * Service for core user operations and profile management with user context
 *
 * This service provides the same functionality as UserService but
 * automatically uses the user context for authorization. It's designed to be
 * used in contexts where the user is already known, such as in Durable Objects.
 */
export class UserServiceWithUser extends BaseUserServiceWithUser {
  private userService: UserService;

  /**
   * Creates a new UserServiceWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The ID of the user this service operates for
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv, userId);
    this.userService = new UserService(env, repoEnv);
  }

  /**
   * Creates a UserServiceWithUser instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param userId - The ID of the user this service operates for
   * @returns A UserServiceWithUser instance
   */
  static action(ctx: ActionAPIContext, userId: number) {
    return new UserServiceWithUser(ctx.locals.runtime.env, 'action', userId);
  }

  /**
   * Gets the current user
   * @returns The user
   * @throws {NotFoundError} If the user doesn't exist
   */
  async getMyUser(): Promise<User> {
    return await this.userService.getUserById(this.userId, this.userId);
  }

  /**
   * Gets the full current user with Tiltify and Twitch data
   * @returns The full user or undefined if not found
   */
  async getMyFullUser(): Promise<FullUser | undefined> {
    return await this.userService.getFullUserById(this.userId, this.userId);
  }

  /**
   * Gets the current user's profile
   * @returns The user profile
   * @throws {NotFoundError} If the user doesn't exist
   */
  async getMyProfile(): Promise<UserProfile> {
    return await this.userService.getUserProfile(this.userId, this.userId);
  }

  /**
   * Gets a user by ID
   * @param userId - The user ID
   * @returns The user
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   */
  async getUserById(userId: number): Promise<User> {
    return await this.userService.getUserById(userId, this.userId);
  }

  /**
   * Gets a full user with Tiltify and Twitch data
   * @param userId - The user ID
   * @returns The full user or undefined if not found
   * @throws {AuthorizationError} If the current user doesn't have permission
   */
  async getFullUserById(userId: number): Promise<FullUser | undefined> {
    return await this.userService.getFullUserById(userId, this.userId);
  }

  /**
   * Gets a user's profile
   * @param userId - The user ID
   * @returns The user profile
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   */
  async getUserProfile(userId: number): Promise<UserProfile> {
    return await this.userService.getUserProfile(userId, this.userId);
  }

  /**
   * Updates a user's role (admin only)
   * @param userId - The user ID
   * @param role - The new role
   * @returns The updated user
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the current user is not an admin
   */
  async updateUserRole(userId: number, role: "user" | "admin"): Promise<User> {
    const result = await this.userService.updateUserRole(userId, role, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Updates the current user's primary live stream platform
   * @param platform - The platform
   * @returns The updated user
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {ValidationError} If the platform is invalid
   */
  async updateMyPrimaryLiveStream(platform: string): Promise<User> {
    const result = await this.userService.updatePrimaryLiveStream(this.userId, platform, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Updates another user's primary live stream platform (admin only)
   * @param userId - The user ID
   * @param platform - The platform
   * @returns The updated user
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the current user doesn't have permission
   * @throws {ValidationError} If the platform is invalid
   */
  async updatePrimaryLiveStream(userId: number, platform: string): Promise<User> {
    const result = await this.userService.updatePrimaryLiveStream(userId, platform, this.userId);
    await this.refreshDO();
    return result;
  }

  /**
   * Searches for users by username
   * @param query - The search query
   * @param limit - The maximum number of results to return (default: 20)
   * @returns An array of user search results
   */
  async searchUsers(query: string, limit: number = 20): Promise<UserSearch[]> {
    return await this.userService.searchUsers(query, limit);
  }

  /**
   * Checks if the current user is an admin
   * @returns True if the user is an admin, false otherwise
   */
  async isAdmin(): Promise<boolean> {
    try {
      await this.userService.ensureIsAdmin(this.userId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if the current user can modify another user
   * @param targetUserId - The ID of the user to check
   * @returns True if the current user can modify the target user, false otherwise
   */
  async canModifyUser(targetUserId: number): Promise<boolean> {
    try {
      await this.userService.ensureCanModifyUser(targetUserId, this.userId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refreshes the user's Durable Object after user changes
   */
  async refreshUser(): Promise<void> {
    await this.refreshDO();
  }
}
