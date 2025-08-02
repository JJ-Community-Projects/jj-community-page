// src/lib/db/newRepos/base/BaseRepo.ts
/// <reference path="../../../../../worker-configuration.d.ts" />
import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import type {BatchItem} from "drizzle-orm/batch";
import {DatabaseError} from "../../errors";
import type {RepoEnv} from "../../RepoEnv.ts";

/**
 * Base repository class that provides common functionality for all repositories
 * Each repository is responsible for operations across multiple tables within a domain
 */
export abstract class BaseRepo {
  /** The database connection */
  protected db: DrizzleD1Database;

  /** The environment this repository is running in */
  protected repoEnv: RepoEnv;

  /** The Cloudflare environment */
  protected env: Env;

  /**
   * Creates a new repository instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  protected constructor(env: Env, repoEnv: RepoEnv) {
    this.db = drizzle(env.DB);
    this.env = env;
    this.repoEnv = repoEnv;
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

  /**
   * Checks if the repository is running in an action environment
   * @returns True if the repository is running in an action environment
   */
  protected isAction() {
    return this.repoEnv === 'action';
  }

  /**
   * Handles errors by transforming them into appropriate error types
   * @param message - The error message
   * @param error - The original error
   */
  protected handleError(message: string, error: unknown): never {
    console.error('Repository Error:', message, error);

    if (this.isAction()) {
      throw new DatabaseError(message, error).toActionError();
    } else {
      throw new DatabaseError(message, error);
    }
  }
}
