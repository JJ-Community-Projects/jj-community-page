import type {ActionAPIContext} from "astro:actions";
import {BaseService} from "../BaseService.ts";
import {ScheduleService} from "./ScheduleService.ts";
import type {RepoEnv} from "../../repos/BaseRepo.ts";
import type {
  Schedule,
  ScheduleInput,
  ScheduleWithDetailedStreams,
  ScheduleWithStreams,
} from "../../types/schedule.ts";

/**
 * Service for schedule-related business logic within the context of a specific schedule
 * This service handles functionality within the context of a schedule
 */
export class ScheduleServiceWithSchedule extends BaseService {
  private scheduleService: ScheduleService;
  private scheduleId: number;

  /**
   * Creates a new ScheduleServiceWithSchedule instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param scheduleId - The schedule ID
   */
  constructor(env: Env, repoEnv: RepoEnv, scheduleId: number) {
    super(env, repoEnv);
    this.scheduleService = new ScheduleService(env, repoEnv);
    this.scheduleId = scheduleId;
  }

  /**
   * Creates a ScheduleServiceWithSchedule instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param scheduleId - The schedule ID
   * @returns A ScheduleServiceWithSchedule instance
   */
  static action(ctx: ActionAPIContext, scheduleId: number) {
    return new ScheduleServiceWithSchedule(ctx.locals.runtime.env, 'action', scheduleId);
  }

  /**
   * Gets the schedule with authorization check
   * @param userId - The user ID
   * @returns The schedule
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the schedule
   */
  async getSchedule(userId: number): Promise<Schedule> {
    return this.scheduleService.getScheduleById(this.scheduleId, userId);
  }

  /**
   * Gets the schedule with its streams
   * @param userId - The user ID
   * @returns The schedule with streams
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the schedule
   */
  async getScheduleWithStreams(userId: number): Promise<ScheduleWithStreams> {
    return this.scheduleService.getScheduleWithStreams(this.scheduleId, userId);
  }

  /**
   * Gets the schedule with detailed streams (including tags and participants)
   * @param userId - The user ID
   * @returns The schedule with detailed streams
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the schedule
   */
  async getScheduleWithDetailedStreams(userId: number): Promise<ScheduleWithDetailedStreams> {
    return this.scheduleService.getScheduleWithDetailedStreams(this.scheduleId, userId);
  }

  /**
   * Updates the schedule
   * @param data - The schedule data
   * @param userId - The user ID
   * @returns The updated schedule
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {ValidationError} If the input data is invalid
   * @throws {AuthorizationError} If the user doesn't have permission to update the schedule
   */
  async updateSchedule(data: Partial<ScheduleInput>, userId: number): Promise<Schedule> {
    return this.scheduleService.updateSchedule(this.scheduleId, data, userId);
  }

  /**
   * Deletes the schedule
   * @param userId - The user ID
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to delete the schedule
   */
  async deleteSchedule(userId: number): Promise<void> {
    return this.scheduleService.deleteSchedule(this.scheduleId, userId);
  }

  /**
   * Sets this schedule as the primary schedule for its owner
   * @param userId - The user ID
   * @returns The updated schedule
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to update the schedule
   */
  async setPrimarySchedule(userId: number): Promise<Schedule> {
    return this.scheduleService.setPrimarySchedule(this.scheduleId, userId);
  }
}
