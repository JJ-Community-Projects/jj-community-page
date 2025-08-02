// src/lib/db/newRepos/schedule/sections/ScheduleSection.ts
import {and, eq} from "drizzle-orm";
import {BaseSection} from "../../base/BaseSection";
import type {RepoEnv} from "../../../../db/RepoEnv";
import {schedulesTable} from "../../../schema/jj-schema";
import type {Schedule, ScheduleInsert} from "../../../types/schedule";
import {NotFoundError} from "../../../../db/errors";

/**
 * Section for schedule table operations
 */
export class ScheduleSection extends BaseSection<Schedule, ScheduleInsert> {
  /**
   * Creates a new ScheduleSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a schedule by its ID
   * @param id - The ID of the schedule to find
   * @returns The schedule or undefined if not found
   */
  async findById(id: number): Promise<Schedule | undefined> {
    try {
      return this.db.select()
        .from(schedulesTable)
        .where(eq(schedulesTable.id, id))
        .get();
    } catch (error) {
      this.handleError(`Failed to find schedule by id: ${id}`, error);
    }
  }

  /**
   * Finds all schedules
   * @returns An array of schedules
   */
  async findAll(): Promise<Schedule[]> {
    try {
      return await this.db.select()
        .from(schedulesTable)
        .all();
    } catch (error) {
      this.handleError("Failed to find all schedules", error);
    }
  }

  /**
   * Creates a new schedule
   * @param data - The data for the new schedule
   * @returns The created schedule
   */
  async create(data: ScheduleInsert): Promise<Schedule> {
    try {
      const [schedule] = await this.db.insert(schedulesTable)
        .values(data)
        .returning();
      return schedule as Schedule;
    } catch (error) {
      this.handleError("Failed to create schedule", error);
    }
  }

  /**
   * Updates a schedule
   * @param id - The ID of the schedule to update
   * @param data - The data to update
   * @returns The updated schedule
   */
  async update(id: number, data: Partial<ScheduleInsert>): Promise<Schedule> {
    try {
      const [schedule] = await this.db.update(schedulesTable)
        .set(data)
        .where(eq(schedulesTable.id, id))
        .returning();

      if (!schedule) {
        throw new NotFoundError(`Schedule with id ${id} not found`);
      }

      return schedule as Schedule;
    } catch (error) {
      this.handleError(`Failed to update schedule with id: ${id}`, error);
    }
  }

  /**
   * Deletes a schedule
   * @param id - The ID of the schedule to delete
   */
  async delete(id: number): Promise<void> {
    try {
      const result = await this.db.delete(schedulesTable)
        .where(eq(schedulesTable.id, id))
        .returning({id: schedulesTable.id});

      if (result.length === 0) {
        throw new NotFoundError(`Schedule with id ${id} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete schedule with id: ${id}`, error);
    }
  }

  /**
   * Finds a schedule by its slug
   * @param slug - The slug of the schedule to find
   * @returns The schedule or undefined if not found
   */
  async findBySlug(slug: string): Promise<Schedule | undefined> {
    try {
      return this.db.select()
        .from(schedulesTable)
        .where(eq(schedulesTable.slug, slug))
        .get();
    } catch (error) {
      this.handleError(`Failed to find schedule by slug: ${slug}`, error);
    }
  }

  /**
   * Finds schedules by owner ID
   * @param ownerId - The ID of the owner
   * @returns An array of schedules
   */
  async findByOwnerId(ownerId: number): Promise<Schedule[]> {
    try {
      return this.db.select()
        .from(schedulesTable)
        .where(eq(schedulesTable.ownerId, ownerId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find schedules by owner id: ${ownerId}`, error);
    }
  }

  /**
   * Finds visible schedules
   * @returns An array of visible schedules
   */
  async findVisible(): Promise<Schedule[]> {
    try {
      return this.db.select()
        .from(schedulesTable)
        .where(eq(schedulesTable.visible, true))
        .all();
    } catch (error) {
      this.handleError("Failed to find visible schedules", error);
    }
  }

  /**
   * Checks if a slug is available
   * @param slug - The slug to check
   * @returns True if the slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    try {
      const schedule = await this.findBySlug(slug);
      return !schedule;
    } catch (error) {
      this.handleError(`Failed to check if slug is available: ${slug}`, error);
    }
  }

  /**
   * Sets a schedule as the primary schedule for its owner
   * @param scheduleId - The ID of the schedule to set as primary
   * @returns The updated schedule
   */
  async setPrimarySchedule(scheduleId: number): Promise<Schedule> {
    try {
      // First, get the schedule to find the owner
      const schedule = await this.findById(scheduleId);
      if (!schedule) {
        throw new NotFoundError(`Schedule with id ${scheduleId} not found`);
      }

      // Reset primary flag for all schedules of this owner
      await this.db.update(schedulesTable)
        .set({primary: false})
        .where(eq(schedulesTable.ownerId, schedule.ownerId))
        .execute();

      // Set this schedule as primary
      return this.update(scheduleId, {primary: true});
    } catch (error) {
      this.handleError(`Failed to set primary schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Gets the current primary schedule for a user
   * @param userId - The ID of the user
   * @returns The primary schedule or undefined if not found
   */
  async getCurrentPrimary(userId: number): Promise<Schedule | undefined> {
    try {
      return this.db.select()
        .from(schedulesTable)
        .where(
          and(
            eq(schedulesTable.ownerId, userId),
            eq(schedulesTable.primary, true)
          )
        )
        .get();
    } catch (error) {
      this.handleError(`Failed to get current primary schedule for user: ${userId}`, error);
    }
  }
}
