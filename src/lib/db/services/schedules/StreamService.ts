import type {ActionAPIContext} from "astro:actions";
import {BaseService} from "../BaseService.ts";
import type {RepoEnv} from "../../repos/BaseRepo.ts";
import {StreamRepo} from "../../repos/schedules/StreamRepo.ts";
import {StreamTagRepo} from "../../repos/schedules/StreamTagRepo.ts";
import {StreamParticipantRepo} from "../../repos/schedules/StreamParticipantRepo.ts";
import {AuthorizationService} from "../AuthorizationService.ts";
import {ScheduleRepo} from "../../repos/schedules/ScheduleRepo.ts";
import {ScheduleValidator} from "./ScheduleValidator.ts";
import {NotFoundError, ServiceError, ValidationError} from "../../errors";
import type {DetailedStream, StreamInput, StreamParticipant, StreamParticipantDisplay} from "../../types/schedule.ts";
import {and, eq} from "drizzle-orm";
import {streamParticipantsTable} from "../../schema/jj-schema.ts";
import {streamParticipantsDisplayView} from "../../schema/views-schema.ts";
import {users} from "../../schema/auth-schema.ts";
import type {User} from "../../types/user.ts";

/**
 * Service for stream-related business logic
 */
export class StreamService extends BaseService {
  private streamRepo: StreamRepo;
  private streamTagRepo: StreamTagRepo;
  private streamParticipantRepo: StreamParticipantRepo;
  private scheduleRepo: ScheduleRepo;
  private authService: AuthorizationService;
  private validator: ScheduleValidator;

  /**
   * Creates a new StreamService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.streamRepo = new StreamRepo(env, repoEnv);
    this.streamTagRepo = new StreamTagRepo(env, repoEnv);
    this.streamParticipantRepo = new StreamParticipantRepo(env, repoEnv);
    this.scheduleRepo = new ScheduleRepo(env, repoEnv);
    this.authService = new AuthorizationService(env, repoEnv);
    this.validator = new ScheduleValidator(env, repoEnv);
  }

  /**
   * Creates a StreamService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A StreamService instance
   */
  static action(ctx: ActionAPIContext) {
    return new StreamService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Finds participants for a specific stream
   * @param scheduleId - The schedule ID
   * @param streamId - The stream ID
   * @returns An array of stream participants with display information
   */
  async findStreamParticipantUsersById(scheduleId: number, streamId: number): Promise<StreamParticipantDisplay[]> {
    return this.db.select()
      .from(streamParticipantsDisplayView)
      .where(
        and(
          eq(streamParticipantsDisplayView.scheduleId, scheduleId),
          eq(streamParticipantsDisplayView.streamId, streamId),
        )
      )
      .all();
  }

  /**
   * Finds all participants for a schedule
   * @param scheduleId - The schedule ID
   * @returns An array of stream participants with display information
   */
  async findParticipantUsersById(scheduleId: number): Promise<StreamParticipantDisplay[]> {
    return this.db.select()
      .from(streamParticipantsDisplayView)
      .where(
        and(
          eq(streamParticipantsDisplayView.scheduleId, scheduleId),
        )
      )
      .all();
  }


  /**
   * Finds participants for a specific stream
   * @param scheduleId - The schedule ID
   * @param streamId - The stream ID
   * @returns An array of users who are participants in the stream
   */
  async findStreamParticipantsById(scheduleId: number, streamId: number): Promise<StreamParticipant[]> {
    return this.db.select()
      .from(streamParticipantsTable)
      .where(
        and(
          eq(streamParticipantsTable.scheduleId, scheduleId),
          eq(streamParticipantsTable.streamId, streamId),
        )
      )
      .all();
  }

  /**
   * Finds all participants for a schedule
   * @param scheduleId - The schedule ID
   * @returns An array of users who are participants in any stream of the schedule
   */
  async findParticipantsById(scheduleId: number): Promise<StreamParticipant[]> {
    return this.db.select()
      .from(streamParticipantsTable)
      .where(
        and(
          eq(streamParticipantsTable.scheduleId, scheduleId),
        )
      )
      .all();
  }



  /**
   * Creates a stream for a schedule
   * @param scheduleId - The schedule ID
   * @param data - The stream data
   * @param userId - The user ID
   * @returns The created stream
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {ValidationError} If the input data is invalid
   * @throws {AuthorizationError} If the user doesn't have permission to update the schedule
   */
  async createStream(scheduleId: number, data: StreamInput, userId: number): Promise<DetailedStream> {
    // Authorization check
    await this.authService.ensureCanEditSchedule(userId, scheduleId);

    // Validate input
    this.validator.validateStreamInput(data);

    // Check if schedule exists
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Schedule with ID ${scheduleId} not found`);
    }

    try {
      // Get next stream ID
      const streamId = await this.streamRepo.getNextStreamId(scheduleId);

      // Create stream
      const stream = await this.streamRepo.createStream(scheduleId, streamId, data, userId);

      // Return detailed stream (with empty tags and participants)
      return {
        ...stream,
        tags: [],
        participants: []
      };
    } catch (error) {
      // Handle specific errors
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error creating stream:", error);
      throw new ServiceError("Failed to create stream", error);
    }
  }

  /**
   * Finds all streams with their details (tags and participants) for a schedule
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
        const participants = await this.findStreamParticipantUsersById(scheduleId, stream.id);

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
