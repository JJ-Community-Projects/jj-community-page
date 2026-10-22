import { env } from 'cloudflare:workers'
import {getDB, type JJDrizzleDatabase} from "../lib/db/db";
import {schedulesTable, teamsTable} from "../lib/db/schema/schema";
import {accounts} from "../lib/db/schema/auth-schema";
import {and, inArray, ne, sql} from "drizzle-orm";
import {createSlug} from "../lib/createSlug";

export {createSlug};

/**
 * Sanitizes a tag for internal use.
 *
 * @param tag - The tag to sanitize
 * @returns A sanitized tag containing only lowercase letters and hyphens
 *
 * @example
 * // returns "hello-world"
 * sanitizeTag("Hello World")
 *
 * @example
 * // returns "gaming-stream"
 * sanitizeTag("Gaming Stream!")
 */
export function sanitizeTag(tag: string): string {
  if (!tag) return '';

  return tag
    .toLowerCase()                     // Convert to lowercase
    .trim()                            // Remove leading/trailing whitespace
    .normalize('NFD')                  // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '')   // Remove diacritical marks
    .replace(/\s+/g, '-')              // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')          // Remove all non-word chars (except hyphens)
    .replace(/\-\-+/g, '-')            // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')                // Remove leading hyphens
    .replace(/-+$/, '');               // Remove trailing hyphens
}

/** Names nobody may use as a slug, besides other users' provider usernames. */
const RESERVED_NAMES = ['yogscast'];

/**
 * Checks whether a team or schedule slug is free and suggests free alternatives (SOC-05, EDT-18).
 *
 * A slug is free when no other user has it as a provider username (case-insensitive) and no team
 * or schedule uses it. Suggestions are `<slug>-team` / `<slug>-schedule`, `<slug>-1` to `-3` and
 * the slug of the Tiltify name, each only when free. All candidates are checked in one batch:
 * the username check uses `idx_accounts_username_lower`, the slug check the unique slug index.
 *
 * @param kind - Which slugs to check against
 * @param user - The current user: their own usernames don't block, their Tiltify name is the fallback suggestion
 * @param slug - The slug to check
 * @param tiltifyName - A name to suggest a slug from (e.g. the team name), used when it differs from the slug
 */
export async function validateSlugFor(
  kind: 'team' | 'schedule',
  user: { id: number, tiltifyName: string },
  slug: string,
  tiltifyName?: string,
): Promise<{ isValid: boolean, suggestions: string[] }> {
  const differs = (name: string | undefined) => !!name && name.toLowerCase() !== slug.toLowerCase();
  const suggestedName = differs(tiltifyName) ? tiltifyName : differs(user.tiltifyName) ? user.tiltifyName : undefined;

  const alternatives = [`${slug}-${kind}`, `${slug}-1`, `${slug}-2`, `${slug}-3`];
  if (suggestedName) alternatives.push(createSlug(suggestedName));

  const candidates = [...new Set([slug, ...alternatives].filter(Boolean))];
  const db = getDB(env);
  const isFree = slugFreeFrom(await db.batch(slugLookups(db, kind, user.id, candidates)));

  if (isFree(slug)) {
    return { isValid: true, suggestions: [] };
  }
  return {
    isValid: false,
    suggestions: [...new Set(alternatives)].filter((alternative) => alternative && alternative !== slug && isFree(alternative)),
  };
}

/**
 * The two statements that find which `candidates` are another user's username (case-insensitive)
 * or a taken team / schedule slug. They go into a `db.batch` (with other statements, as the create
 * calls do); `slugFreeFrom` reads their results.
 */
export function slugLookups(db: JJDrizzleDatabase, kind: 'team' | 'schedule', userId: number, candidates: string[]) {
  const lowerUsername = sql<string>`lower(${accounts.providerUsername})`;
  const slugColumn = kind === 'team' ? teamsTable.slug : schedulesTable.slug;
  return [
    db.select({ name: lowerUsername })
      .from(accounts)
      .where(and(inArray(lowerUsername, candidates.map((c) => c.toLowerCase())), ne(accounts.userId, userId))),
    db.select({ slug: slugColumn })
      .from(kind === 'team' ? teamsTable : schedulesTable)
      .where(inArray(slugColumn, candidates)),
  ] as const;
}

/** Whether a candidate is free, from the results of `slugLookups` (reserved names are never free). */
export function slugFreeFrom(rows: readonly unknown[]) {
  const [blockedRows, takenRows] = rows as [{ name: string }[], { slug: string }[]];
  const blocked = new Set([...RESERVED_NAMES, ...blockedRows.map((row) => row.name)]);
  const taken = new Set(takenRows.map((row) => row.slug));
  return (candidate: string) => !blocked.has(candidate.toLowerCase()) && !taken.has(candidate);
}
