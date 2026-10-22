import { env } from 'cloudflare:workers'
import {getDB} from "../lib/db/db";
import {schedulesTable, teamsTable} from "../lib/db/schema/schema";
import {accounts} from "../lib/db/schema/auth-schema";
import {and, inArray, ne, sql} from "drizzle-orm";

/**
 * Converts a name into a URL-friendly slug.
 *
 * @param name - The name to convert to a slug
 * @returns A URL-friendly slug containing only alphanumeric characters and hyphens
 *
 * @example
 * // returns "hello-world"
 * createSlug("Hello World")
 *
 * @example
 * // returns "john-doe-123"
 * createSlug("John Doe 123!")
 */
export function createSlug(name: string): string {
  if (!name) return '';

  return name
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
  const lowerUsername = sql<string>`lower(${accounts.providerUsername})`;
  const slugColumn = kind === 'team' ? teamsTable.slug : schedulesTable.slug;

  const db = getDB(env);
  const [blockedRows, takenRows] = await db.batch([
    db.select({ name: lowerUsername })
      .from(accounts)
      .where(and(inArray(lowerUsername, candidates.map((c) => c.toLowerCase())), ne(accounts.userId, user.id))),
    db.select({ slug: slugColumn })
      .from(kind === 'team' ? teamsTable : schedulesTable)
      .where(inArray(slugColumn, candidates)),
  ]);

  const blocked = new Set([...RESERVED_NAMES, ...blockedRows.map((row) => row.name)]);
  const taken = new Set(takenRows.map((row) => row.slug));
  const isFree = (candidate: string) => !blocked.has(candidate.toLowerCase()) && !taken.has(candidate);

  if (isFree(slug)) {
    return { isValid: true, suggestions: [] };
  }
  return {
    isValid: false,
    suggestions: [...new Set(alternatives)].filter((alternative) => alternative && alternative !== slug && isFree(alternative)),
  };
}
