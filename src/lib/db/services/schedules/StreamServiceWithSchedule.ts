import type {ActionAPIContext} from "astro:actions";
import {BaseService} from "../BaseService.ts";
import {StreamService} from "./StreamService.ts";
import type {RepoEnv} from "../../repos/BaseRepo.ts";
import type {DetailedStream, StreamInput} from "../../types/schedule.ts";
import type {User} from "../../types/user.ts";

/**
 * Service for stream-related business logic within the context of a specific schedule
 * This service handles functionality within the context of a schedule
 */
export class StreamServiceWithSchedule extends BaseService {
  private streamService: StreamService;
  private scheduleId: number;

  /**
   * Creates a new StreamServiceWithSchedule instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param scheduleId - The schedule ID
   */
  constructor(env: Env, repoEnv: RepoEnv, scheduleId: number) {
    super(env, repoEnv);
    this.streamService = new StreamService(env, repoEnv);
    this.scheduleId = scheduleId;
  }

  /**
   * Creates a StreamServiceWithSchedule instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param scheduleId - The schedule ID
   * @returns A StreamServiceWithSchedule instance
   */
  static action(ctx: ActionAPIContext, scheduleId: number) {
    return new StreamServiceWithSchedule(ctx.locals.runtime.env, 'action', scheduleId);
  }

  /**
   * Finds participants for a specific stream
   * @param streamId - The stream ID
   * @returns An array of users who are participants in the stream
   */
  async findStreamParticipantsById(streamId: number): Promise<User[]> {
    return this.streamService.findStreamParticipantUsersById(this.scheduleId, streamId);
  }

  /**
   * Finds all participants for this schedule
   * @returns An array of users who are participants in any stream of the schedule
   */
  async findParticipants(): Promise<User[]> {
    return this.streamService.findParticipantUsersById(this.scheduleId);
  }

  /**
   * Creates a stream for this schedule
   * @param data - The stream data
   * @param userId - The user ID
   * @returns The created stream
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {ValidationError} If the input data is invalid
   * @throws {AuthorizationError} If the user doesn't have permission to update the schedule
   */
  async createStream(data: StreamInput, userId: number): Promise<DetailedStream> {
    return this.streamService.createStream(this.scheduleId, data, userId);
  }
}
