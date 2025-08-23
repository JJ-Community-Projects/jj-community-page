import {z} from "zod/v4";

/**
 * Common response and validation schemas used across oRPC domains.
 * These schemas provide consistent typing for frequently used patterns in both public and private operations.
 */

/**
 * Standard success response schema used across multiple procedures.
 * Provides consistent boolean success flag for operations like updates, deletions, and mutations.
 * Used in: teams, profile, blocks, friends, platforms, tags contracts
 */
export const SuccessSchema = z.object({
  success: z.boolean()
});


/**
 * Schema for validating hex color codes in user styling preferences.
 * Enforces 6-digit hex format for consistency across color customization features.
 * Used in: profile contract for primary and accent color validation
 */
export const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
  message: "Must be a valid hex color code (e.g., #E30E50)"
});

/**
 * Factory function for creating pagination limit schemas with configurable bounds.
 * Provides consistent pagination validation across list-based endpoints.
 * Used in: tags, popular, suggestions contracts for limiting result sets
 *
 * @param min - Minimum allowed limit value (default: 1)
 * @param max - Maximum allowed limit value (default: 100)
 * @param defaultValue - Default limit when not specified (default: 10)
 */
export const PaginationLimitSchema = (
  min: number = 1,
  max: number = 100,
  defaultValue: number = 10
) =>
  z.number().int().min(min).max(max).optional().default(defaultValue);
