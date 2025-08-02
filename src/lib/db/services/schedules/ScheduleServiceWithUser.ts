import type {ActionAPIContext} from "astro:actions";
import {BaseService} from "../BaseService.ts";
import {ScheduleService} from "./ScheduleService.ts";
import type {RepoEnv} from "../../repos/BaseRepo.ts";
import type {
  DetailedStream,
  Schedule,
  ScheduleInput,
  ScheduleWithDetailedStreams,
  ScheduleWithStreams,
} from "../../types/schedule.ts";

/**
 * Service for schedule-related business logic within the context of a specific user
 * This service handles functionality within the context of a user
 */
export class ScheduleServiceWithUser extends BaseService {
  private scheduleService: ScheduleService;
  private userId: number;

  /**
   * Creates a new ScheduleServiceWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The user ID
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv);
    this.scheduleService = new ScheduleService(env, repoEnv);
    this.userId = userId;
  }

  /**
   * Creates a ScheduleServiceWithUser instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param userId - The user ID
   * @returns A ScheduleServiceWithUser instance
   */
  static action(ctx: ActionAPIContext, userId: number) {
    return new ScheduleServiceWithUser(ctx.locals.runtime.env, 'action', userId);
  }

  /**
   * Gets a schedule by ID with authorization check
   * @param scheduleId - The schedule ID
   * @returns The schedule
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the schedule
   */
  async getScheduleById(scheduleId: number): Promise<Schedule> {
    return this.scheduleService.getScheduleById(scheduleId, this.userId);
  }

  /**
   * Gets a schedule by slug with authorization check
   * @param slug - The schedule slug
   * @returns The schedule
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the schedule
   */
  async getScheduleBySlug(slug: string): Promise<Schedule> {
    return this.scheduleService.getScheduleBySlug(slug, this.userId);
  }

  /**
   * Gets a schedule with its streams
   * @param scheduleId - The schedule ID
   * @returns The schedule with streams
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the schedule
   */
  async getScheduleWithStreams(scheduleId: number): Promise<ScheduleWithStreams> {
    return this.scheduleService.getScheduleWithStreams(scheduleId, this.userId);
  }

  /**
   * Gets a schedule with detailed streams (including tags and participants)
   * @param scheduleId - The schedule ID
   * @returns The schedule with detailed streams
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the schedule
   */
  async getScheduleWithDetailedStreams(scheduleId: number): Promise<ScheduleWithDetailedStreams> {
    return this.scheduleService.getScheduleWithDetailedStreams(scheduleId, this.userId);
  }

  /**
   * Creates a new schedule
   * @param data - The schedule data
   * @returns The created schedule
   * @throws {ValidationError} If the input data is invalid
   * @throws {AuthorizationError} If the user doesn't have permission to create a schedule
   */
  async createSchedule(data: ScheduleInput): Promise<Schedule> {
    return this.scheduleService.createSchedule(data, this.userId);
  }

  /**
   * Updates a schedule
   * @param scheduleId - The schedule ID
   * @param data - The schedule data
   * @returns The updated schedule
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {ValidationError} If the input data is invalid
   * @throws {AuthorizationError} If the user doesn't have permission to update the schedule
   */
  async updateSchedule(scheduleId: number, data: Partial<ScheduleInput>): Promise<Schedule> {
    return this.scheduleService.updateSchedule(scheduleId, data, this.userId);
  }

  /**
   * Deletes a schedule
   * @param scheduleId - The schedule ID
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to delete the schedule
   */
  async deleteSchedule(scheduleId: number): Promise<void> {
    return this.scheduleService.deleteSchedule(scheduleId, this.userId);
  }

  /**
   * Sets a schedule as the primary schedule for its owner
   * @param scheduleId - The schedule ID
   * @returns The updated schedule
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to update the schedule
   */
  async setPrimarySchedule(scheduleId: number): Promise<Schedule> {
    return this.scheduleService.setPrimarySchedule(scheduleId, this.userId);
  }
}
