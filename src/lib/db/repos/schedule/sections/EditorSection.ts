// src/lib/db/newRepos/schedule/sections/EditorSection.ts
import { and, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { BaseSection } from "../../base/BaseSection";
import { editorsTable } from "../../../schema/jj-schema";
import { NotFoundError } from "../../../../db/errors";
import type {RepoEnv} from "../../../RepoEnv";

/**
 * Type for editor entity from database schema
 */
export interface Editor {
  scheduleId: number;
  userId: number;
}

/**
 * Type for editor insert
 */
export interface EditorInsert {
  scheduleId: number;
  userId: number;
}

/**
 * Section for editor table operations
 */
export class EditorSection extends BaseSection<Editor, EditorInsert> {
  /**
   * Creates a new EditorSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds an editor by its primary key (scheduleId, userId)
   * @param scheduleId - The ID of the schedule
   * @param userId - The ID of the user
   * @returns The editor or undefined if not found
   */
  async findById(scheduleId: number, userId: number): Promise<Editor | undefined> {
    try {
      return this.db.select()
        .from(editorsTable)
        .where(and(
          eq(editorsTable.scheduleId, scheduleId),
          eq(editorsTable.userId, userId)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find editor for user: ${userId} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds all editors
   * @returns An array of editors
   */
  async findAll(): Promise<Editor[]> {
    try {
      return await this.db.select()
        .from(editorsTable)
        .all();
    } catch (error) {
      this.handleError("Failed to find all editors", error);
    }
  }

  /**
   * Creates a new editor
   * @param data - The data for the new editor
   * @returns The created editor
   */
  async create(data: EditorInsert): Promise<Editor> {
    try {
      const [editor] = await this.db.insert(editorsTable)
        .values(data)
        .returning();
      return editor as Editor;
    } catch (error) {
      this.handleError("Failed to create editor", error);
    }
  }

  /**
   * Updates an editor
   * @param scheduleId - The ID of the schedule
   * @param userId - The ID of the user
   * @param data - The data to update
   * @returns The updated editor
   */
  async update(
    scheduleId: number,
    userId: number,
    data: Partial<EditorInsert>
  ): Promise<Editor> {
    try {
      const [editor] = await this.db.update(editorsTable)
        .set(data)
        .where(and(
          eq(editorsTable.scheduleId, scheduleId),
          eq(editorsTable.userId, userId)
        ))
        .returning();

      if (!editor) {
        throw new NotFoundError(`Editor for user: ${userId} in schedule: ${scheduleId} not found`);
      }

      return editor as Editor;
    } catch (error) {
      this.handleError(`Failed to update editor for user: ${userId} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Deletes an editor
   * @param scheduleId - The ID of the schedule
   * @param userId - The ID of the user
   */
  async delete(scheduleId: number, userId: number): Promise<void> {
    try {
      const result = await this.db.delete(editorsTable)
        .where(and(
          eq(editorsTable.scheduleId, scheduleId),
          eq(editorsTable.userId, userId)
        ))
        .returning({ userId: editorsTable.userId });

      if (result.length === 0) {
        throw new NotFoundError(`Editor for user: ${userId} in schedule: ${scheduleId} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete editor for user: ${userId} in schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds editors by schedule ID
   * @param scheduleId - The ID of the schedule
   * @returns An array of editors
   */
  async findByScheduleId(scheduleId: number): Promise<Editor[]> {
    try {
      return this.db.select()
        .from(editorsTable)
        .where(eq(editorsTable.scheduleId, scheduleId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find editors for schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Finds editors by user ID
   * @param userId - The ID of the user
   * @returns An array of editors
   */
  async findByUserId(userId: number): Promise<Editor[]> {
    try {
      return this.db.select()
        .from(editorsTable)
        .where(eq(editorsTable.userId, userId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find editors for user: ${userId}`, error);
    }
  }

  /**
   * Checks if a user is an editor for a schedule
   * @param scheduleId - The ID of the schedule
   * @param userId - The ID of the user
   * @returns True if the user is an editor
   */
  async isEditor(scheduleId: number, userId: number): Promise<boolean> {
    try {
      const editor = await this.findById(scheduleId, userId);
      return !!editor;
    } catch (error) {
      this.handleError(`Failed to check if user: ${userId} is an editor for schedule: ${scheduleId}`, error);
    }
  }

  /**
   * Creates multiple editors in a batch
   * @param editors - The editors to create
   * @returns The batch operations
   */
  createBatch(editors: EditorInsert[]): BatchItem<'sqlite'>[] {
    return editors.map(editor =>
      this.db.insert(editorsTable).values(editor)
    );
  }

  /**
   * Deletes multiple editors in a batch
   * @param editors - The editors to delete with their scheduleId and userId
   * @returns The batch operations
   */
  deleteBatch(editors: Array<{ scheduleId: number, userId: number }>): BatchItem<'sqlite'>[] {
    return editors.map(({ scheduleId, userId }) =>
      this.db.delete(editorsTable)
        .where(and(
          eq(editorsTable.scheduleId, scheduleId),
          eq(editorsTable.userId, userId)
        ))
    );
  }
}
