import type {ActionAPIContext} from "astro:actions";
import {BaseUserService} from "./base/BaseUserService.ts";
import {AuthorizationError, NotFoundError, ServiceError, ValidationError} from "../../errors";
import type {FullUser, User, UserProfile, UserSearch} from "../../types/user.ts";
import {eq} from "drizzle-orm";
import {fullUsersView} from "../../schema/views-schema.ts";
import {UserRelationService} from "./relations/UserRelationService.ts";
import {UserProfileService} from "./profile/UserProfileService.ts";
import {UserAccountService} from "./accounts/UserAccountService.ts";
import {UserTiltifyService} from "./tiltify/UserTiltifyService.ts";
import type {RepoEnv} from "../../RepoEnv.ts";

/**
 * Service for core user operations and profile management
 *
 * This service handles basic user operations such as retrieving user data,
 * updating user roles, managing primary live stream platforms, and performing
 * authorization checks. It serves as the main entry point for user-related
 * functionality.
 */
export class UserService extends BaseUserService {
  private relationService: UserRelationService;
  private profileService: UserProfileService;
  private accountService: UserAccountService;
  private tiltifyService: UserTiltifyService;

  /**
   * Creates a new UserService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.relationService = new UserRelationService(env, repoEnv);
    this.profileService = new UserProfileService(env, repoEnv);
    this.accountService = new UserAccountService(env, repoEnv);
    this.tiltifyService = new UserTiltifyService(env, repoEnv);
  }

  /**
   * Creates a UserService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A UserService instance
   */
  static action(ctx: ActionAPIContext) {
    return new UserService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Gets a user by ID
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns The user
   * @throws {NotFoundError} If the user doesn't exist
   */
  async getUserById(userId: number, requestingUserId?: number): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * Gets a full user record with Tiltify and Twitch data
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns The full user record or undefined if not found
   */
  async getFullUserById(userId: number, requestingUserId?: number): Promise<FullUser | undefined> {
    const result = await this.db.select()
      .from(fullUsersView)
      .where(eq(fullUsersView.user.id, userId))
      .get();
    return result as (FullUser | undefined);
  }

  /**
   * Gets a complete user profile with all related data
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns The user profile
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {ServiceError} If there's an error retrieving the profile
   */
  async getUserProfile(userId: number, requestingUserId?: number): Promise<UserProfile> {
    const fullUser = await this.getFullUserById(userId);
    if (!fullUser) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    const {user, tiltify, twitch} = fullUser;

    try {
      // Get all user data from various repositories
      const tags = await this.profileService.getUserTags(userId, requestingUserId);
      const socials = await this.profileService.getUserSocials(userId, requestingUserId);
      const style = await this.profileService.getUserStyle(userId, requestingUserId);

      // Get relationship data
      const friends = await this.relationService.getFriends(userId, requestingUserId);
      const incoming = await this.relationService.getIncomingRequestUsers(userId, requestingUserId);
      const outgoing = await this.relationService.getOutgoingRequestUsers(userId, requestingUserId);
      const blockedUsers = await this.relationService.getBlockedUsers(userId, requestingUserId);

      // Combine all data into a complete profile
      return {
        ...user,
        tiltify,
        twitch,
        tags,
        socials,
        style,
        friends,
        friendRequests: {
          incoming,
          outgoing
        },
        blockedUsers
      };
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw new ServiceError("Failed to get user profile", error);
    }
  }

  /**
   * Updates a user's primary live stream platform
   * @param userId - The user ID
   * @param platform - The new platform
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the platform is invalid
   */
  async updatePrimaryLiveStream(userId: number, platform: string, requestingUserId: number): Promise<User> {
    // Check if user exists
    const user = await this.getUserById(userId);

    // Authorization check
    await this.authService.ensureCanModifyUser(userId, requestingUserId);

    // Validate platform
    if (!this.isValidPlatform(platform)) {
      throw new ValidationError(`Invalid platform: ${platform}`);
    }

    // Update primary live stream
    return await this.userRepo.updatePrimaryLiveStream(userId, platform);
  }

  /**
   * Searches for users by username
   * @param query - The search query
   * @param limit - The maximum number of results to return (default: 20)
   * @returns An array of user search results
   */
  async searchUsers(query: string, limit: number = 20): Promise<UserSearch[]> {
    if (!query || query.trim() === '') {
      return [];
    }

    return await this.userRepo.searchUsers(query, limit);
  }


  /**
   * Checks if a platform is valid
   * @param platform - The platform to check
   * @returns True if the platform is valid, false otherwise
   */
  private isValidPlatform(platform: string): boolean {
    const validPlatforms = ['twitch', 'youtube', 'tiktok'];
    return validPlatforms.includes(platform.toLowerCase());
  }
}
