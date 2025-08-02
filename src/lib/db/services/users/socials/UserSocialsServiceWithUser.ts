import type {ActionAPIContext} from "astro:actions";
import {BaseService} from "../../BaseService.ts";
import {UserSocialsService} from "./UserSocialsService.ts";
import type {UserSocial, UserSocialInput, UserWithSocials} from "../../../types/user.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";
import {BaseUserServiceWithUser} from "../base/BaseUserServiceWithUser.ts";

/**
 * Service for user social media links within the context of a specific user
 * This service handles functionality within the context of a user
 */
export class UserSocialsServiceWithUser extends BaseUserServiceWithUser {

  /**
   * Creates a new UserSocialsServiceWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The user ID
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv, userId);
  }

  /**
   * Creates a UserSocialsServiceWithUser instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param userId - The user ID
   * @returns A UserSocialsServiceWithUser instance
   */
  static action(ctx: ActionAPIContext, userId: number) {
    return new UserSocialsServiceWithUser(ctx.locals.runtime.env, 'action', userId);
  }

  /**
   * Finds all social media links for the user
   * @returns An array of user social media links
   */
  async findSocials(): Promise<UserSocial[]> {
    return this.userSocialsService.findByUserId(this.userId);
  }

  /**
   * Adds a social media link to the user
   * @param data - The social media data
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user with socials
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {ValidationError} If the input data is invalid
   * @throws {DuplicateError} If the social already exists
   */
  async addSocial(data: Omit<UserSocialInput, 'userId'>, requestingUserId: number): Promise<UserWithSocials> {
    // Create a new object with the userId from the context
    const socialData: UserSocialInput = {
      ...data,
      userId: this.userId
    };
    const result = await this.userSocialsService.addSocial(socialData, requestingUserId);
    await this.refreshDO();
    return result;
  }

  /**
   * Removes a social media link from the user
   * @param provider - The provider
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated user with socials
   * @throws {NotFoundError} If the user or social doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async removeSocial(provider: string, requestingUserId: number): Promise<UserWithSocials> {
    const result = await this.userSocialsService.removeSocial(this.userId, provider, requestingUserId);
    await this.refreshDO();
    return result;
  }

  private async refreshDO() {
    const DO = this.env.UserDO;
    const id = DO.idFromName(`${this.userId}`);
    const stub = DO.get(id);
    const rpc = await stub.setMetaData(`${this.userId}`)
    // await stub.refresh(`${this.userId}`)
    await rpc.refresh()
  }
}
