import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import type {APIContext} from "astro";
import type {ActionAPIContext} from "astro:actions";
import type {SQLiteTableWithColumns, TableConfig} from "drizzle-orm/sqlite-core";
import {eq} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError";
import type {InferInsertModel, InferSelectModel} from "drizzle-orm";

export type RepoEnv = 'action' | 'do'

export abstract class Repo<
  T extends TableConfig
> {
  protected db: DrizzleD1Database;
  protected table: SQLiteTableWithColumns<T>;
  protected env: RepoEnv

  protected constructor(db: DrizzleD1Database, table: SQLiteTableWithColumns<T>, env: RepoEnv) {
    this.db = db;
    this.table = table;
    this.env = env;
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
}
