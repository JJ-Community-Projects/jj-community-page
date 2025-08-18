import type {AstroContext} from "../lib/AstroContext";
import {getDB} from "../lib/db/db";
import {schedulesTable, teamsTable} from "../lib/db/schema/schema";
import {and, eq, not} from "drizzle-orm";
import {getBlockedNamesLocals} from "./blockedNames";

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

/**
 * Generates alternative slugs for teams if the provided slug is already in use.
 *
 * @param ctx - The Astro context
 * @param slug - The slug to check
 * @param n - The number of alternatives to generate
 * @returns An array of alternative slugs, or an empty array if the slug is not in use
 */
export async function generateTeamSlugAlternatives(ctx: AstroContext, slug: string, n: number = 3): Promise<string[]> {
  return generateTeamSlugAlternativesLocals(ctx.locals, slug, n);
}


export async function generateTeamSlugAlternativesLocals(locals: App.Locals, slug: string, n: number = 3): Promise<string[]> {
  if (!slug) return [];

  // Get blocked names first
  const blockedNames = await getBlockedNamesLocals(locals);

  // Generate alternatives
  const alternatives: string[] = [];
  const baseName = slug;

  // Add "team" suffix suggestion
  alternatives.push(`${baseName}-team`);

  // Add numeric suffix suggestions
  for (let i = 1; i <= n; i++) {
    alternatives.push(`${baseName}-${i}`);
  }

  // Filter out alternatives that are blocked
  const nonBlockedAlternatives = alternatives.filter(
    alternative => !blockedNames.includes(alternative.toLowerCase())
  );

  // Check if the baseName is different from slug and is blocked
  const baseNameLower = baseName.toLowerCase();
  const isBaseNameBlocked = baseNameLower !== slug.toLowerCase() && blockedNames.includes(baseNameLower);

  // If the original slug or baseName is blocked, return filtered alternatives without checking the database
  if (blockedNames.includes(slug.toLowerCase()) || isBaseNameBlocked) {
    return nonBlockedAlternatives;
  }

  const db = getDB(locals.runtime.env);

  // Check if the slug is already in use
  try {
    const existingTeam = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.slug, slug))
      .all();

    // If no team with this slug exists, return empty array
    if (existingTeam.length === 0) {
      return [];
    }
  } catch (e) {
    console.error('Error checking team slug:', e);
    return [];
  }

  // Then check database for the remaining alternatives
  const validAlternatives: string[] = [];
  for (const alternative of nonBlockedAlternatives) {
    try {
      // Check if alternative is unique
      const dbResult = await db.select()
        .from(teamsTable)
        .where(eq(teamsTable.slug, alternative))
        .all();
      const isUnique = dbResult.length === 0;

      if (isUnique) {
        validAlternatives.push(alternative);
      }
    } catch (e) {
      console.error('Error validating team slug alternative:', e);
    }
  }

  return validAlternatives;
}

/**
 * Generates alternative slugs for schedules if the provided slug is already in use.
 *
 * @param ctx - The Astro context
 * @param slug - The slug to check
 * @param n - The number of alternatives to generate
 * @param currentId - The ID of the current schedule (to exclude from uniqueness check)
 * @returns An array of alternative slugs, or an empty array if the slug is not in use
 */
export async function generateScheduleSlugAlternatives(ctx: AstroContext, slug: string, n: number = 3, currentId?: number): Promise<string[]> {
  return generateScheduleSlugAlternativesLocals(ctx.locals, slug, n);
}


export async function generateScheduleSlugAlternativesLocals(locals: App.Locals, slug: string, n: number = 3, currentId?: number): Promise<string[]> {
  if (!slug) return [];

  // Get blocked names first
  const blockedNames = await getBlockedNamesLocals(locals);

  // Generate alternatives
  const alternatives: string[] = [];
  const baseName = slug;

  // Add "schedule" suffix suggestion
  alternatives.push(`${baseName}-schedule`);

  // Add numeric suffix suggestions
  for (let i = 1; i <= n; i++) {
    alternatives.push(`${baseName}-${i}`);
  }

  // Filter out alternatives that are blocked
  const nonBlockedAlternatives = alternatives.filter(
    alternative => !blockedNames.includes(alternative.toLowerCase())
  );

  // Check if the baseName is different from slug and is blocked
  const baseNameLower = baseName.toLowerCase();
  const isBaseNameBlocked = baseNameLower !== slug.toLowerCase() && blockedNames.includes(baseNameLower);

  // If the original slug or baseName is blocked, return filtered alternatives without checking the database
  if (blockedNames.includes(slug.toLowerCase()) || isBaseNameBlocked) {
    return nonBlockedAlternatives;
  }

  const db = getDB(locals.runtime.env);

  // Check if the slug is already in use (excluding the current schedule if ID is provided)
  try {
    let query
    if (currentId) {
      query = db.select()
        .from(schedulesTable)
        .where(and(eq(schedulesTable.slug, slug), not(eq(schedulesTable.id, currentId))));
    } else {
      query = db.select()
        .from(schedulesTable)
        .where(eq(schedulesTable.slug, slug));
    }

    const existingSchedule = await query.all();

    // If no schedule with this slug exists, return empty array
    if (existingSchedule.length === 0) {
      return [];
    }
  } catch (e) {
    console.error('Error checking schedule slug:', e);
    return [];
  }

  // Filter out alternatives that are also in use
  const validAlternatives: string[] = [];
  for (const alternative of nonBlockedAlternatives) {
    try {
      // Check if alternative is unique
      let query
      if (currentId) {
        query = db.select()
          .from(schedulesTable)
          .where(and(eq(schedulesTable.slug, alternative), not(eq(schedulesTable.id, currentId))));
      } else {
        query = db.select()
          .from(schedulesTable)
          .where(eq(schedulesTable.slug, alternative));
      }

      const dbResult = await query.all();
      const isUnique = dbResult.length === 0;

      if (isUnique) {
        validAlternatives.push(alternative);
      }
    } catch (e) {
      console.error('Error validating schedule slug alternative:', e);
    }
  }

  return validAlternatives;
}
