import { z } from "zod";

/**
 * Tag-related schemas for user categorization and content discovery.
 * These schemas handle tag management, search, and recommendation operations in private contexts.
 */

/**
 * Schema for user-specific tags with timestamp information.
 * Extends the public Tag schema with user-specific metadata for tag management.
 * Used in: tags contract for user tag operations
 *
 * Differences from public Tag schema:
 * - Includes addedAt timestamp for tracking when user added the tag
 * - Used in authenticated contexts for user's personal tag management
 */
export const UserTagSchema = z.object({
  /** Unique tag identifier used internally for categorization and filtering */
  tag: z.string(),
  /** Human-readable display label shown to users in the interface */
  label: z.string(),
  /** Timestamp when the user added this tag to their profile */
  addedAt: z.date(),
});

/**
 * Schema for tag search results with usage statistics.
 * Includes tag information along with popularity metrics for discovery and recommendations.
 * Used in: tags, popular, suggestions contracts for tag search and recommendation
 */
export const TagSearchResultSchema = z.object({
  /** Unique tag identifier used internally for categorization and filtering */
  tag: z.string(),
  /** Human-readable display label shown to users in the interface */
  label: z.string(),
  /** Number of users who have added this tag (popularity metric) */
  count: z.number(),
});

/**
 * Schema for popular tags response with categorized tag lists.
 * Organizes popular tags into different categories for better user experience.
 * Used in: popular contract for displaying categorized popular tags
 */
export const PopularTagsResponseSchema = z.object({
  /** General popular tags across all categories */
  tags: z.array(TagSearchResultSchema),
  /** Default/recommended tags for new users */
  defaultTags: z.array(TagSearchResultSchema),
  /** Tags related to charity organizations and causes */
  charityTags: z.array(TagSearchResultSchema),
});

/**
 * Schema for suggested tags response.
 * Uses the same structure as PopularTagsResponseSchema for consistency.
 * Used in: suggestions contract for personalized tag recommendations
 */
export const SuggestedTagsResponseSchema = PopularTagsResponseSchema;
