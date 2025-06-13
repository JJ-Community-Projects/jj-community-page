import type {APIContext} from "astro";
import type {ActionAPIContext} from "astro:actions";
import {drizzle} from 'drizzle-orm/d1';
import {extractCFBinding} from "../../lib/extractCFBinding";

export function getDB(
  source: APIContext | ActionAPIContext | App.Locals
) {
  const binding = extractCFBinding(source)
  return drizzle(binding.env.DB);
}
