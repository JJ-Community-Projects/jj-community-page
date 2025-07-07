import type {RepoEnv} from "./Repo.ts";
import {drizzle, type DrizzleD1Database} from "drizzle-orm/d1";
import type {ActionAPIContext} from "astro:actions";
import {and, eq, type InferSelectModel} from "drizzle-orm";
import {accounts} from "../schema/auth-schema.ts";
import {DatabaseError} from "./DatabaseError.ts";


export class TiltifyRepo {
  private env: Env;
  private readonly repoEnv: RepoEnv;
  private db: DrizzleD1Database

  constructor(env: Env, repoEnv: RepoEnv) {
    this.env = env;
    this.repoEnv = repoEnv;
    this.db = drizzle(env.DB)
  }

  static action(ctx: ActionAPIContext) {
    return new TiltifyRepo(ctx.locals.runtime.env, 'action')
  }

  /**
   * Helper method to handle database errors consistently
   * @param message Error message
   * @param error Original error
   * @throws DatabaseError
   */
  private handleError(message: string, error: any): never {
    if (this.repoEnv === 'action') {
      throw new DatabaseError(message, error).toActionError();
    } else {
      throw new DatabaseError(message, error);
    }
  }

  async getAllAccounts(): Promise<InferSelectModel<typeof accounts>[]> {
    try {
      return this.db.select()
        .from(accounts)
        .where(eq(accounts.provider, 'tiltify'))
        .all();
    } catch (error) {
      return this.handleError("Failed to find all tiltify accounts", error);
    }
  }

  /**
   * Get the tiltify account for a user
   * @param userId The user ID
   * @returns Promise resolving to an account
   *
   * SQL: `SELECT * FROM "accounts" WHERE "accounts"."userId" =? and "accounts"."provider" == "tiltify"`
   */
  async getAccount(userId: number): Promise<InferSelectModel<typeof accounts> | undefined> {
    try {
      return await this.db.select()
        .from(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.provider, 'tiltify')))
        .get();
    } catch (error) {
      return this.handleError(`Failed to get accounts for user with id: ${userId}`, error);
    }
  }
}
