import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import {Repo, type RepoEnv} from "./Repo";
import {schedulesTable, streamsTable} from "../schema/schema";
import {and, eq, type InferInsertModel, not} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError";
import type {ActionAPIContext} from "astro:actions";
import type {BatchItem} from "drizzle-orm/batch";
import {StreamRepo} from "./StreamRepo.ts";
import {StreamTagRepo} from "./StreamTagRepo.ts";
import {StreamParticipantsRepo} from "./StreamParticipantsRepo.ts";
import {accounts, users} from "../schema/auth-schema";
import type {Schedule, ScheduleWithDetailedStreams, ScheduleWithStreams} from "../models/schedule-base.ts";
import {TeamRepo} from "./TeamRepo.ts";


/**
 * Repository for working with schedules
 */
export class ScheduleRepo extends Repo<typeof schedulesTable._['config']> {
  constructor(db: DrizzleD1Database, env: RepoEnv) {
    super(db, schedulesTable, env);
  }

  static action(ctx: ActionAPIContext) {
    return new ScheduleRepo(drizzle(ctx.locals.runtime.env.DB), 'action')
  }

  /**
   * Find a record by its primary key
   * @param id The primary key value
   * @returns Promise resolving to the record or null if not found
   *
   * SQL: `SELECT * FROM "schedules" WHERE "schedules"."id" = ?`
   */
  async findById(id: number): Promise<Schedule | null> {
    try {
      const result = await this.db.select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .get();

      return result || null;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find record by id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find record by id: ${id}`, error);
      }
    }
  }

  /**
   * Find a schedule by its slug
   * @param slug The schedule slug
   * @returns Promise resolving to the schedule or null if not found
   *
   * SQL: `SELECT * FROM "schedules" WHERE "schedules"."slug" = ?`
   */
  async findBySlug(slug: string): Promise<Schedule | null> {
    try {
      const result = await this.db.select()
        .from(this.table)
        .where(eq(this.table.slug, slug))
        .get();

      return result || null;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find schedule by slug: ${slug}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find schedule by slug: ${slug}`, error);
      }
    }
  }

  /**
   * Find schedules by owner ID
   * @param ownerId The owner ID
   * @returns Promise resolving to an array of schedules
   *
   * SQL: `SELECT * FROM "schedules" WHERE "schedules"."ownerId" = ?`
   */
  async findByOwnerId(ownerId: number): Promise<Schedule[]> {
    try {
      return await this.db.select()
        .from(this.table)
        .where(eq(this.table.ownerId, ownerId))
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find schedules by owner ID: ${ownerId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find schedules by owner ID: ${ownerId}`, error);
      }
    }
  }

  /**
   * Find visible schedules
   * @returns Promise resolving to an array of visible schedules
   *
   * SQL: `SELECT * FROM "schedules" WHERE "schedules"."visible" = ?`
   */
  async findVisible(): Promise<Schedule[]> {
    try {
      return await this.db.select()
        .from(this.table)
        .where(eq(this.table.visible, true))
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to find visible schedules", error).toActionError();
      } else {
        throw new DatabaseError("Failed to find visible schedules", error);
      }
    }
  }

  /**
   * Find all records in the table
   * @returns Promise resolving to an array of records
   *
   * SQL: `SELECT * FROM "schedules"`
   */
  async findAll(): Promise<Schedule[]> {
    try {
      return await this.db.select()
        .from(this.table)
        .all();
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to find all records", error).toActionError();
      } else {
        throw new DatabaseError("Failed to find all records", error);
      }
    }
  }

  /**
   * Create a new record
   * @param data The data to insert
   * @returns Promise resolving to the created record
   *
   * SQL: `INSERT INTO "schedules" (...) VALUES (...) RETURNING *`
   */
  async create(data: InferInsertModel<typeof schedulesTable>): Promise<Schedule> {
    try {
      const [result] = await this.db.insert(this.table)
        .values(data)
        .returning();

      return result;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to create record", error).toActionError();
      } else {
        throw new DatabaseError("Failed to create record", error);
      }
    }
  }

  /**
   * Update a record by its primary key
   * @param id The primary key value
   * @param data The data to update
   * @returns Promise resolving to the updated record
   *
   * SQL: `UPDATE "schedules" SET ... WHERE "schedules"."id" = ? RETURNING *`
   */
  async update(id: number | string, data: any): Promise<Schedule> {
    try {
      // Assuming the primary key column is named 'id'
      const primaryKeyColumn = this.table.id as any;

      const [result] = await this.db.update(this.table)
        .set(data as any)
        .where(eq(primaryKeyColumn, id))
        .returning();

      return result;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to update record with id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to update record with id: ${id}`, error);
      }
    }
  }

  /**
   * Delete a record by its primary key
   * @param id The primary key value
   * @returns Promise resolving to a boolean indicating if the record was deleted
   *
   * SQL: `DELETE FROM "schedules" WHERE "schedules"."id" = ?`
   */
  async delete(id: number | string): Promise<boolean> {
    try {
      // Assuming the primary key column is named 'id'
      const primaryKeyColumn = this.table.id as any;

      const result = await this.db.delete(this.table)
        .where(eq(primaryKeyColumn, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.log('ScheduleRepo', 'delete', error)
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to delete record with id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to delete record with id: ${id}`, error);
      }
    }
  }

  /**
   * Set the visibility of a schedule
   * @param id The schedule ID
   * @param visible The visibility value to set
   * @returns Promise resolving to the updated schedule
   *
   * SQL: `UPDATE "schedules" SET "visible" = ? WHERE "schedules"."id" = ? RETURNING *`
   */
  async setVisibility(id: number, visible: boolean): Promise<Schedule> {
    try {
      const [result] = await this.db.update(this.table)
        .set({visible})
        .where(eq(this.table.id, id))
        .returning();

      return result;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to set visibility for schedule with id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to set visibility for schedule with id: ${id}`, error);
      }
    }
  }


  /**
   * Updates a schedule with all related streams, participants, and tags in a single batch operation
   *
   * This function handles multiple database operations in a single atomic batch:
   * - Creating new streams
   * - Updating existing streams
   * - Deleting streams
   * - Adding participants to streams
   * - Removing participants from streams
   * - Adding tags to streams
   * - Removing tags from streams
   *
   * Using a batch operation ensures that all changes are applied together or not at all,
   * maintaining database consistency.
   *
   * @param scheduleId - The schedule id
   * @param data Object containing all the changes to apply:
   *   - streams: Object containing streams to create, update, and delete
   *   - participants: Object containing participants to add and remove
   *   - tags: Object containing tags to add and remove
   * @returns Promise resolving when the operation is complete
   */
  async updateSchedule(
    scheduleId: number,
    data: {
      streams?: {
        creates?: InferInsertModel<typeof streamsTable>[],
        updates?: Array<{ id: number } & Partial<InferInsertModel<typeof streamsTable>>>,
        deletes?: number[],
      }
      participants?: {
        creates?: Array<{ streamId: number, userId: number }>;
        deletes?: Array<{ streamId: number, userId: number }>;
      },
      tags?: {
        creates?: Array<{ streamId: number, tag: string, label: string }>;
        deletes?: Array<{ streamId: number, tag: string }>;
      }
    }
  ): Promise<void> {
    try {
      const streamRepo = new StreamRepo(this.db, this.env);
      const tagRepo = new StreamTagRepo(this.db, this.env);
      const participantRepo = new StreamParticipantsRepo(this.db, this.env);

      // Collect operations from each repository
      const operations: BatchItem<'sqlite'>[] = [
        ...streamRepo.getStreamOperations(scheduleId, data.streams),
        ...tagRepo.getStreamTagsOperations(scheduleId, data.tags),
        ...participantRepo.getStreamParticipantsOperations(scheduleId, data.participants)
      ];
      // Execute all operations in a single batch
      await this.executeBatch(operations);
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError("Failed to update schedule", error).toActionError();
      } else {
        throw new DatabaseError("Failed to update schedule", error);
      }
    }
  }


  /**
   * Find the schedule with the stream that has the earliest start time within the current year for a given user
   * and return all streams of that schedule in order of start time
   *
   * This function performs the following operations:
   * 1. Finds the schedule with the earliest stream in the current year
   * 2. Retrieves all streams for that schedule
   * 3. Orders the streams by start time
   * 4. Returns both the schedule and its streams
   *
   * The function is optimized to reduce database reads by:
   * - Using efficient queries with joins
   * - Filtering data at the database level rather than in application code
   * - Using appropriate indexes for efficient filtering and sorting
   *
   * @param userId - The ID of the user to find schedules for
   * @returns Promise resolving to an object containing the schedule and its streams, or null if none found
   */
  async findNextSchedule(
    userId: number,
  ): Promise<ScheduleWithStreams | null> {
    try {
      // Get the current year for filtering
      const currentYear = new Date().getFullYear();

      // First, find the schedule with the earliest stream
      const scheduleResult = await this.db.select({
        schedule: schedulesTable
      })
        .from(schedulesTable)
        .innerJoin(streamsTable, eq(schedulesTable.id, streamsTable.scheduleId))
        .where(
          and(
            eq(schedulesTable.ownerId, userId),
            eq(schedulesTable.year, currentYear),
            eq(streamsTable.visible, true)
          )
        )
        .orderBy(streamsTable.start)
        .limit(1)
        .get();

      // If no schedule found, return null
      if (!scheduleResult) {
        return null;
      }

      // Get all streams for this schedule, ordered by start time
      const streams = await this.db.select()
        .from(streamsTable)
        .where(
          and(
            eq(streamsTable.scheduleId, scheduleResult.schedule.id),
            eq(streamsTable.visible, true)
          )
        )
        .orderBy(streamsTable.start)
        .all();

      // Return both the schedule and its streams
      return {
        schedule: scheduleResult.schedule,
        streams: streams
      };
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find next schedule for user: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find next schedule for user: ${userId}`, error);
      }
    }
  }

  /**
   * Find schedules owned by a user with a given tiltify username
   *
   * This function performs the following operations in a single database query:
   * 1. Joins the accounts, users, and schedules tables
   * 2. Filters by tiltify username and provider
   * 3. Returns all schedules owned by that user
   *
   * @param tiltifyUsername - The tiltify username to find schedules for
   * @returns Promise resolving to an array of schedules owned by the user with the given tiltify username
   */
  async findSchedulesByTiltifyUsername(
    tiltifyUsername: string
  ): Promise<Schedule[]> {
    try {
      // Import the and function for combining conditions

      // Find all schedules for the user with the given tiltify username using a join query
      const schedules = await this.db.select({
        schedule: schedulesTable
      })
        .from(schedulesTable)
        .innerJoin(users, eq(schedulesTable.ownerId, users.id))
        .innerJoin(accounts, eq(users.id, accounts.userId))
        .where(
          and(
            eq(accounts.provider, 'tiltify'),
            eq(accounts.providerUsername, tiltifyUsername),
            eq(schedulesTable.visible, true)
          )
        )
        .all();

      // If no schedules found, return empty array
      if (!schedules || schedules.length === 0) {
        return [];
      }

      // Extract and return the schedules
      return schedules.map(result => result.schedule);
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find schedules for tiltify username: ${tiltifyUsername}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find schedules for tiltify username: ${tiltifyUsername}`, error);
      }
    }
  }

  /**
   * Find the next schedule for a user with a given tiltify username
   *
   * This function performs the following operations in a single database query:
   * 1. Joins the accounts, users, schedules, and streams tables
   * 2. Filters by tiltify username, provider, and current year
   * 3. Gets the schedule with the earliest stream
   * 4. Then gets all visible streams for that schedule
   *
   * @param tiltifyUsername - The tiltify username to find the next schedule for
   * @returns Promise resolving to an object containing the schedule and its streams, or null if none found
   */
  async findNextScheduleByTiltifyUsername(
    tiltifyUsername: string
  ): Promise<ScheduleWithStreams | null> {
    try {
      // Get the current year for filtering
      const currentYear = new Date().getFullYear();

      // Find the schedule with the earliest stream using a join query
      const scheduleResult = await this.db.select({
        schedule: schedulesTable
      })
        .from(schedulesTable)
        .innerJoin(users, eq(schedulesTable.ownerId, users.id))
        .innerJoin(accounts, eq(users.id, accounts.userId))
        .innerJoin(streamsTable, eq(schedulesTable.id, streamsTable.scheduleId))
        .where(
          and(
            eq(accounts.provider, 'tiltify'),
            eq(accounts.providerUsername, tiltifyUsername),
            eq(schedulesTable.year, currentYear),
            eq(streamsTable.visible, true)
          )
        )
        .orderBy(streamsTable.start)
        .limit(1)
        .get();

      // If no schedule found, return null
      if (!scheduleResult) {
        return null;
      }

      // Get all streams for this schedule, ordered by start time
      const streams = await this.db.select()
        .from(streamsTable)
        .where(
          and(
            eq(streamsTable.scheduleId, scheduleResult.schedule.id),
            eq(streamsTable.visible, true)
          )
        )
        .orderBy(streamsTable.start)
        .all();

      // Return both the schedule and its streams
      return {
        schedule: scheduleResult.schedule,
        streams: streams
      };
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find next schedule for tiltify username: ${tiltifyUsername}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find next schedule for tiltify username: ${tiltifyUsername}`, error);
      }
    }
  }

  /**
   * Find the next schedule for a user with a given tiltify username, including full details
   *
   * This function is similar to findNextScheduleByTiltifyUsername but also fetches
   * the tags and participants for each stream. The returned streams array contains
   * stream objects with two additional keys: tags and participants.
   *
   * @param tiltifyUsername - The tiltify username to find the next schedule for
   * @returns Promise resolving to an object containing the schedule and its streams with full details, or null if none found
   */
  async findNextScheduleByTiltifyUsernameWithFullDetails(
    tiltifyUsername: string
  ): Promise<ScheduleWithDetailedStreams | null> {
    try {
      // First, get the basic schedule and streams using the existing method
      const basicResult = await this.findNextScheduleByTiltifyUsername(tiltifyUsername);

      // If no schedule found, return null
      if (!basicResult) {
        return null;
      }

      // Create instances of the repos we need
      const tagRepo = new StreamTagRepo(this.db, this.env);
      const participantRepo = new StreamParticipantsRepo(this.db, this.env);

      // Get the schedule ID
      const scheduleId = basicResult.schedule.id;

      // Fetch all tags and participants for all streams in the schedule at once
      const tagsByStreamId = await tagRepo.findTagsUIGroupedByStream(scheduleId);
      const participantsByStreamId = await participantRepo.findParticipantsUIByStream(scheduleId);

      // Enhance each stream with its tags and participants
      const enhancedStreams = basicResult.streams.map(stream => {
        return {
          ...stream,
          tags: tagsByStreamId[stream.id] || [],
          participants: participantsByStreamId[stream.id] || []
        };
      });

      // Return the schedule and enhanced streams
      return {
        schedule: basicResult.schedule,
        streams: enhancedStreams
      };
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find next schedule with full details for tiltify username: ${tiltifyUsername}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find next schedule with full details for tiltify username: ${tiltifyUsername}`, error);
      }
    }
  }


  /**
   * Find a schedule by its slug, including full details
   *
   * This function is similar to findBySlug but also fetches
   * the tags and participants for each stream. The returned streams array contains
   * stream objects with two additional keys: tags and participants.
   *
   * @param slug - The slug of the schedule to find
   * @returns Promise resolving to an object containing the schedule and its streams with full details, or null if none found
   */
  async getScheduleBySlug(
    slug: string
  ): Promise<ScheduleWithDetailedStreams | null> {
    try {
      // First, get the basic schedule using the existing method
      const schedule = await this.findBySlug(slug);
      console.log('getScheduleBySlug', 'schedule', schedule);
      // If no schedule found, return null
      if (!schedule) {
        return null;
      }

      // Get all streams for this schedule, ordered by start time
      const streams = await this.db.select()
        .from(streamsTable)
        .where(
          and(
            eq(streamsTable.scheduleId, schedule.id),
            eq(streamsTable.visible, true)
          )
        )
        .orderBy(streamsTable.start)
        .all();
      console.log(streams)

      // Create instances of the repos we need
      const tagRepo = new StreamTagRepo(this.db, this.env);
      const participantRepo = new StreamParticipantsRepo(this.db, this.env);

      // Fetch all tags and participants for all streams in the schedule at once
      const tagsByStreamId = await tagRepo.findTagsUIGroupedByStream(schedule.id);
      const participantsByStreamId = await participantRepo.findParticipantsUIByStream(schedule.id);

      // Enhance each stream with its tags and participants
      const enhancedStreams = streams.map(stream => {
        return {
          ...stream,
          tags: tagsByStreamId[stream.id] || [],
          participants: participantsByStreamId[stream.id] || []
        };
      });

      // Return the schedule and enhanced streams
      return {
        schedule: schedule,
        streams: enhancedStreams
      };
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find schedule with full details by slug: ${slug}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find schedule with full details by slug: ${slug}`, error);
      }
    }
  }

  /**
   * Set a schedule as primary and all other schedules with the same year as non-primary
   *
   * This function performs the following operations:
   * 1. Finds the schedule by ID to get its year
   * 2. Updates that schedule to set primary=true
   * 3. Updates all other schedules with the same year and owner to set primary=false
   *
   * @param scheduleId - The ID of the schedule to set as primary
   * @returns Promise resolving to the updated primary schedule
   */
  async setPrimarySchedule(scheduleId: number): Promise<Schedule> {
    try {
      // First, get the schedule to find its year and owner
      const schedule = await this.findById(scheduleId);

      if (!schedule) {
        throw new Error(`Schedule with ID ${scheduleId} not found`);
      }

      // Create a batch of operations
      const operations: BatchItem<'sqlite'>[] = [
        // 1. Set the target schedule as primary
        this.db.update(this.table)
          .set({primary: true})
          .where(eq(this.table.id, scheduleId)),

        // 2. Set all other schedules with the same year and owner as non-primary
        this.db.update(this.table)
          .set({primary: false})
          .where(
            and(
              eq(this.table.year, schedule.year),
              eq(this.table.ownerId, schedule.ownerId),
              not(eq(this.table.id, scheduleId))
            )
          )
      ];

      // Execute the batch
      await this.executeBatch(operations);

      // Return the updated schedule
      return await this.findById(scheduleId) as Schedule;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to set schedule ${scheduleId} as primary`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to set schedule ${scheduleId} as primary`, error);
      }
    }
  }

  /**
   * Get the current primary schedule of a user
   * @param userId The user ID
   * @returns Promise resolving to the primary schedule or null if not found
   *
   * SQL: `SELECT * FROM "schedules" WHERE "schedules"."owner_id" = ? AND "schedules"."primary" = true` AND "schedules"."year" = ?
   */
  async getCurrentPrimary(userId: number): Promise<Schedule | null> {
    try {
      const currentYear = new Date().getFullYear();
      const result = await this.db.select()
        .from(this.table)
        .where(and(
          eq(this.table.ownerId, userId),
          eq(this.table.primary, true),
          eq(this.table.year, currentYear)
        ))
        .get();

      return result || null;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find primary schedule for user: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find primary schedule for user: ${userId}`, error);
      }
    }
  }

  /**
   * Get the current primary schedule by its slug
   * @param slug The schedule slug
   * @returns Promise resolving to the primary schedule or null if not found
   *
   * SQL: `SELECT * FROM "schedules" WHERE "schedules"."slug" = ? AND "schedules"."primary" = true AND "schedules"."year" = ?
   */
  async getCurrentPrimaryBySlug(slug: string): Promise<Schedule | null> {
    try {
      const currentYear = new Date().getFullYear();
      const result = await this.db.select()
        .from(this.table)
        .where(and(
          eq(this.table.slug, slug),
          eq(this.table.primary, true),
          eq(this.table.year, currentYear)
        ))
        .get();

      return result || null;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find primary schedule by slug: ${slug}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find primary schedule by slug: ${slug}`, error);
      }
    }
  }


  /**
   * Get the current primary schedule of a user with a given tiltify username
   * @param tiltifyUsername The tiltify username
   * @returns Promise resolving to the primary schedule or null if not found
   */
  async getCurrentPrimaryByTiltifyUsername(tiltifyUsername: string): Promise<Schedule | null> {
    try {
      // Get the current year for filtering
      const currentYear = new Date().getFullYear();

      // Find the primary schedule using a join query
      const scheduleResult = await this.db.select({
        schedule: schedulesTable
      })
        .from(schedulesTable)
        .innerJoin(users, eq(schedulesTable.ownerId, users.id))
        .innerJoin(accounts, eq(users.id, accounts.userId))
        .where(
          and(
            eq(accounts.provider, 'tiltify'),
            eq(accounts.providerUsername, tiltifyUsername),
            eq(schedulesTable.year, currentYear),
            eq(schedulesTable.primary, true)
          )
        )
        .get();

      // If no schedule found, return null
      if (!scheduleResult) {
        return null;
      }

      return scheduleResult.schedule;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to find primary schedule for tiltify username: ${tiltifyUsername}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find primary schedule for tiltify username: ${tiltifyUsername}`, error);
      }
    }
  }

  /**
   * Get all visible, primary schedules for the current year from all members of a team
   * @param teamId The team ID
   * @returns Promise resolving to an array of schedules or null if an error occurs
   */
  async getTeamMembersSchedules(teamId: number): Promise<Schedule[] | null> {
    try {
      // Get the current year for filtering
      const currentYear = new Date().getFullYear();

      // Get all team members
      const teamRepo = new TeamRepo(this.db, this.env);
      const teamMembers = await teamRepo.getTeamMembers(teamId);

      if (!teamMembers || teamMembers.length === 0) {
        return [];
      }

      // Get all user IDs from team members
      const userIds = teamMembers.map(member => member.userId);

      // Query all visible, primary schedules for the current year for all team members
      const schedules = await this.db.select()
        .from(this.table)
        .where(
          and(
            eq(this.table.visible, true),
            eq(this.table.primary, true),
            eq(this.table.year, currentYear)
          )
        )
        .all();

      // Filter schedules to only include those owned by team members
      return schedules.filter(schedule => userIds.includes(schedule.ownerId));
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to get team members schedules for team: ${teamId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get team members schedules for team: ${teamId}`, error);
      }
    }
  }

  /**
   * Get all visible, primary schedules with their streams for the current year from all members of a team
   * @param teamId The team ID
   * @returns Promise resolving to an array of schedules with streams or null if an error occurs
   */
  async getTeamMembersSchedulesWithDetails(teamId: number): Promise<ScheduleWithStreams[] | null> {
    try {
      // First get all the schedules
      const schedules = await this.getTeamMembersSchedules(teamId);

      if (!schedules || schedules.length === 0) {
        return [];
      }

      // For each schedule, get its streams and create a ScheduleWithStreams object
      const schedulesWithStreams: ScheduleWithStreams[] = [];

      for (const schedule of schedules) {
        // Get all visible streams for this schedule, ordered by start time
        const streams = await this.db.select()
          .from(streamsTable)
          .where(
            and(
              eq(streamsTable.scheduleId, schedule.id),
              eq(this.table.primary, true),
              eq(streamsTable.visible, true)
            )
          )
          .orderBy(streamsTable.start)
          .all();

        // Add to the result array
        schedulesWithStreams.push({
          schedule,
          streams
        });
      }

      return schedulesWithStreams;
    } catch (error) {
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to get team members schedules with details for team: ${teamId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get team members schedules with details for team: ${teamId}`, error);
      }
    }
  }

}
