import type {UserTagInput, UserTagSearchResult, UserWithTags} from "../../../types/user.ts";
import {DuplicateError, NotFoundError, ServiceError, ValidationError} from "../../../errors";
import type {RepoEnv} from "../../../RepoEnv.ts";
import {BaseUserService} from "../base/BaseUserService.ts";

export class UserTagService extends BaseUserService {

  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Adds a tag to a user
   * @param data - The tag data
   * @param requestingUserId - The ID of the user making the change
   * @returns The created tag
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the tag already exists
   */
  async addTag(data: UserTagInput, requestingUserId: number): Promise<UserWithTags> {
    // Check if user exists
    const user = await this.userRepo.getUserSection().findById(data.userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${data.userId} not found`);
    }

    // Authorization check (only the user themselves or an admin can add tags)
    if (data.userId !== requestingUserId) {
      await this.authService.ensureIsAdmin(requestingUserId);
    }

    // Validate input
    this.validateTagInput(data);

    try {
      // Add tag
      await this.userRepo.getUserTagSection().create(data);

      const tags = await this.userRepo.getUserTagSection().findByUserId(data.userId);

      // Return user with tags
      return {
        ...user,
        tags,
      }
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
  async removeTag(userId: number, tag: string, requestingUserId: number): Promise<UserWithTags> {
    // Check if user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    // Authorization check (only the user themselves or an admin can remove tags)
    if (userId !== requestingUserId) {
      await this.authService.ensureIsAdmin(requestingUserId);
    }

    // Check if tag exists
    const hasTag = await this.userTagRepo.hasTag(userId, tag);
    if (!hasTag) {
      throw new NotFoundError(`Tag ${tag} not found for user ${userId}`);
    }

    try {
      // Remove tag
      await this.userTagRepo.removeTag(userId, tag);
      const tags = await this.userTagRepo.findByUserId(userId);

      // Return user with tags
      return {
        ...user,
        tags,
      }
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
   * Finds the most popular tags across all users
   * @param limit - Maximum number of tags to return
   * @returns An array of user tags with count information
   */
  async findPopularTags(limit: number): Promise<UserTagSearchResult[]> {
    try {
      return this.userTagRepo.getPopularTags(limit);
    } catch (error) {
      console.error(`Failed to find popular tags with limit: ${limit}`, error);
      throw new ServiceError(`Failed to find popular tags`, error);
    }
  }

  /**
   * Gets suggested tags for a specific user
   * @param userId - The user ID
   * @param limit - Maximum number of tags to return
   * @returns An array of user tags with count information
   */
  async getSuggestedTagsForUser(userId: number, limit: number): Promise<UserTagSearchResult[]> {
    try {
      return this.userTagRepo.getSuggestedTagsForUser(userId, limit);
    } catch (error) {
      console.error(`Failed to get suggested tags for user: ${userId}`, error);
      throw new ServiceError(`Failed to get suggested tags for user`, error);
    }
  }

  /**
   * Gets suggested tags for a user that match a search term
   * @param userId - The user ID
   * @param searchTerm - The search term
   * @param limit - Maximum number of tags to return
   * @returns An array of user tags with count information
   */
  async getSuggestedTagsForUserBySearchTerm(userId: number, searchTerm: string, limit: number): Promise<UserTagSearchResult[]> {
    try {
      return this.userTagRepo.getSuggestedTagsForUserBySearchTerm(userId, searchTerm, limit);
    } catch (error) {
      console.error(`Failed to get suggested tags for user: ${userId} with search term: ${searchTerm}`, error);
      throw new ServiceError(`Failed to get suggested tags for user with search term`, error);
    }
  }

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
}
