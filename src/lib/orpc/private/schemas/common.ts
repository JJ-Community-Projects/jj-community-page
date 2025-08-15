import { z } from "zod";

/**
 * Common response and validation schemas used across private oRPC domains.
 * These schemas provide consistent typing for frequently used patterns in authenticated operations.
 */

/**
 * Standard success response schema used across multiple private procedures.
 * Provides consistent boolean success flag for operations like updates, deletions, and mutations.
 * Used in: teams, profile, blocks, friends, platforms, tags, tiltify contracts
 */
export const SuccessSchema = z.object({
  success: z.boolean()
});

/**
 * Schema for validating user ID parameters in private API requests.
 * Ensures the ID is a positive integer matching the users table primary key.
 * Used in: blocks, friends contracts for user identification
 */
export const UserIdSchema = z.number().int().positive();

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
