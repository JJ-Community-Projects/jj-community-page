import {ACTION_ERROR_CODES, ActionError, type ActionErrorCode} from "astro:actions";

export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: unknown,
    public code?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  private isCodeActionErrorCode () {
    if (!this.code) {
      return false;
    }
    return Object.values(ACTION_ERROR_CODES).includes(this.code as any);
  }

  // Helper method to convert to ActionError
  toActionError() {
    if (this.isCodeActionErrorCode()) {
      return new ActionError({
        code: (this.code as ActionErrorCode) || 'INTERNAL_SERVER_ERROR',
        message: this.message
      });
    }
    return new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: this.message
    });

  }
}
