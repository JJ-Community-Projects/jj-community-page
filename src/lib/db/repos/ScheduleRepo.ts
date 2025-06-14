import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import {Repo, type RepoEnv} from "./Repo";
import {schedulesTable, streamsTable} from "../schema/schema";
import {eq, type InferInsertModel, type InferSelectModel} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError";
import type {ActionAPIContext} from "astro:actions";
import type {BatchItem} from "drizzle-orm/batch";
import {StreamRepo} from "./StreamRepo.ts";
import {StreamTagRepo} from "./StreamTagRepo.ts";
import {StreamParticipantsRepo} from "./StreamParticipantsRepo.ts";

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
  async findById(id: number): Promise<InferSelectModel<typeof schedulesTable> | null> {
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
  async findBySlug(slug: string): Promise<InferSelectModel<typeof schedulesTable> | null> {
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
  async findByOwnerId(ownerId: number): Promise<InferSelectModel<typeof schedulesTable>[]> {
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
  async findVisible(): Promise<InferSelectModel<typeof schedulesTable>[]> {
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
  async findAll(): Promise<InferSelectModel<typeof schedulesTable>[]> {
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
  async create(data: InferInsertModel<typeof schedulesTable>): Promise<InferSelectModel<typeof schedulesTable>> {
    try {
      const [result] = await this.db.insert(this.table)
        .values(data as any)
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
  async update(id: number | string, data: any): Promise<InferSelectModel<typeof schedulesTable>> {
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
      if (this.env === 'action') {
        throw new DatabaseError(`Failed to delete record with id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to delete record with id: ${id}`, error);
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
}
