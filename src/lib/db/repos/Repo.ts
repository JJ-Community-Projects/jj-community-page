import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import type {APIContext} from "astro";
import type {ActionAPIContext} from "astro:actions";
import type {SQLiteTableWithColumns, TableConfig} from "drizzle-orm/sqlite-core";
import {eq} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError";
import type {InferInsertModel, InferSelectModel} from "drizzle-orm";


export abstract class Repo<
  T extends TableConfig
> {
  protected db: DrizzleD1Database;
  protected table: SQLiteTableWithColumns<T>;

  protected constructor(db: DrizzleD1Database, table: SQLiteTableWithColumns<T>) {
    this.db = db;
    this.table = table;
  }

  protected defaultSelect() {
    return this.db.select().from(this.table);
  }
}
