import { z } from "zod";

/**
 * Team management schemas for private oRPC procedures.
 * These schemas handle team creation, validation, and management operations in authenticated contexts.
 */

/**
 * Schema for team ID response format.
 * Provides consistent structure for operations that return a team identifier.
 * Used in: teams contract for team creation and management operations
 */
export const TeamIdSchema = z.object({
  /** The unique identifier of the team */
  teamId: z.number()
});

/**
 * Schema for team slug validation response.
 * Provides validation feedback and alternative suggestions for team slug creation.
 * Used in: teams contract for validating team slug availability and format
 */
export const SlugValidationSchema = z.object({
  /** Whether the proposed slug is valid and available for use */
  isValid: z.boolean(),
  /** Array of alternative slug suggestions if the proposed one is invalid or taken */
  suggestions: z.array(z.string())
});
