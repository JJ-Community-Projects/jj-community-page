import type {APIContext} from "astro";
import type {ActionAPIContext} from "astro:actions";
import {drizzle, type DrizzleD1Database} from 'drizzle-orm/d1';
import {extractCFBinding} from "../../lib/extractCFBinding";
import * as schema from "../db/schema/schema.ts"

export type JJDatabase = DrizzleD1Database<typeof schema>

export function getDB(
  source: APIContext | ActionAPIContext | App.Locals | Env
): JJDatabase {
  const binding = extractCFBinding(source)
  return drizzle(binding.DB, {
    schema: schema,
  });
}
