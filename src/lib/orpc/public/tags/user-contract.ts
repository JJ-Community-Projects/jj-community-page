import {oc} from '@orpc/contract'
import z from "zod";

/**
 * Public oRPC contracts for user tag management
 * These procedures require user authentication and allow users to:
 * - View their own tags
 * - Add/remove tags from their profile
 * - View other users' public tags
 * - Get tag-based user recommendations
 */

// Input validation schemas
const UserIdSchema = z.number().int().positive();
const TagIdSchema = z.number().int().positive();

const GetUserTagsInputSchema = z.object({
  userId: UserIdSchema.optional(), // If not provided, gets current user's tags
});

const FindUsersByTagInputSchema = z.object({
  tagId: TagIdSchema,
  limit: z.number().int().min(1).max(50).default(10),
  excludeCurrentUser: z.boolean().default(true),
});

const GetTagRecommendationsInputSchema = z.object({
  userId: UserIdSchema.optional(), // If not provided, gets recommendations for current user
  limit: z.number().int().min(1).max(20).default(5),
  excludeExistingTags: z.boolean().default(true),
});

// Output schemas
const PublicTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  color: z.string(),
});

const UserTagSchema = z.object({
  userId: z.number(),
  tagId: z.number(),
  addedAt: z.date(),
  tag: PublicTagSchema,
});

const UserWithTagsSchema = z.object({
  userId: z.number(),
  username: z.string(),
  profileImage: z.string().nullable(),
  tags: z.array(PublicTagSchema),
  tagCount: z.number(),
  isFollowing: z.boolean().optional(), // Only included for authenticated requests
});

const TagRecommendationSchema = z.object({
  tag: PublicTagSchema,
  score: z.number().min(0).max(1),
  reason: z.enum(['similar_users', 'popular', 'category_match', 'trending']),
  userCount: z.number(),
});

const BulkUpdateResultSchema = z.object({
  added: z.array(UserTagSchema),
  removed: z.array(z.object({
    tagId: z.number(),
    success: z.boolean(),
  })),
  errors: z.array(z.object({
    tagId: z.number(),
    error: z.string(),
  })),
});

// === User Tag Management Contracts ===

/**
 * Get tags for a user (current user if not specified)
 * Returns the user's tags with full tag information
 */
export const getUserTagsContract = oc
  .input(GetUserTagsInputSchema)
  .output(z.array(UserTagSchema));

// === User Discovery by Tags Contracts ===

/**
 * Find users who have a specific tag
 * Useful for discovering users with similar interests
 */
export const findUsersByTagContract = oc
  .input(FindUsersByTagInputSchema)
  .output(z.array(UserWithTagsSchema));

/**
 * Find users with similar tag profiles
 * Returns users who share multiple tags with the specified user
 */
export const findSimilarUsersContract = oc
  .input(z.object({
    userId: UserIdSchema.optional(), // If not provided, uses current user
    minSharedTags: z.number().int().min(1).max(10).default(2),
    limit: z.number().int().min(1).max(50).default(10),
    excludeCurrentUser: z.boolean().default(true),
  }))
  .output(z.array(z.object({
    user: UserWithTagsSchema,
    sharedTags: z.array(PublicTagSchema),
    sharedTagCount: z.number(),
    similarityScore: z.number().min(0).max(1),
  })));

/**
 * Get users who might be interested in a specific tag
 * Based on their existing tag patterns
 */
export const getUsersInterestedInTagContract = oc
  .input(z.object({
    tagId: TagIdSchema,
    limit: z.number().int().min(1).max(50).default(10),
    excludeExistingUsers: z.boolean().default(true),
  }))
  .output(z.array(z.object({
    user: UserWithTagsSchema,
    interestScore: z.number().min(0).max(1),
    reason: z.string(),
  })));

// === Tag Recommendations Contracts ===

/**
 * Get personalized tag recommendations for a user
 * Based on similar users, popular tags, and user behavior
 */
export const getTagRecommendationsContract = oc
  .input(GetTagRecommendationsInputSchema)
  .output(z.array(TagRecommendationSchema));

/**
 * Get trending tags that the user might be interested in
 * Based on recent tag adoption patterns
 */
export const getTrendingTagsForUserContract = oc
  .input(z.object({
    userId: UserIdSchema.optional(),
    timeRange: z.enum(['24h', '7d', '30d']).default('7d'),
    limit: z.number().int().min(1).max(20).default(5),
    excludeExistingTags: z.boolean().default(true),
  }))
  .output(z.array(z.object({
    tag: PublicTagSchema,
    trendScore: z.number().min(0).max(1),
    newUsers: z.number(),
    growthRate: z.number(),
  })));



/**
 * Export all public user tag management contracts
 */
export const publicUserTagsContract = {
  // User discovery
  findUsersByTag: findUsersByTagContract,
  findSimilarUsers: findSimilarUsersContract,
  getUsersInterestedInTag: getUsersInterestedInTagContract,

  // Recommendations
  getTagRecommendations: getTagRecommendationsContract,
  getTrendingTagsForUser: getTrendingTagsForUserContract,
};
