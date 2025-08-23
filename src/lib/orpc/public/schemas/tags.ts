import {z} from "zod/v4";
import {PaginationLimitSchema, UserIdSchema} from "./common.ts";

/**
 * Public tag contracts for tag search, discovery, and user interaction.
 * These schemas handle read-only operations for tags, categories, and user-tag relationships.
 */

// === Core Tag Schemas ===

/**
 * Schema for basic tag information used in public contexts.
 * Provides essential tag data for display and search results.
 */
export const PublicTagSchema = z.object({
  /** Unique identifier for the tag */
  id: z.number(),
  /** Display name of the tag */
  name: z.string(),
  /** URL-friendly slug for the tag */
  slug: z.string(),
  /** Optional description explaining the tag's purpose */
  description: z.string().nullable(),
  /** ID of the category this tag belongs to (null for uncategorized) */
  categoryId: z.number().nullable(),
  /** Hex color code for visual representation */
  color: z.string(),
});
/**
 * Schema for basic tag information used in public contexts.
 * Provides essential tag data for display and search results.
 */
export const SimplePublicTagSchema = z.object({
  /** Display name of the tag */
  name: z.string(),
  /** URL-friendly slug for the tag */
  slug: z.string(),
  /** Hex color code for visual representation */
  color: z.string(),
});
/**
 * Schema for tag information with usage statistics.
 * Extends PublicTagSchema with popularity metrics.
 */
export const TagWithUsageSchema = PublicTagSchema.extend({
  /** Number of users who have this tag */
  userCount: z.number(),
  /** Number of streams tagged with this tag */
  streamCount: z.number(),
  /** Total usage count across all contexts */
  totalUsage: z.number(),
});

/**
 * Schema for tag search results with relevance information.
 * Provides detailed search match information for ranking.
 */
export const TagSearchResultSchema = z.object({
  /** Unique identifier for the tag */
  id: z.number(),
  /** Display name of the tag */
  name: z.string(),
  /** URL-friendly slug for the tag */
  slug: z.string(),
  /** Optional description explaining the tag's purpose */
  description: z.string().nullable(),
  /** ID of the category this tag belongs to (null for uncategorized) */
  categoryId: z.number().nullable(),
  /** Hex color code for visual representation */
  color: z.string(),
  /** Number of users who have this tag */
  userCount: z.number(),
  /** Number of streams tagged with this tag */
  streamCount: z.number(),
  /** Total usage count across all contexts */
  totalUsage: z.number(),
  /** How the search term matched this tag */
  matchType: z.enum(['name', 'alias', 'description']),
  /** Relevance score from 0 to 1 for search ranking */
  relevanceScore: z.number().min(0).max(1),
});

/**
 * Schema for tag category information.
 * Provides metadata about tag groupings and organization.
 */
export const TagCategorySchema = z.object({
  /** Unique identifier for the category */
  id: z.number(),
  /** URL-friendly slug for the category */
  slug: z.string(),
  /** Display name of the category */
  name: z.string(),
  /** Optional description of the category's purpose */
  description: z.string().nullable(),
  /** Hex color code for category theming */
  color: z.string(),
  /** Optional icon identifier for visual representation */
  icon: z.string().nullable(),
  /** Display order for category listing */
  sortOrder: z.number(),
  /** Whether this category is publicly visible */
  visible: z.boolean(),
  /** Number of tags in this category */
  tagCount: z.number(),
  /** Total usage count of all tags in this category */
  usageCount: z.number(),
});

// === User-Tag Relationship Schemas ===

/**
 * Schema for tag identifier validation.
 * Used for identifying tags in user-related operations.
 */
export const TagIdSchema = z.number().int().positive();

export const TagIdInputSchema = z.object({
  teamId: TagIdSchema
})

/**
 * Schema for user-tag association data.
 * Represents the relationship between a user and their tags.
 */
export const UserTagSchema = z.object({
  /** ID of the user who has this tag */
  userId: z.number(),
  /** ID of the tag */
  tagId: z.number(),
  /** When the user added this tag to their profile */
  addedAt: z.date(),
  /** Full tag information */
  tag: PublicTagSchema,
});

/**
 * Schema for user information with their associated tags.
 * Used for displaying users in tag-based discovery features.
 */
export const UserWithTagsSchema = z.object({
  /** Unique identifier for the user */
  userId: z.number(),
  /** User's display name */
  username: z.string(),
  /** Optional profile image URL */
  profileImage: z.string().nullable(),
  /** Array of tags this user has */
  tags: z.array(PublicTagSchema),
  /** Total count of tags for this user */
  tagCount: z.number(),
  /** Whether the current user is following this user (only for authenticated requests) */
  isFollowing: z.boolean().optional(),
});

/**
 * Schema for tag recommendation data.
 * Provides personalized tag suggestions with reasoning.
 */
export const TagRecommendationSchema = z.object({
  /** The recommended tag */
  tag: PublicTagSchema,
  /** Recommendation confidence score from 0 to 1 */
  score: z.number().min(0).max(1),
  /** Why this tag was recommended */
  reason: z.enum(['similar_users', 'popular', 'category_match', 'trending']),
  /** Number of users who have this tag */
  userCount: z.number(),
});

/**
 * Schema for bulk tag update operation results.
 * Provides detailed feedback on batch tag operations.
 */
export const BulkUpdateResultSchema = z.object({
  /** Successfully added user-tag associations */
  added: z.array(UserTagSchema),
  /** Tag removal results */
  removed: z.array(z.object({
    /** ID of the tag that was removed */
    tagId: z.number(),
    /** Whether the removal was successful */
    success: z.boolean(),
  })),
  /** Errors that occurred during the operation */
  errors: z.array(z.object({
    /** ID of the tag that caused an error */
    tagId: z.number(),
    /** Error message describing what went wrong */
    error: z.string(),
  })),
});

// === Input Validation Schemas ===

/**
 * Schema for basic tag search input parameters.
 * Used for simple tag search operations with fuzzy matching.
 */
export const TagSearchInputSchema = z.object({
  /** Search query string */
  query: z.string().min(1).max(100),
  /** Maximum number of results to return */
  limit: PaginationLimitSchema(1, 50, 10),
  /** Optional category filter */
  categoryId: z.number().int().positive().optional(),
  /** Whether to include hidden tags in results */
  includeHidden: z.boolean().default(false),
});

/**
 * Schema for popular tags request parameters.
 * Used for retrieving trending and commonly used tags.
 */
export const PopularTagsInputSchema = z.object({
  /** Maximum number of tags to return */
  limit: PaginationLimitSchema(1, 50, 10),
  /** Optional category filter */
  categoryId: z.number().int().positive().optional(),
  /** Time range for popularity calculation */
  timeRange: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
});

/**
 * Schema for category-based tag browsing input.
 * Used for retrieving all tags within a specific category.
 */
export const TagsByCategoryInputSchema = z.object({
  /** ID of the category to browse */
  categoryId: z.number().int().positive(),
  /** Maximum number of tags to return */
  limit: PaginationLimitSchema(1, 50, 20),
  /** How to sort the results */
  sortBy: z.enum(['name', 'usage', 'created']).default('usage'),
});

/**
 * Schema for tag lookup by slug.
 * Used for retrieving a single tag by its URL-friendly identifier.
 */
export const TagBySlugInputSchema = z.object({
  /** URL-friendly tag identifier */
  slug: z.string().min(1),
});

/**
 * Schema for personalized tag suggestions input.
 * Used for generating relevant tag recommendations for users.
 */
export const SuggestedTagsInputSchema = z.object({
  /** Maximum number of suggestions to return */
  limit: PaginationLimitSchema(1, 20, 5),
  /** Whether to exclude tags the user already has */
  excludeUserTags: z.boolean().default(true),
  /** Optional category filter for suggestions */
  categoryId: z.number().int().positive().optional(),
});

/**
 * Schema for advanced tag search with filtering and faceting.
 * Provides comprehensive search capabilities with complex queries.
 */
export const SearchTagsAdvancedInputSchema = z.object({
  /** Search query string */
  query: z.string().min(1).max(100),
  /** Optional filters to narrow results */
  filters: z.object({
    /** Filter by specific category IDs */
    categoryIds: z.array(z.number().int().positive()).optional(),
    /** Filter by specific colors */
    colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).optional(),
    /** Minimum usage count threshold */
    minUsage: z.number().int().min(0).optional(),
    /** Maximum usage count threshold */
    maxUsage: z.number().int().min(0).optional(),
  }).optional(),
  /** Optional sorting configuration */
  sort: z.object({
    /** Field to sort by */
    field: z.enum(['name', 'usage', 'created', 'relevance']).default('relevance'),
    /** Sort direction */
    direction: z.enum(['asc', 'desc']).default('desc'),
  }).optional(),
  /** Maximum number of results to return */
  limit: PaginationLimitSchema(1, 50, 10),
  /** Pagination offset */
  offset: z.number().int().min(0).default(0),
});

/**
 * Schema for tag category search input.
 * Used for finding categories by name or description.
 */
export const SearchTagCategoriesInputSchema = z.object({
  /** Search query for category names or descriptions */
  query: z.string().min(1).max(100),
  /** Maximum number of categories to return */
  limit: PaginationLimitSchema(1, 50, 10),
  /** Whether to include hidden categories */
  includeHidden: z.boolean().default(false),
  /** How to sort category results */
  sortBy: z.enum(['name', 'usage', 'relevance']).default('relevance'),
});

/**
 * Schema for user tags retrieval input.
 * Used for getting tags associated with a specific user.
 */
export const GetUserTagsInputSchema = z.object({
  /** Optional user ID (uses current user if not provided) */
  userId: UserIdSchema.optional(),
});

/**
 * Schema for finding users by tag input.
 * Used for discovering users who have specific tags.
 */
export const FindUsersByTagInputSchema = z.object({
  /** ID of the tag to search for */
  tagId: TagIdSchema,
  /** Maximum number of users to return */
  limit: z.number().int().min(1).max(50).default(10),
  /** Whether to exclude the current user from results */
  excludeCurrentUser: z.boolean().default(true),
});

/**
 * Schema for tag recommendations request input.
 * Used for generating personalized tag suggestions for users.
 */
export const GetTagRecommendationsInputSchema = z.object({
  /** Optional user ID (uses current user if not provided) */
  userId: UserIdSchema.optional(),
  /** Maximum number of recommendations to return */
  limit: z.number().int().min(1).max(20).default(5),
  /** Whether to exclude tags the user already has */
  excludeExistingTags: z.boolean().default(true),
});

// === Response Schemas ===

/**
 * Schema for popular tags response data.
 * Provides structured response for popular tag queries.
 */
export const PopularTagsResponseSchema = z.object({
  /** Array of popular tags with usage statistics */
  tags: z.array(TagWithUsageSchema),
  /** Total number of tags matching the criteria */
  totalTags: z.number(),
  /** Time range used for popularity calculation */
  timeRange: z.string(),
  /** When the data was last updated */
  lastUpdated: z.date(),
});

/**
 * Schema for advanced search response with faceting data.
 * Provides comprehensive search results with metadata for filtering UI.
 */
export const AdvancedSearchResponseSchema = z.object({
  /** Array of matching tags with search relevance */
  tags: z.array(TagSearchResultSchema),
  /** Total number of results available */
  totalResults: z.number(),
  /** Whether more results are available */
  hasMore: z.boolean(),
  /** Facet data for building filter interfaces */
  facets: z.object({
    /** Available categories with counts */
    categories: z.array(z.object({
      /** Category ID (null for uncategorized) */
      categoryId: z.number().nullable(),
      /** Category display name */
      categoryName: z.string().nullable(),
      /** Number of tags in this category */
      count: z.number(),
    })),
    /** Usage ranges with counts for histogram display */
    usageRanges: z.array(z.object({
      /** Human-readable range description */
      range: z.string(),
      /** Number of tags in this usage range */
      count: z.number(),
    })),
  }),
});


export const TagCategoriesInputSchema = z.object({
  includeEmpty: z.boolean().default(false),
  sortBy: z.enum(['name', 'count', 'usage']).default('usage'),
})
