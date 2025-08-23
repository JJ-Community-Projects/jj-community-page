import {oc} from '@orpc/contract'
import {z} from "zod/v4";
import {
  PopularTagsInputSchema,
  PopularTagsResponseSchema,
  PublicTagSchema,
  SuggestedTagsInputSchema,
  TagBySlugInputSchema,
  TagCategoriesInputSchema,
  TagCategorySchema,
  TagsByCategoryInputSchema,
  TagSearchInputSchema,
  TagSearchResultSchema,
  TagWithUsageSchema
} from "../schemas/tags.ts";

/**
 * Public oRPC contracts for tag search, discovery, and user interaction
 * These procedures are accessible to all users and provide:
 * - Tag search with alias resolution
 * - Popular tag discovery
 * - Tag browsing by category
 * - Public tag information
 */

// === Tag Search Contracts ===

/**
 * Search tags by name or alias
 * Provides fuzzy matching and alias resolution
 */
export const searchTagsContract = oc
  .input(TagSearchInputSchema)
  .output(z.array(TagSearchResultSchema))
  .route({
    path: '/tags/search',
    method: 'GET',
    operationId: 'searchTags',
    summary: 'Search tags',
    description: 'Search tags by name or alias with fuzzy matching',
    tags: ['tags'],
    successDescription: 'Tag search results retrieved successfully',
    deprecated: false
  });


/**
 * Get a single tag by its slug
 * Includes alias resolution - if slug is an alias, returns the canonical tag
 */
export const getTagBySlugContract = oc
  .input(TagBySlugInputSchema)
  .output(PublicTagSchema)
  .route({
    path: '/tags/{slug}',
    method: 'GET',
    operationId: 'getTagBySlug',
    summary: 'Get tag by slug',
    description: 'Retrieve tag information by slug with alias resolution',
    tags: ['tags'],
    successDescription: 'Tag information retrieved successfully',
    deprecated: false
  });

// === Tag Discovery Contracts ===

/**
 * Get popular tags with usage statistics
 * Returns most commonly used tags across the platform
 */
export const getPopularTagsContract = oc
  .input(PopularTagsInputSchema)
  .output(PopularTagsResponseSchema)
  .route({
    path: '/tags/popular',
    method: 'GET',
    operationId: 'getPopularTags',
    summary: 'Get popular tags',
    description: 'Retrieve most commonly used tags with usage statistics',
    tags: ['tags'],
    successDescription: 'Popular tags retrieved successfully',
    deprecated: false
  });

/**
 * Get all available tag categories
 * Returns category list with metadata for browsing
 */
export const getTagCategoriesContract = oc
  .input(TagCategoriesInputSchema)
  .output(z.array(TagCategorySchema))
  .route({
    path: '/tags/categories',
    method: 'GET',
    operationId: 'getTagCategories',
    summary: 'Get tag categories',
    description: 'Retrieve all available tag categories with metadata',
    tags: ['tags'],
    successDescription: 'Tag categories retrieved successfully',
    deprecated: false
  });


/**
 * Get tags by category
 * Browse tags within a specific category
 */
export const getTagsByCategoryContract = oc
  .input(TagsByCategoryInputSchema)
  .output(z.array(TagWithUsageSchema))
  .route({
    path: '/tags',
    method: 'GET',
    operationId: 'getTagsByCategory',
    summary: 'Get tags by category',
    description: 'Browse tags within a specific category (use ?category={categoryId} query parameter)',
    tags: ['tags'],
    successDescription: 'Tags by category retrieved successfully',
    deprecated: false
  });

/**
 * Get suggested tags for the current user
 * Provides personalized tag recommendations based on user behavior
 * Requires authentication
 */
export const getSuggestedTagsContract = oc
  .input(SuggestedTagsInputSchema)
  .output(z.array(TagWithUsageSchema))
  .route({
    path: '/tags/suggested',
    method: 'GET',
    operationId: 'getSuggestedTags',
    summary: 'Get suggested tags',
    description: 'Get personalized tag recommendations',
    tags: ['tags'],
    successDescription: 'Suggested tags retrieved successfully',
    deprecated: false
  });

// === Tag Information Contracts ===


// === Removed Nice-to-Have Contracts ===
/*
 * The following contracts were removed as they are considered nice-to-have features:
 * - searchTagsAdvanced: Advanced search with filtering and faceting
 * - searchTagCategories: Category search functionality
 * - getTagsByIds: Batch lookup optimization
 * - getRandomTags: Tag exploration feature
 * - getTagStatistics: Platform metrics and insights
 */

/**
 * Export all public tag search and discovery contracts
 */
export const publicTagsSearchContract = {
  // Search functionality
  searchTags: searchTagsContract,
  getTagBySlug: getTagBySlugContract,

  // Discovery
  getPopularTags: getPopularTagsContract,
  getTagCategories: getTagCategoriesContract,
  getTagsByCategory: getTagsByCategoryContract,
};
