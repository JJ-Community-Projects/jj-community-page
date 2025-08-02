import type {AccountInput, UserSocialInput, UserTagInput} from "../../types/user.ts";
import {ValidationError} from "../../errors";


export class UserValidation {

  /**
   * Validates account input data
   * @param data - The account data to validate
   * @throws {ValidationError} If the input data is invalid
   */
  validateAccountInput(data: AccountInput): void {
    if (!data.provider || data.provider.trim() === '') {
      throw new ValidationError("Provider is required");
    }

    if (!data.providerId || data.providerId.trim() === '') {
      throw new ValidationError("Provider ID is required");
    }

    if (!data.providerUsername || data.providerUsername.trim() === '') {
      throw new ValidationError("Provider username is required");
    }
  }

  /**
   * Validates tag input data
   * @param data - The tag data to validate
   * @throws {ValidationError} If the input data is invalid
   */
  validateTagInput(data: UserTagInput): void {
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

  /**
   * Checks if a platform is valid
   * @param platform - The platform to check
   * @returns True if the platform is valid, false otherwise
   */
  isValidPlatform(platform: string): boolean {
    const validPlatforms = ['twitch', 'youtube', 'tiktok'];
    return validPlatforms.includes(platform.toLowerCase());
  }
}
