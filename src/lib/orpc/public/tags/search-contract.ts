import {oc} from '@orpc/contract'
import z from "zod";
import {PaginationLimitSchema} from "../../schemas/common.ts";

/**
 * Public oRPC contracts for tag search, discovery, and user interaction
 * These procedures are accessible to all users and provide:
 * - Tag search with alias resolution
 * - Popular tag discovery
 * - Tag browsing by category
 * - Public tag information
 */

// Input validation schemas
const TagSearchInputSchema = z.object({
  query: z.string().min(1).max(100),
  limit: PaginationLimitSchema(1, 50, 10),
  categoryId: z.number().int().positive().optional(),
  includeHidden: z.boolean().default(false),
});

const PopularTagsInputSchema = z.object({
  limit: PaginationLimitSchema(1, 50, 10),
  categoryId: z.number().int().positive().optional(),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
});

const TagsByCategoryInputSchema = z.object({
  categoryId: z.number().int().positive(),
  limit: PaginationLimitSchema(1, 50, 20),
  sortBy: z.enum(['name', 'usage', 'created']).default('usage'),
});

const TagBySlugInputSchema = z.object({
  slug: z.string().min(1),
});

const SuggestedTagsInputSchema = z.object({
  limit: PaginationLimitSchema(1, 20, 5),
  excludeUserTags: z.boolean().default(true),
  categoryId: z.number().int().positive().optional(),
});

const SearchTagsAdvancedInputSchema = z.object({
  query: z.string().min(1).max(100),
  filters: z.object({
    categoryIds: z.array(z.number().int().positive()).optional(),
    colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).optional(),
    minUsage: z.number().int().min(0).optional(),
    maxUsage: z.number().int().min(0).optional(),
  }).optional(),
  sort: z.object({
    field: z.enum(['name', 'usage', 'created', 'relevance']).default('relevance'),
    direction: z.enum(['asc', 'desc']).default('desc'),
  }).optional(),
  limit: PaginationLimitSchema(1, 50, 10),
  offset: z.number().int().min(0).default(0),
});

const SearchTagCategoriesInputSchema = z.object({
  query: z.string().min(1).max(100),
  limit: PaginationLimitSchema(1, 50, 10),
  includeHidden: z.boolean().default(false),
  sortBy: z.enum(['name', 'usage', 'relevance']).default('relevance'),
});

// Output schemas
const PublicTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  categoryId: z.number().nullable(),
  color: z.string(),
});

const TagWithUsageSchema = PublicTagSchema.extend({
  userCount: z.number(),
  streamCount: z.number(),
  totalUsage: z.number(),
});

const TagSearchResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  categoryId: z.number().nullable(),
  color: z.string(),
  userCount: z.number(),
  streamCount: z.number(),
  totalUsage: z.number(),
  matchType: z.enum(['name', 'alias', 'description']),
  relevanceScore: z.number().min(0).max(1),
});

const TagCategorySchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string(),
  icon: z.string().nullable(),
  sortOrder: z.number(),
  visible: z.boolean(),
  tagCount: z.number(),
  usageCount: z.number(),
});

const PopularTagsResponseSchema = z.object({
  tags: z.array(TagWithUsageSchema),
  totalTags: z.number(),
  timeRange: z.string(),
  lastUpdated: z.date(),
});

const AdvancedSearchResponseSchema = z.object({
  tags: z.array(TagSearchResultSchema),
  totalResults: z.number(),
  hasMore: z.boolean(),
  facets: z.object({
    categories: z.array(z.object({
      categoryId: z.number().nullable(),
      categoryName: z.string().nullable(),
      count: z.number(),
    })),
    usageRanges: z.array(z.object({
      range: z.string(),
      count: z.number(),
    })),
  }),
});

// === Tag Search Contracts ===

/**
 * Search tags by name or alias
 * Provides fuzzy matching and alias resolution
 */
export const searchTagsContract = oc
  .input(TagSearchInputSchema)
  .output(z.array(TagSearchResultSchema));

/**
 * Advanced tag search with filtering and faceting
 * Provides comprehensive search capabilities with pagination
 */
export const searchTagsAdvancedContract = oc
  .input(SearchTagsAdvancedInputSchema)
  .output(AdvancedSearchResponseSchema);

/**
 * Get a single tag by its slug
 * Includes alias resolution - if slug is an alias, returns the canonical tag
 */
export const getTagBySlugContract = oc
  .input(TagBySlugInputSchema)
  .output(PublicTagSchema);

// === Tag Discovery Contracts ===

/**
 * Get popular tags with usage statistics
 * Returns most commonly used tags across the platform
 */
export const getPopularTagsContract = oc
  .input(PopularTagsInputSchema)
  .output(PopularTagsResponseSchema);

/**
 * Get all available tag categories
 * Returns category list with metadata for browsing
 */
export const getTagCategoriesContract = oc
  .input(z.object({
    includeEmpty: z.boolean().default(false),
    sortBy: z.enum(['name', 'count', 'usage']).default('usage'),
  }))
  .output(z.array(TagCategorySchema));

/**
 * Search tag categories by name or description
 * Provides fuzzy matching for category discovery
 */
export const searchTagCategoriesContract = oc
  .input(SearchTagCategoriesInputSchema)
  .output(z.array(TagCategorySchema));

/**
 * Get tags by category
 * Browse tags within a specific category
 */
export const getTagsByCategoryContract = oc
  .input(TagsByCategoryInputSchema)
  .output(z.array(TagWithUsageSchema));

/**
 * Get suggested tags for the current user
 * Provides personalized tag recommendations based on user behavior
 * Requires authentication
 */
export const getSuggestedTagsContract = oc
  .input(SuggestedTagsInputSchema)
  .output(z.array(TagWithUsageSchema));

// === Tag Information Contracts ===

/**
 * Get basic information about multiple tags
 * Efficient batch lookup for tag details
 */
export const getTagsByIdsContract = oc
  .input(z.object({
    ids: z.array(z.number().int().positive()).min(1).max(50),
    includeUsage: z.boolean().default(true),
  }))
  .output(z.array(TagWithUsageSchema));

/**
 * Get random tags for discovery
 * Returns a random selection of tags for exploration
 */
export const getRandomTagsContract = oc
  .input(z.object({
    count: z.number().int().min(1).max(20).default(5),
    categoryId: z.number().int().positive().optional(),
    excludeIds: z.array(z.number().int().positive()).optional(),
  }))
  .output(z.array(PublicTagSchema));

// === Tag Statistics Contracts ===

/**
 * Get overall tag system statistics
 * Public metrics about tag usage across the platform
 */
export const getTagStatisticsContract = oc
  .input(z.object({
    timeRange: z.enum(['7d', '30d', '90d', 'all']).default('all'),
  }))
  .output(z.object({
    totalTags: z.number(),
    totalVisibleTags: z.number(),
    totalCategories: z.number(),
    totalUserTags: z.number(),
    totalStreamTags: z.number(),
    mostPopularTags: z.array(TagWithUsageSchema),
    newestTags: z.array(PublicTagSchema),
    categoryDistribution: z.array(z.object({
      categoryId: z.number().nullable(),
      categoryName: z.string().nullable(),
      percentage: z.number(),
    })),
  }));

/**
 * Export all public tag search and discovery contracts
 */
export const publicTagsSearchContract = {
  // Search functionality
  searchTags: searchTagsContract,
  searchTagsAdvanced: searchTagsAdvancedContract,
  getTagBySlug: getTagBySlugContract,

  // Discovery
  getPopularTags: getPopularTagsContract,
  getTagCategories: getTagCategoriesContract,
  searchTagCategories: searchTagCategoriesContract,
  getTagsByCategory: getTagsByCategoryContract,

  // Statistics
  getTagStatistics: getTagStatisticsContract,
};
