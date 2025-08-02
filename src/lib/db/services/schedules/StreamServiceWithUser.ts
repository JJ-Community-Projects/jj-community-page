import type {ActionAPIContext} from "astro:actions";
import {BaseService} from "../BaseService.ts";
import {StreamService} from "./StreamService.ts";
import type {RepoEnv} from "../../repos/BaseRepo.ts";
import type {DetailedStream, StreamInput} from "../../types/schedule.ts";

/**
 * Service for stream-related business logic within the context of a specific user
 * This service handles functionality within the context of a user
 */
export class StreamServiceWithUser extends BaseService {
  private streamService: StreamService;
  private userId: number;

  /**
   * Creates a new StreamServiceWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The user ID
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv);
    this.streamService = new StreamService(env, repoEnv);
    this.userId = userId;
  }

  /**
   * Creates a StreamServiceWithUser instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param userId - The user ID
   * @returns A StreamServiceWithUser instance
   */
  static action(ctx: ActionAPIContext, userId: number) {
    return new StreamServiceWithUser(ctx.locals.runtime.env, 'action', userId);
  }

  /**
   * Creates a stream for a schedule
   * @param scheduleId - The schedule ID
   * @param data - The stream data
   * @returns The created stream
   * @throws {NotFoundError} If the schedule doesn't exist
   * @throws {ValidationError} If the input data is invalid
   * @throws {AuthorizationError} If the user doesn't have permission to update the schedule
   */
  async createStream(scheduleId: number, data: StreamInput): Promise<DetailedStream> {
    return this.streamService.createStream(scheduleId, data, this.userId);
  }
}
