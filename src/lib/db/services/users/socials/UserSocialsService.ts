import type {RepoEnv} from "../../../RepoEnv.ts";
import type {UserSocial, UserSocialInput, UserWithSocials} from "../../../types/user.ts";
import {DuplicateError, NotFoundError, ServiceError, ValidationError} from "../../../errors";
import {BaseUserService} from "../base/BaseUserService.ts";

export class UserSocialsService extends BaseUserService {


  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds all social media links for a user
   * @param userId - The user ID
   * @returns An array of user social media links
   */
  async findByUserId(userId: number): Promise<UserSocial[]> {
    try {
      return await this.userSocialRepo.findByUserId(userId);
    } catch (error) {
      console.error(`Failed to find socials for user: ${userId}`, error);
      throw new ServiceError(`Failed to find socials for user: ${userId}`, error);
    }
  }

  /**
   * Adds a social media link to a user
   * @param data - The social media data
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user with socials
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the social already exists
   */
  async addSocial(data: UserSocialInput, requestingUserId: number): Promise<UserWithSocials> {
    // Check if user exists
    const user = await this.userRepo.findById(data.userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${data.userId} not found`);
    }

    // Authorization check (only the user themselves or an admin can add socials)
    if (data.userId !== requestingUserId) {
      await this.authService.ensureIsAdmin(requestingUserId);
    }

    // Validate input
    this.validateSocialInput(data);

    try {
      // Add social
      await this.userSocialRepo.addSocial(data);

      // Return user with socials
      const socials = await this.userSocialRepo.findByUserId(data.userId);
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
  async removeSocial(userId: number, provider: string, requestingUserId: number): Promise<UserWithSocials> {
    // Check if user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    // Authorization check (only the user themselves or an admin can remove socials)
    if (userId !== requestingUserId) {
      await this.authService.ensureIsAdmin(requestingUserId);
    }

    // Check if social exists
    const hasSocial = await this.userSocialRepo.hasSocial(userId, provider);
    if (!hasSocial) {
      throw new NotFoundError(`Social with provider ${provider} not found for user ${userId}`);
    }

    try {
      // Remove social
      await this.userSocialRepo.removeSocial(userId, provider);

      // Return user with socials
      const socials = await this.userSocialRepo.findByUserId(userId);
      return {
        ...user,
        socials
      };
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

  /**
   * Validates social input data
   * @param data - The social data to validate
   * @throws {ValidationError} If the input data is invalid
   */
  validateSocialInput(data: UserSocialInput): void {
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
