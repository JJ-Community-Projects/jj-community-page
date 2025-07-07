import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import type {SQLiteTableWithColumns, TableConfig} from "drizzle-orm/sqlite-core";
import {DatabaseError} from "./DatabaseError";
import type {BatchItem} from "drizzle-orm/batch";

export type RepoEnv = 'action' | 'do' | 'queue' | 'cron' | 'api'

export abstract class Repo<
  T extends TableConfig
> {
  protected db: DrizzleD1Database;
  protected table: SQLiteTableWithColumns<T>;
  protected repoEnv: RepoEnv
  protected env: Env

  protected constructor(env: Env,  repoEnv: RepoEnv,table: SQLiteTableWithColumns<T>) {
    this.db = drizzle(env.DB);
    this.table = table;
    this.env = env;
    this.repoEnv = repoEnv;
  }

  /**
   * Creates a default SELECT query for the table
   * @returns A query builder for selecting from the table
   *
   * SQL: `SELECT * FROM "table_name"`
   */
  protected defaultSelect() {
    return this.db.select().from(this.table);
  }

  protected async executeBatch(operations: BatchItem<'sqlite'>[]) {
    try {
      if (operations.length === 0) return;

      const [firstOp, ...restOps] = operations;
      await this.db.batch([firstOp, ...restOps] as const);
    } catch (error) {
      console.log('Repo', 'executeBatch', error);
      if (this.repoEnv === 'action') {
        throw new DatabaseError("Failed to execute batch operations", error).toActionError();
      } else {
        throw new DatabaseError("Failed to execute batch operations", error);
      }
    }
  }

  protected isAction() {
    return this.repoEnv === 'action';
  }
}
