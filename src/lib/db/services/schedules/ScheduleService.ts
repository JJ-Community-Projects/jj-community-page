import type {ActionAPIContext} from "astro:actions";
import {ScheduleRepo} from "../../repos/schedules/ScheduleRepo.ts";
import {StreamRepo} from "../../repos/schedules/StreamRepo.ts";
import {StreamTagRepo} from "../../repos/schedules/StreamTagRepo.ts";
import {StreamParticipantRepo} from "../../repos/schedules/StreamParticipantRepo.ts";
import {AuthorizationService} from "../AuthorizationService.ts";
import {UserRepo} from "../../repos/users/UserRepo.ts";
import {NotFoundError, ServiceError, ValidationError} from "../../errors";
import type {
  DetailedStream,
  Schedule,
  ScheduleInput,
  ScheduleUpdateInput,
  ScheduleWithDetailedStreams,
  ScheduleWithStreams,
  StreamInput
} from "../../types/schedule.ts";
import type {RepoEnv} from "../../repos/BaseRepo.ts";
import {BaseService} from "../BaseService.ts";
import {ScheduleValidator} from "./ScheduleValidator.ts";
import {StreamService} from "./StreamService.ts";

/**
 * Service for schedule-related business logic
 */
export class ScheduleService extends BaseService {
  private scheduleRepo: ScheduleRepo;
  private streamRepo: StreamRepo;
  private streamTagRepo: StreamTagRepo;
  private streamParticipantRepo: StreamParticipantRepo;
  private authService: AuthorizationService;
  private userRepo: UserRepo;
  private validator: ScheduleValidator;
  private streamService: StreamService;

  /**
   * Creates a new ScheduleService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.scheduleRepo = new ScheduleRepo(env, repoEnv);
    this.streamRepo = new StreamRepo(env, repoEnv);
    this.streamTagRepo = new StreamTagRepo(env, repoEnv);
    this.streamParticipantRepo = new StreamParticipantRepo(env, repoEnv);
    this.authService = new AuthorizationService(env, repoEnv);
    this.userRepo = new UserRepo(env, repoEnv);
    this.validator = new ScheduleValidator(env, repoEnv);
    this.streamService = new StreamService(env, repoEnv);
  }

  /**
   * Creates a ScheduleService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A ScheduleService instance
   */
  static action(ctx: ActionAPIContext) {
    return new ScheduleService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Gets a schedule by ID with authorization check
   * @param scheduleId - The schedule ID
   * @param userId - The user ID
   * @returns The schedule
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the schedule
   */
  async getScheduleById(scheduleId: number, userId: number): Promise<Schedule> {
    // Authorization check
    await this.authService.ensureCanViewSchedule(userId, scheduleId);

    // Get schedule
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Schedule with ID ${scheduleId} not found`);
    }

    return schedule;
  }

  /**
   * Gets a schedule by slug with authorization check
   * @param slug - The schedule slug
   * @param userId - The user ID
   * @returns The schedule
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the schedule
   */
  async getScheduleBySlug(slug: string, userId: number): Promise<Schedule> {
    // Get schedule
    const schedule = await this.scheduleRepo.findBySlug(slug);
    if (!schedule) {
      throw new NotFoundError(`Schedule with slug "${slug}" not found`);
    }

    // Authorization check
    await this.authService.ensureCanViewSchedule(userId, schedule.id);

    return schedule;
  }

  /**
   * Gets a schedule with its streams
   * @param scheduleId - The schedule ID
   * @param userId - The user ID
   * @returns The schedule with streams
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the schedule
   */
  async getScheduleWithStreams(scheduleId: number, userId: number): Promise<ScheduleWithStreams> {
    // Authorization check
    await this.authService.ensureCanViewSchedule(userId, scheduleId);

    // Get schedule
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Schedule with ID ${scheduleId} not found`);
    }

    // Get streams
    const streams = await this.streamRepo.findByScheduleId(scheduleId);

    return {
      ...schedule,
      streams
    };
  }


  /**
   * Gets a schedule with detailed streams (including tags and participants)
   * @param scheduleId - The schedule ID
   * @param userId - The user ID
   * @returns The schedule with detailed streams
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the schedule
   */
  async getScheduleWithDetailedStreams(scheduleId: number, userId: number): Promise<ScheduleWithDetailedStreams> {
    // Authorization check
    await this.authService.ensureCanViewSchedule(userId, scheduleId);

    // Get schedule
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Schedule with ID ${scheduleId} not found`);
    }

    // Get streams
    const streams = await this.streamRepo.findByScheduleId(scheduleId);

    // Get detailed information for each stream
    const detailedStreams: DetailedStream[] = await Promise.all(
      streams.map(async (stream) => {
        const tags = await this.streamTagRepo.findByStreamId(scheduleId, stream.id);

        // Get participant user details
        const participants = await this.streamService.findStreamParticipantUsersById(scheduleId, stream.id)

        return {
          ...stream,
          tags,
          participants: participants.filter(Boolean) // Filter out null values
        };
      })
    );

    return {
      ...schedule,
      streams: detailedStreams
    };
  }

  /**
   * Creates a new schedule
   * @param data - The schedule data
   * @param userId - The user ID
   * @returns The created schedule
   * @throws {ValidationError} If the input data is invalid
   * @throws {AuthorizationError} If the user doesn't have permission to create a schedule
   */
  async createSchedule(data: ScheduleInput, userId: number): Promise<Schedule> {
    // Authorization check
    await this.authService.ensureCanCreateSchedule(userId);

    // Validate input
    this.validator.validateScheduleInput(data);

    // Check for duplicate slug
    const existing = await this.scheduleRepo.findBySlug(data.slug);
    if (existing) {
      throw new ValidationError(`Schedule with slug "${data.slug}" already exists`);
    }

    // Create schedule
    return this.scheduleRepo.create(data);
  }

  /**
   * Updates a schedule
   * @param scheduleId - The schedule ID
   * @param data - The schedule data
   * @param userId - The user ID
   * @returns The updated schedule
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {ValidationError} If the input data is invalid
   * @throws {AuthorizationError} If the user doesn't have permission to update the schedule
   */
  async updateSchedule(scheduleId: number, data: Partial<ScheduleInput>, userId: number): Promise<Schedule> {
    // Authorization check
    await this.authService.ensureCanEditSchedule(userId, scheduleId);

    // Get existing schedule
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Schedule with ID ${scheduleId} not found`);
    }

    // Validate slug if changing
    if (data.slug && data.slug !== schedule.slug) {
      if (!this.validator.isValidSlug(data.slug)) {
        throw new ValidationError("Slug can only contain lowercase letters, numbers, and hyphens");
      }

      const existing = await this.scheduleRepo.findBySlug(data.slug);
      if (existing && existing.id !== scheduleId) {
        throw new ValidationError(`Schedule with slug "${data.slug}" already exists`);
      }
    }

    // Update schedule
    return await this.scheduleRepo.update(scheduleId, data);
  }

  /**
   * Deletes a schedule
   * @param scheduleId - The schedule ID
   * @param userId - The user ID
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to delete the schedule
   */
  async deleteSchedule(scheduleId: number, userId: number): Promise<void> {
    // Authorization check
    await this.authService.ensureCanDeleteSchedule(userId, scheduleId);

    // Check if schedule exists
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Schedule with ID ${scheduleId} not found`);
    }

    // Delete schedule
    await this.scheduleRepo.delete(scheduleId);
  }

  /**
   * Sets a schedule as the primary schedule for its owner
   * @param scheduleId - The schedule ID
   * @param userId - The user ID
   * @returns The updated schedule
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to update the schedule
   */
  async setPrimarySchedule(scheduleId: number, userId: number): Promise<Schedule> {
    // Authorization check
    await this.authService.ensureCanEditSchedule(userId, scheduleId);

    // Check if schedule exists
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Schedule with ID ${scheduleId} not found`);
    }

    // Set as primary
    return await this.scheduleRepo.setPrimarySchedule(scheduleId);
  }

  /**
   * Finds all streams with their details (tags and participants) for a schedule
   * This method is similar to getScheduleWithDetailedStreams but doesn't perform authorization checks
   * @param scheduleId - The schedule ID
   * @returns An array of detailed streams
   */
  async findStreamsWithDetails(scheduleId: number): Promise<DetailedStream[]> {
    // Get streams
    const streams = await this.streamRepo.findByScheduleId(scheduleId);

    // Get detailed information for each stream
    const detailedStreams: DetailedStream[] = await Promise.all(
      streams.map(async (stream) => {
        const tags = await this.streamTagRepo.findByStreamId(scheduleId, stream.id);

        // Get participant user details
        const participants = await this.streamService.findStreamParticipantUsersById(scheduleId, stream.id);

        return {
          ...stream,
          tags,
          participants: participants.filter(Boolean) // Filter out null values
        };
      })
    );

    return detailedStreams;
  }
}
