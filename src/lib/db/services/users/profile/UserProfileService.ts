import type {ActionAPIContext} from "astro:actions";
import {BaseUserService} from "../base/BaseUserService.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";
import {
  DuplicateError,
  NotFoundError,
  ServiceError,
  ValidationError
} from "../../../errors";
import type {
  User,
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
import {UserService} from "../UserService.ts";

/**
 * Service for user profile customization and management
 *
 * This service handles all aspects of a user's profile customization, including
 * style preferences, tags, and social media links. It consolidates functionality
 * that was previously spread across multiple services.
 */
export class UserProfileService extends BaseUserService {
  private userService: UserService;

  /**
   * Creates a new UserProfileService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.userService = new UserService(env, repoEnv);
  }

  /**
   * Creates a UserProfileService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A UserProfileService instance
   */
  static action(ctx: ActionAPIContext) {
    return new UserProfileService(ctx.locals.runtime.env, 'action');
  }

  // ===== STYLE METHODS =====

  /**
   * Gets a user's style preferences
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns The user style
   * @throws {NotFoundError} If the user doesn't exist
   */
  async getUserStyle(userId: number, requestingUserId?: number): Promise<UserStyle> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    // Get or create style
    let style = await this.userRepo.getUserStyleSection().findById(userId);
    if (!style) {
      // Create a default style if user doesn't have one
      style = await this.userRepo.getUserStyleSection().create({
        userId,
        primaryColor: '#E30E50',
        accentColor: '#3584BF'
      });
    }

    return style;
  }

  /**
   * Updates a user's style preferences
   * @param styleInput - The style data
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user with style
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   */
  async updateUserStyle(styleInput: UserStyleInput, requestingUserId: number): Promise<UserWithStyle> {
    // Check if user exists
    const user = await this.userService.getUserById(styleInput.userId, requestingUserId);

    // Authorization check
    await this.authService.ensureCanModifyUser(styleInput.userId, requestingUserId);

    try {
      // Update style
      const style = await this.userRepo.getUserStyleSection().getOrCreate(styleInput.userId);

      // Only update fields that are provided
      const updates: Partial<UserStyle> = {};
      if (styleInput.primaryColor) updates.primaryColor = styleInput.primaryColor;
      if (styleInput.accentColor) updates.accentColor = styleInput.accentColor;

      // If there are updates to make
      if (Object.keys(updates).length > 0) {
        const updatedStyle = await this.userRepo.getUserStyleSection().update(styleInput.userId, updates);
        return {
          ...user,
          style: updatedStyle
        };
      }

      // Return current style if no updates
      return {
        ...user,
        style
      };
    } catch (error) {
      // Handle specific errors
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error updating style:", error);
      throw new ServiceError("Failed to update style", error);
    }
  }

  // ===== TAG METHODS =====

  /**
   * Gets a user's tags
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns An array of user tags
   * @throws {NotFoundError} If the user doesn't exist
   */
  async getUserTags(userId: number, requestingUserId?: number): Promise<UserTag[]> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    try {
      return await this.userRepo.getUserTagSection().findByUserId(userId);
    } catch (error) {
      console.error(`Failed to find tags for user: ${userId}`, error);
      throw new ServiceError(`Failed to find tags for user: ${userId}`, error);
    }
  }

  /**
   * Adds a tag to a user
   * @param tagInput - The tag data
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user with tags
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the tag already exists
   */
  async addUserTag(tagInput: UserTagInput, requestingUserId: number): Promise<UserWithTags> {
    // Check if user exists
    const user = await this.userService.getUserById(tagInput.userId, requestingUserId);

    // Authorization check
    await this.authService.ensureCanModifyUser(tagInput.userId, requestingUserId);

    // Validate input
    this.validateTagInput(tagInput);

    try {
      // Add tag
      await this.userRepo.getUserTagSection().addTag(tagInput);

      // Get updated tags
      const tags = await this.userRepo.getUserTagSection().findByUserId(tagInput.userId);

      // Return user with tags
      return {
        ...user,
        tags
      };
    } catch (error) {
      // Handle specific errors
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error adding tag:", error);
      throw new ServiceError("Failed to add tag", error);
    }
  }

  /**
   * Removes a tag from a user
   * @param userId - The user ID
   * @param tag - The tag
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user with tags
   * @throws {NotFoundError} If the user or tag doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async removeUserTag(userId: number, tag: string, requestingUserId: number): Promise<void> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    // Authorization check
    await this.authService.ensureCanModifyUser(userId, requestingUserId);

    // Check if tag exists
    const hasTag = await this.userRepo.getUserTagSection().hasTag(userId, tag);
    if (!hasTag) {
      throw new NotFoundError(`Tag ${tag} not found for user ${userId}`);
    }

    try {
      // Remove tag
      await this.userRepo.getUserTagSection().removeTag(userId, tag);
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error removing tag:", error);
      throw new ServiceError("Failed to remove tag", error);
    }
  }

  /**
   * Gets the most popular tags across all users
   * @param limit - Maximum number of tags to return (default: 20)
   * @returns An array of user tags with count information
   */
  async getPopularTags(limit: number = 20): Promise<UserTagSearchResult[]> {
    try {
      return this.userRepo.getUserTagSection().getPopularTags(limit);
    } catch (error) {
      console.error(`Failed to find popular tags with limit: ${limit}`, error);
      throw new ServiceError(`Failed to find popular tags`, error);
    }
  }

  // ===== SOCIAL METHODS =====

  /**
   * Gets a user's social media links
   * @param userId - The user ID
   * @param requestingUserId - The ID of the user making the request (optional)
   * @returns An array of user social media links
   * @throws {NotFoundError} If the user doesn't exist
   */
  async getUserSocials(userId: number, requestingUserId?: number): Promise<UserSocial[]> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    try {
      return await this.userRepo.getUserSocialSection().findByUserId(userId);
    } catch (error) {
      console.error(`Failed to find socials for user: ${userId}`, error);
      throw new ServiceError(`Failed to find socials for user: ${userId}`, error);
    }
  }

  /**
   * Adds a social media link to a user
   * @param socialInput - The social media data
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user with socials
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the social already exists
   */
  async addUserSocial(socialInput: UserSocialInput, requestingUserId: number): Promise<UserWithSocials> {
    // Check if user exists
    const user = await this.userService.getUserById(socialInput.userId, requestingUserId);

    // Authorization check
    await this.authService.ensureCanModifyUser(socialInput.userId, requestingUserId);

    // Validate input
    this.validateSocialInput(socialInput);

    try {
      // Add social
      await this.userRepo.getUserSocialSection().addSocial(socialInput);

      // Get updated socials
      const socials = await this.userRepo.getUserSocialSection().findByUserId(socialInput.userId);

      // Return user with socials
      return {
        ...user,
        socials
      };
    } catch (error) {
      // Handle specific errors
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error adding social:", error);
      throw new ServiceError("Failed to add social", error);
    }
  }

  /**
   * Removes a social media link from a user
   * @param userId - The user ID
   * @param provider - The provider
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user with socials
   * @throws {NotFoundError} If the user or social doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async removeUserSocial(userId: number, provider: string, requestingUserId: number): Promise<void> {
    // Check if user exists
    await this.userService.getUserById(userId, requestingUserId);

    // Authorization check
    await this.authService.ensureCanModifyUser(userId, requestingUserId);

    // Check if social exists
    const hasSocial = await this.userRepo.getUserSocialSection().hasSocial(userId, provider);
    if (!hasSocial) {
      throw new NotFoundError(`Social with provider ${provider} not found for user ${userId}`);
    }

    try {
      // Remove social
      await this.userRepo.getUserSocialSection().removeSocial(userId, provider);
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error removing social:", error);
      throw new ServiceError("Failed to remove social", error);
    }
  }

  // ===== VALIDATION METHODS =====

  /**
   * Validates tag input data
   * @param data - The tag data to validate
   * @throws {ValidationError} If the input data is invalid
   */
  private validateTagInput(data: UserTagInput): void {
    if (!data.tag || data.tag.trim() === '') {
      throw new ValidationError("Tag is required");
    }

    if (!data.label || data.label.trim() === '') {
      throw new ValidationError("Label is required");
    }

    // Tag should be alphanumeric with hyphens
    if (!/^[a-z0-9-]+$/.test(data.tag)) {
      throw new ValidationError("Tag can only contain lowercase letters, numbers, and hyphens");
    }
  }

  /**
   * Validates social input data
   * @param data - The social data to validate
   * @throws {ValidationError} If the input data is invalid
   */
  private validateSocialInput(data: UserSocialInput): void {
    if (!data.provider || data.provider.trim() === '') {
      throw new ValidationError("Provider is required");
    }

    if (!data.url || data.url.trim() === '') {
      throw new ValidationError("URL is required");
    }

    // URL should be a valid URL
    try {
      new URL(data.url);
    } catch (error) {
      throw new ValidationError("Invalid URL format");
    }
  }
}
