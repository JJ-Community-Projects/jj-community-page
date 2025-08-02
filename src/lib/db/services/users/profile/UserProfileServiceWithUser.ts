import type {ActionAPIContext} from "astro:actions";
import {BaseUserServiceWithUser} from "../base/BaseUserServiceWithUser.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";
import type {
  UserSocial,
  UserSocialInput,
  UserStyle,
  UserStyleInput,
  UserTag,
  UserTagInput,
  UserTagSearchResult,
  UserWithSocials,
  UserWithStyle,
  UserWithTags
} from "../../../types/user.ts";
import {UserProfileService} from "./UserProfileService.ts";

/**
 * Service for user profile customization and management with user context
 *
 * This service provides the same functionality as UserProfileService but
 * automatically uses the user context for authorization. It's designed to be
 * used in contexts where the user is already known, such as in Durable Objects.
 */
export class UserProfileServiceWithUser extends BaseUserServiceWithUser {
  private profileService: UserProfileService;

  /**
   * Creates a new UserProfileServiceWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The ID of the user this service operates for
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv, userId);
    this.profileService = new UserProfileService(env, repoEnv);
  }

  /**
   * Creates a UserProfileServiceWithUser instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param userId - The ID of the user this service operates for
   * @returns A UserProfileServiceWithUser instance
   */
  static action(ctx: ActionAPIContext, userId: number) {
    return new UserProfileServiceWithUser(ctx.locals.runtime.env, 'action', userId);
  }

  // ===== STYLE METHODS =====

  /**
   * Gets a user's style preferences
   * @param userId - The user ID
   * @returns The user style
   * @throws {NotFoundError} If the user doesn't exist
   */
  async getUserStyle(userId: number): Promise<UserStyle> {
    return await this.profileService.getUserStyle(userId, this.userId);
  }

  /**
   * Gets the current user's style preferences
   * @returns The user style
   */
  async getMyStyle(): Promise<UserStyle> {
    return await this.profileService.getUserStyle(this.userId, this.userId);
  }

  /**
   * Updates a user's style preferences
   * @param styleInput - The style data
   * @returns The updated user with style
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   */
  async updateUserStyle(styleInput: UserStyleInput): Promise<UserWithStyle> {
    return await this.profileService.updateUserStyle(styleInput, this.userId);
  }

  /**
   * Updates the current user's style preferences
   * @param primaryColor - The new primary color (optional)
   * @param accentColor - The new accent color (optional)
   * @returns The updated user with style
   */
  async updateMyStyle(primaryColor?: string, accentColor?: string): Promise<UserWithStyle> {
    const styleInput: UserStyleInput = {
      userId: this.userId,
      primaryColor,
      accentColor
    };
    return await this.profileService.updateUserStyle(styleInput, this.userId);
  }

  // ===== TAG METHODS =====

  /**
   * Gets a user's tags
   * @param userId - The user ID
   * @returns An array of user tags
   * @throws {NotFoundError} If the user doesn't exist
   */
  async getUserTags(userId: number): Promise<UserTag[]> {
    return await this.profileService.getUserTags(userId, this.userId);
  }

  /**
   * Gets the current user's tags
   * @returns An array of user tags
   */
  async getMyTags(): Promise<UserTag[]> {
    return await this.profileService.getUserTags(this.userId, this.userId);
  }

  /**
   * Adds a tag to a user
   * @param tagInput - The tag data
   * @returns The updated user with tags
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the tag already exists
   */
  async addUserTag(tagInput: UserTagInput): Promise<UserWithTags> {
    return await this.profileService.addUserTag(tagInput, this.userId);
  }

  /**
   * Adds a tag to the current user
   * @param tag - The tag
   * @param label - The label
   * @returns The updated user with tags
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the tag already exists
   */
  async addMyTag(tag: string, label: string): Promise<UserWithTags> {
    const tagInput: UserTagInput = {
      userId: this.userId,
      tag,
      label
    };
    return await this.profileService.addUserTag(tagInput, this.userId);
  }

  /**
   * Removes a tag from a user
   * @param userId - The user ID
   * @param tag - The tag
   * @returns The updated user with tags
   * @throws {NotFoundError} If the user or tag doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async removeUserTag(userId: number, tag: string): Promise<void> {
    await this.profileService.removeUserTag(userId, tag, this.userId);
  }

  /**
   * Removes a tag from the current user
   * @param tag - The tag
   */
  async removeMyTag(tag: string): Promise<void> {
    await this.profileService.removeUserTag(this.userId, tag, this.userId);
  }

  /**
   * Gets the most popular tags across all users
   * @param limit - Maximum number of tags to return (default: 20)
   * @returns An array of user tags with count information
   */
  async getPopularTags(limit: number = 20): Promise<UserTagSearchResult[]> {
    return await this.profileService.getPopularTags(limit);
  }

  // ===== SOCIAL METHODS =====

  /**
   * Gets a user's social media links
   * @param userId - The user ID
   * @returns An array of user social media links
   * @throws {NotFoundError} If the user doesn't exist
   */
  async getUserSocials(userId: number): Promise<UserSocial[]> {
    return await this.profileService.getUserSocials(userId, this.userId);
  }

  /**
   * Gets the current user's social media links
   * @returns An array of user social media links
   */
  async getMySocials(): Promise<UserSocial[]> {
    return await this.profileService.getUserSocials(this.userId, this.userId);
  }

  /**
   * Adds a social media link to a user
   * @param socialInput - The social media data
   * @returns The updated user with socials
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the social already exists
   */
  async addUserSocial(socialInput: UserSocialInput): Promise<UserWithSocials> {
    return await this.profileService.addUserSocial(socialInput, this.userId);
  }

  /**
   * Adds a social media link to the current user
   * @param provider - The provider
   * @param url - The URL
   * @returns The updated user with socials
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the social already exists
   */
  async addMySocial(provider: string, url: string): Promise<UserWithSocials> {
    const socialInput: UserSocialInput = {
      userId: this.userId,
      provider,
      url
    };
    return await this.profileService.addUserSocial(socialInput, this.userId);
  }

  /**
   * Removes a social media link from a user
   * @param userId - The user ID
   * @param provider - The provider
   * @throws {NotFoundError} If the user or social doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async removeUserSocial(userId: number, provider: string): Promise<void> {
    await this.profileService.removeUserSocial(userId, provider, this.userId);
  }

  /**
   * Removes a social media link from the current user
   * @param provider - The provider
   */
  async removeMySocial(provider: string): Promise<void> {
    await this.profileService.removeUserSocial(this.userId, provider, this.userId);
  }

  /**
   * Refreshes the user's Durable Object after profile changes
   */
  async refreshProfile(): Promise<void> {
    await this.refreshDO();
  }
}
