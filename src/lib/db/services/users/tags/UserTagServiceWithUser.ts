import type {ActionAPIContext} from "astro:actions";
import type {UserTag, UserTagInput, UserTagSearchResult, UserWithTags} from "../../../types/user.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";
import {BaseUserServiceWithUser} from "../base/BaseUserServiceWithUser.ts";

/**
 * Service for user tags within the context of a specific user
 * This service handles functionality within the context of a user
 */
export class UserTagServiceWithUser extends BaseUserServiceWithUser {

  /**
   * Creates a new UserTagServiceWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The user ID
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv, userId);
  }

  /**
   * Creates a UserTagServiceWithUser instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param userId - The user ID
   * @returns A UserTagServiceWithUser instance
   */
  static action(ctx: ActionAPIContext, userId: number) {
    return new UserTagServiceWithUser(ctx.locals.runtime.env, 'action', userId);
  }

  /**
   * Finds all tags for the user
   * @returns An array of user tags
   */
  async findTags(): Promise<UserTag[]> {
    return await this.userTagService.findByUserId(this.userId);
  }

  /**
   * Adds a tag to the user
   * @param data - The tag data
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user with tags
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the tag already exists
   */
  async addTag(data: Omit<UserTagInput, 'userId'>, requestingUserId: number): Promise<UserWithTags> {
    // Create a new object with the userId from the context
    const tagData: UserTagInput = {
      ...data,
      userId: this.userId
    };
    const result = await this.userTagService.addTag(tagData, requestingUserId);
    await this.refreshDO();
    return result;
  }

  /**
   * Removes a tag from the user
   * @param tag - The tag
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user with tags
   * @throws {NotFoundError} If the user or tag doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async removeTag(tag: string, requestingUserId: number): Promise<UserWithTags> {
    const result = await this.userTagService.removeTag(this.userId, tag, requestingUserId);
    await this.refreshDO();
    return result;
  }

  /**
   * Finds the most popular tags across all users
   * @param limit - Maximum number of tags to return
   * @returns An array of user tags with count information
   */
  async findPopularTags(limit: number): Promise<UserTagSearchResult[]> {
    return this.userTagService.findPopularTags(limit);
  }

  /**
   * Gets suggested tags for the user
   * @param limit - Maximum number of tags to return
   * @returns An array of user tags with count information
   */
  async getSuggestedTags(limit: number): Promise<UserTagSearchResult[]> {
    return this.userTagService.getSuggestedTagsForUser(this.userId, limit);
  }

  /**
   * Gets suggested tags for the user that match a search term
   * @param searchTerm - The search term
   * @param limit - Maximum number of tags to return
   * @returns An array of user tags with count information
   */
  async getSuggestedTagsBySearchTerm(searchTerm: string, limit: number): Promise<UserTagSearchResult[]> {
    return this.userTagService.getSuggestedTagsForUserBySearchTerm(this.userId, searchTerm, limit);
  }
}
