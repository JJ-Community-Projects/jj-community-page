// src/lib/db/newRepos/base/BaseSection.ts
/// <reference path="../../../../../worker-configuration.d.ts" />
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { DatabaseError, DuplicateError, NotFoundError, ReferenceError } from "../../../db/errors";
import type { RepoEnv } from "../../../db/RepoEnv";
import type {BatchItem} from "drizzle-orm/batch";

/**
 * Base section class that provides common functionality for all sections
 * Each section is responsible for CRUD operations on a single table
 */
export abstract class BaseSection<T, TInsert> {
  /** The database connection */
  protected db: DrizzleD1Database;

  /** The environment this section is running in */
  protected repoEnv: RepoEnv;

  /** The Cloudflare environment */
  protected env: Env;

  /**
   * Creates a new section instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  protected constructor(env: Env, repoEnv: RepoEnv) {
    this.db = drizzle(env.DB);
    this.env = env;
    this.repoEnv = repoEnv;
  }

  /**
   * Handles errors by transforming them into appropriate error types
   * @param message - The error message
   * @param error - The original error
   */
  protected handleError(message: string, error: unknown): never {
    console.error('Section Error:', message, error);

    // Handle SQLite-specific errors
    if (error instanceof Error && 'code' in error) {
      const sqliteError = error as Error & { code: string };

      // Handle constraint violations
      if (sqliteError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new DuplicateError(message, error);
      }

      // Handle foreign key violations
      if (sqliteError.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        throw new ReferenceError(message, error);
      }
    }

    // Handle NotFoundError
    if (error instanceof NotFoundError) {
      throw error;
    }

    // Handle other database errors
    if (this.isAction()) {
      throw new DatabaseError(message, error).toActionError();
    } else {
      throw new DatabaseError(message, error);
    }
  }

  /**
   * Checks if the section is running in an action environment
   * @returns True if the section is running in an action environment
   */
  protected isAction() {
    return this.repoEnv === 'action';
  }

  /**
   * Executes a batch of operations
   * @param operations - The operations to execute
   */
  async executeBatch(operations: BatchItem<'sqlite'>[]) {
    try {
      if (operations.length === 0) return;

      const [firstOp, ...restOps] = operations;
      return this.db.batch([firstOp, ...restOps] as const);
    } catch (error) {
      this.handleError("Failed to execute batch operations", error);
    }
  }

  // CRUD methods are implemented by each section according to its specific needs
  // and are no longer required to be implemented by all sections
}
