import type { ActionAPIContext } from "astro:actions";
import { BaseService } from "../BaseService.ts";
import { ScheduleRepo } from "../../repos/schedules/ScheduleRepo.ts";
import { UserRepo } from "../../repos/users/UserRepo.ts";
import { AuthorizationError, NotFoundError } from "../../errors";
import type {RepoEnv} from "../../repos/BaseRepo.ts";

/**
 * Service for handling schedule-related authorization checks
 */
export class ScheduleAuthorizationService extends BaseService {
  private scheduleRepo: ScheduleRepo;
  private userRepo: UserRepo;

  /**
   * Creates a new ScheduleAuthorizationService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.scheduleRepo = new ScheduleRepo(env, repoEnv);
    this.userRepo = new UserRepo(env, repoEnv);
  }

  /**
   * Creates a ScheduleAuthorizationService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A ScheduleAuthorizationService instance
   */
  static action(ctx: ActionAPIContext) {
    return new ScheduleAuthorizationService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Ensures the user can view a schedule
   * @param userId - The user ID
   * @param scheduleId - The schedule ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the schedule doesn't exist
   */
  async ensureCanViewSchedule(userId: number, scheduleId: number): Promise<void> {
    const schedule = await this.scheduleRepo.findById(scheduleId);

    if (!schedule) {
      throw new NotFoundError(`Schedule with ID ${scheduleId} not found`);
    }

    // Public schedules can be viewed by anyone
    if (schedule.visible) {
      return;
    }

    // Schedule owners can always view their schedules
    if (schedule.ownerId === userId) {
      return;
    }

    // Check if user is an admin
    const user = await this.userRepo.findById(userId);
    if (user && user.role === 'admin') {
      return;
    }

    throw new AuthorizationError(`You don't have permission to view this schedule`);
  }

  /**
   * Ensures the user can edit a schedule
   * @param userId - The user ID
   * @param scheduleId - The schedule ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the schedule doesn't exist
   */
  async ensureCanEditSchedule(userId: number, scheduleId: number): Promise<void> {
    const schedule = await this.scheduleRepo.findById(scheduleId);

    if (!schedule) {
      throw new NotFoundError(`Schedule with ID ${scheduleId} not found`);
    }

    // Schedule owners can always edit their schedules
    if (schedule.ownerId === userId) {
      return;
    }

    // Check if user is an admin
    const user = await this.userRepo.findById(userId);
    if (user && user.role === 'admin') {
      return;
    }

    throw new AuthorizationError(`You don't have permission to edit this schedule`);
  }

  /**
   * Ensures the user can delete a schedule
   * @param userId - The user ID
   * @param scheduleId - The schedule ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the schedule doesn't exist
   */
  async ensureCanDeleteSchedule(userId: number, scheduleId: number): Promise<void> {
    const schedule = await this.scheduleRepo.findById(scheduleId);

    if (!schedule) {
      throw new NotFoundError(`Schedule with ID ${scheduleId} not found`);
    }

    // Schedule owners can always delete their schedules
    if (schedule.ownerId === userId) {
      return;
    }

    // Check if user is an admin
    const user = await this.userRepo.findById(userId);
    if (user && user.role === 'admin') {
      return;
    }

    throw new AuthorizationError(`You don't have permission to delete this schedule`);
  }

  /**
   * Ensures the user can create a schedule
   * @param userId - The user ID
   * @throws {AuthorizationError} If the user doesn't have permission
   */
  async ensureCanCreateSchedule(userId: number): Promise<void> {
    // All authenticated users can create schedules
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      throw new AuthorizationError(`User with ID ${userId} not found`);
    }
  }
}
