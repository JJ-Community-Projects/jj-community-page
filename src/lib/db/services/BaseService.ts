import {drizzle, type DrizzleD1Database} from "drizzle-orm/d1";
import type {BatchItem} from "drizzle-orm/batch";
import {
  AuthorizationError,
  ConnectionError,
  DuplicateError,
  NotFoundError,
  ReferenceError,
  ServiceError,
  ValidationError
} from "../errors";
import type {RepoEnv} from "../RepoEnv";

/**
 * Base service class that provides common functionality for all services
 *
 * Services are responsible for implementing business logic and coordinating
 * between repositories. They handle validation, authorization, and error handling.
 */
export abstract class BaseService {
  /** The Cloudflare environment */
  protected env: Env;

  /** The environment this service is running in */
  protected repoEnv: RepoEnv;

  /** The database connection */
  protected db: DrizzleD1Database;

  /**
   * Creates a new service instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  protected constructor(env: Env, repoEnv: RepoEnv) {
    this.env = env;
    this.repoEnv = repoEnv;
    this.db = drizzle(env.DB);
  }

  /**
   * Executes a batch of database operations
   * @param operations - The operations to execute
   * @throws {DatabaseError} If the batch execution fails
   */
  protected async executeBatch(operations: BatchItem<'sqlite'>[]) {
    try {
      if (operations.length === 0) return;

      const [firstOp, ...restOps] = operations;
      await this.db.batch([firstOp, ...restOps] as const);
    } catch (error) {
      this.handleError("Failed to execute batch operations", error);
    }
  }

  /**
   * Executes a function within a transaction
   * @param fn - The function to execute within the transaction
   * @returns The result of the function
   * @throws {DatabaseError} If the transaction fails
   */
  protected async transaction<T>(fn: () => Promise<T>): Promise<T> {
    try {
      // Note: D1 doesn't support true transactions yet, so this is a placeholder
      // When D1 adds transaction support, this should be updated
      return await fn();
    } catch (error) {
      this.handleError("Transaction failed", error);
      throw error; // This line will never be reached, but is needed for TypeScript
    }
  }

  /**
   * Checks if the service is running in an action environment
   * @returns True if the service is running in an action environment
   */
  protected isAction(): boolean {
    return this.repoEnv === 'action';
  }

  /**
   * Checks if the service is running in a durable object environment
   * @returns True if the service is running in a durable object environment
   */
  protected isDurableObject(): boolean {
    return this.repoEnv === 'do';
  }

  /**
   * Checks if the service is running in a queue environment
   * @returns True if the service is running in a queue environment
   */
  protected isQueue(): boolean {
    return this.repoEnv === 'queue';
  }

  /**
   * Checks if the service is running in a cron environment
   * @returns True if the service is running in a cron environment
   */
  protected isCron(): boolean {
    return this.repoEnv === 'cron';
  }

  /**
   * Checks if the service is running in an API environment
   * @returns True if the service is running in an API environment
   */
  protected isApi(): boolean {
    return this.repoEnv === 'api';
  }

  /**
   * Handles errors by transforming them into appropriate error types
   * @param message - The error message
   * @param error - The original error
   * @throws {ActionError} If in an action environment
   * @throws {DatabaseError} If a database error occurred
   * @throws {ValidationError} If a validation error occurred
   * @throws {AuthorizationError} If an authorization error occurred
   * @throws {ServiceError} If a service error occurred
   */
  protected handleError(message: string, error: unknown): never {
    console.error('Service Error:', message, error);

    // Handle specific error types
    if (error instanceof NotFoundError ||
      error instanceof DuplicateError ||
      error instanceof ReferenceError ||
      error instanceof ConnectionError ||
      error instanceof ValidationError ||
      error instanceof AuthorizationError ||
      error instanceof ServiceError) {
      if (this.isAction()) {
        throw error.toActionError();
      }
      throw error;
    }

    // Handle SQLite-specific errors
    if (error instanceof Error && 'code' in error) {
      const sqliteError = error as Error & { code: string };

      // Handle constraint violations
      if (sqliteError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const duplicateError = new DuplicateError(message, error);
        if (this.isAction()) {
          throw duplicateError.toActionError();
        }
        throw duplicateError;
      }

      // Handle foreign key violations
      if (sqliteError.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        const referenceError = new ReferenceError(message, error);
        if (this.isAction()) {
          throw referenceError.toActionError();
        }
        throw referenceError;
      }
    }

    // Handle generic errors
    const serviceError = new ServiceError(message, error);
    if (this.isAction()) {
      throw serviceError.toActionError();
    }
    throw serviceError;
  }

  /**
   * Logs a message with optional parameters
   * @param message - The message to log
   * @param params - Optional parameters to include in the log
   */
  protected log(message: string, ...params: any[]): void {
    console.log(`[${this.constructor.name}]`, message, ...params);
  }

  /**
   * Logs a warning message with optional parameters
   * @param message - The message to log
   * @param params - Optional parameters to include in the log
   */
  protected warn(message: string, ...params: any[]): void {
    console.warn(`[${this.constructor.name}]`, message, ...params);
  }

  /**
   * Logs an error message with optional parameters
   * @param message - The message to log
   * @param params - Optional parameters to include in the log
   */
  protected error(message: string, ...params: any[]): void {
    console.error(`[${this.constructor.name}]`, message, ...params);
  }

  /**
   * Validates that a value is not null or undefined
   * @param value - The value to check
   * @param message - The error message to throw if the value is null or undefined
   * @throws {ValidationError} If the value is null or undefined
   */
  protected validateNotNull<T>(value: T | null | undefined, message: string): T {
    if (value === null || value === undefined) {
      throw new ValidationError(message);
    }
    return value;
  }

  /**
   * Validates that a condition is true
   * @param condition - The condition to check
   * @param message - The error message to throw if the condition is false
   * @throws {ValidationError} If the condition is false
   */
  protected validateCondition(condition: boolean, message: string): void {
    if (!condition) {
      throw new ValidationError(message);
    }
  }

  /**
   * Ensures that a user is authorized to perform an action
   * @param condition - The authorization condition
   * @param message - The error message to throw if the condition is false
   * @throws {AuthorizationError} If the condition is false
   */
  protected ensureAuthorized(condition: boolean, message: string): void {
    if (!condition) {
      throw new AuthorizationError(message);
    }
  }
}
