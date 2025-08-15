import {z} from "zod";

/**
 * Tag-related schemas used across oRPC procedures for categorization and content discovery.
 * These schemas handle tag management, search, and recommendation operations.
 */

/**
 * Schema for user-defined tags that categorize content creators and their content.
 * Used for content discovery, filtering, and matching users with similar interests.
 * Tags help users find creators based on gaming preferences, content types, etc.
 * Used in: public user profiles, tag search results
 */
export const TagSchema = z.object({
  /** Unique tag identifier used internally for categorization and filtering */
  tag: z.string(),
  /** Human-readable display label shown to users in the interface */
  label: z.string(),
});

/**
 * Schema for user-specific tags with timestamp information.
 * Extends the basic Tag schema with user-specific metadata for tag management.
 * Used in: private tag management operations
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
 * Schema for tag information with usage count.
 * Used for tag-related operations that return tag data with popularity metrics.
 * Used in: popular tags, suggestions, and search operations
 */
export const TagWithCountSchema = z.object({
  /** The display label for the tag */
  label: z.string(),
  /** The actual tag value */
  tag: z.string(),
  /** The number of times this tag has been used */
  count: z.number()
});

/**
 * Schema for tag search results with usage statistics.
 * Includes tag information along with popularity metrics for discovery and recommendations.
 * Used in: tag search and recommendation operations
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
 * Returns popular tags along with default and charity tag options.
 * Used in: popular tags endpoints in both schedules and tags contexts
 */
export const PopularTagsResponseSchema = z.object({
  /** Popular tags from the database with usage counts */
  tags: z.array(TagWithCountSchema),
  /** Default fallback tags when not enough popular tags exist */
  defaultTags: z.array(TagWithCountSchema),
  /** Charity-related tags available for use */
  charityTags: z.array(TagWithCountSchema)
});

/**
 * Schema for suggested tags response.
 * Returns suggested tags along with default and charity tag options.
 * Used in: suggestion endpoints in both schedules and tags contexts
 */
export const SuggestedTagsResponseSchema = z.object({
  /** Suggested tags from the database based on popularity/search */
  tags: z.array(TagWithCountSchema),
  /** Default tags that match criteria and aren't already used */
  defaultTags: z.array(TagWithCountSchema),
  /** Charity tags that match criteria and aren't already used */
  charityTags: z.array(TagWithCountSchema)
});
