import type {ActionAPIContext} from "astro:actions";
import {BaseService} from "../BaseService.ts";
import type {RepoEnv} from "../../repos/BaseRepo.ts";
import {ValidationError} from "../../errors";
import type {ScheduleInput, StreamInput} from "../../types/schedule.ts";

/**
 * Service for validating schedule and stream data
 */
export class ScheduleValidator extends BaseService {
  /**
   * Creates a new ScheduleValidator instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Creates a ScheduleValidator instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A ScheduleValidator instance
   */
  static action(ctx: ActionAPIContext) {
    return new ScheduleValidator(ctx.locals.runtime.env, 'action');
  }

  /**
   * Validates schedule input data
   * @param data - The schedule data to validate
   * @throws {ValidationError} If the input data is invalid
   */
  validateScheduleInput(data: ScheduleInput): void {
    if (!data.title || data.title.trim() === '') {
      throw new ValidationError("Schedule title is required");
    }

    if (!this.isValidSlug(data.slug)) {
      throw new ValidationError("Slug can only contain lowercase letters, numbers, and hyphens");
    }

    if (!data.year || data.year < 2000 || data.year > 2100) {
      throw new ValidationError("Year must be between 2000 and 2100");
    }
  }

  /**
   * Validates stream input data
   * @param data - The stream data to validate
   * @throws {ValidationError} If the input data is invalid
   */
  validateStreamInput(data: StreamInput): void {
    if (!data.title || data.title.trim() === '') {
      throw new ValidationError("Stream title is required");
    }

    if (!data.start) {
      throw new ValidationError("Stream start time is required");
    }

    if (!data.end) {
      throw new ValidationError("Stream end time is required");
    }

    const start = new Date(data.start);
    const end = new Date(data.end);

    if (isNaN(start.getTime())) {
      throw new ValidationError("Invalid start time");
    }

    if (isNaN(end.getTime())) {
      throw new ValidationError("Invalid end time");
    }

    if (end <= start) {
      throw new ValidationError("End time must be after start time");
    }
  }

  /**
   * Checks if a slug is valid
   * @param slug - The slug to check
   * @returns True if the slug is valid, false otherwise
   */
  isValidSlug(slug: string): boolean {
    return Boolean(slug && /^[a-z0-9-]+$/.test(slug));
  }
}
