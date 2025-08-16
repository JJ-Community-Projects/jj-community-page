import type {APIContext} from "astro";
import type {ActionAPIContext} from "astro:actions";
import {drizzle, type DrizzleD1Database} from 'drizzle-orm/d1';
import {extractCFBinding} from "../extractCFBinding.ts";
import * as schema from "../db/schema/schema.ts"

export type JJDrizzleDatabase = DrizzleD1Database<typeof schema>

export function getDB(
  source: APIContext | ActionAPIContext | App.Locals | Env
): JJDrizzleDatabase {
  const binding = extractCFBinding(source)
  return drizzle(binding.DB, {
    schema: schema,
  });
}
