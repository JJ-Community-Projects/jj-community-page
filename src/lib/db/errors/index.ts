import { ActionError, type ActionErrorCode } from "astro/actions/runtime/virtual/server.js";

/**
 * Base error class for all database-related errors
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: unknown,
    public code?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  /**
   * Converts the database error to an Astro ActionError for use in Astro actions
   */
  toActionError() {
    return new ActionError({
      code: (this.isActionErrorCode() ? this.code : 'INTERNAL_SERVER_ERROR') as ActionErrorCode,
      message: this.message
    });
  }

  private isActionErrorCode() {
    return this.code && [
      'BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND',
      'INTERNAL_SERVER_ERROR', 'CONFLICT'
    ].includes(this.code);
  }
}

/**
 * Error thrown when a requested entity is not found
 */
export class NotFoundError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, originalError, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown when a unique constraint is violated
 */
export class DuplicateError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, originalError, 'CONFLICT');
    this.name = 'DuplicateError';
  }
}

/**
 * Error thrown when a foreign key constraint is violated
 */
export class ReferenceError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, originalError, 'BAD_REQUEST');
    this.name = 'ReferenceError';
  }
}

/**
 * Error thrown when there's a database connection issue
 */
export class ConnectionError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, originalError, 'INTERNAL_SERVER_ERROR');
    this.name = 'ConnectionError';
  }
}

/**
 * Error thrown for business logic validation failures
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public originalError?: unknown,
    public code: string = 'BAD_REQUEST'
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  /**
   * Converts the validation error to an Astro ActionError for use in Astro actions
   */
  toActionError() {
    return new ActionError({
      code: this.code as ActionErrorCode,
      message: this.message
    });
  }
}

/**
 * Error thrown for authorization failures
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public originalError?: unknown,
    public code: string = 'FORBIDDEN'
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }

  /**
   * Converts the authorization error to an Astro ActionError for use in Astro actions
   */
  toActionError() {
    return new ActionError({
      code: this.code as ActionErrorCode,
      message: this.message
    });
  }
}

/**
 * Error thrown for service-level errors
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public originalError?: unknown,
    public code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  /**
   * Converts the service error to an Astro ActionError for use in Astro actions
   */
  toActionError() {
    return new ActionError({
      code: this.code as ActionErrorCode,
      message: this.message
    });
  }
}
