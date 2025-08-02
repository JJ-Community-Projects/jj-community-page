import type {ActionAPIContext} from "astro:actions";
import {BaseService} from "../BaseService.ts";
import {UserRepo} from "../../repos/user/UserRepo.ts";
import {AuthorizationError, NotFoundError} from "../../errors";
import type {RepoEnv} from "../../RepoEnv.ts";

/**
 * Service for handling user-related authorization checks
 *
 * This service provides methods for verifying user permissions
 * and roles, ensuring that users can only perform actions they
 * are authorized to perform.
 */
export class UserAuthorizationService extends BaseService {
  private userRepo: UserRepo;

  /**
   * Creates a new UserAuthorizationService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.userRepo = new UserRepo(env, repoEnv);
  }

  /**
   * Creates a UserAuthorizationService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A UserAuthorizationService instance
   */
  static action(ctx: ActionAPIContext) {
    return new UserAuthorizationService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Ensures the user is an admin
   * @param userId - The user ID
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {AuthorizationError} If the user is not an admin
   */
  async ensureIsAdmin(userId: number): Promise<void> {
    const user = await this.userRepo.getUserSection().findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    if (user.role !== 'admin') {
      throw new AuthorizationError(`You must be an admin to perform this action`);
    }
  }

  /**
   * Checks if a user is an admin
   * @param userId - The user ID
   * @returns True if the user is an admin, false otherwise
   */
  async isAdmin(userId: number): Promise<boolean> {
    try {
      await this.ensureIsAdmin(userId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Ensures the requesting user can modify the target user
   * @param targetUserId - The ID of the user being modified
   * @param requestingUserId - The ID of the user making the change
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async ensureCanModifyUser(targetUserId: number, requestingUserId: number): Promise<void> {
    // Users can modify themselves
    if (targetUserId === requestingUserId) {
      return;
    }

    // Admins can modify any user
    try {
      await this.ensureIsAdmin(requestingUserId);
    } catch (error) {
      throw new AuthorizationError(`You don't have permission to modify this user`);
    }
  }

  /**
   * Checks if a user can modify another user
   * @param targetUserId - The ID of the user to check
   * @param requestingUserId - The ID of the user making the request
   * @returns True if the user can modify the target user, false otherwise
   */
  async canModifyUser(targetUserId: number, requestingUserId: number): Promise<boolean> {
    try {
      await this.ensureCanModifyUser(targetUserId, requestingUserId);
      return true;
    } catch (error) {
      return false;
    }
  }
}
