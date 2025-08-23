import {oc} from '@orpc/contract'
import {z} from "zod/v4";
import {FindUsersByTagInputSchema, GetUserTagsInputSchema, UserTagSchema, UserWithTagsSchema} from "../schemas/tags.ts";

/**
 * Public oRPC contracts for user tag management
 * These procedures require user authentication and allow users to:
 * - View their own tags
 * - Add/remove tags from their profile
 * - View other users' public tags
 * - Get tag-based user recommendations
 */

// === User Tag Management Contracts ===

/**
 * Get tags for a user (current user if not specified)
 * Returns the user's tags with full tag information
 */
export const getUserTagsContract = oc
  .input(GetUserTagsInputSchema)
  .output(z.array(UserTagSchema))
  .route({
    path: '/users/{userId}/tags',
    method: 'GET',
    operationId: 'getUserTags',
    summary: 'Get user tags',
    description: 'Retrieve tags associated with a user',
    tags: ['user-tags'],
    successDescription: 'User tags retrieved successfully',
    deprecated: false
  });

// === User Discovery by Tags Contracts ===

/**
 * Find users who have a specific tag
 * Useful for discovering users with similar interests
 */
export const findUsersByTagContract = oc
  .input(FindUsersByTagInputSchema)
  .output(z.array(UserWithTagsSchema))
  .route({
    path: '/users',
    method: 'GET',
    operationId: 'findUsersByTag',
    summary: 'Find users by tag',
    description: 'Discover users who have a specific tag (use ?tag={tagSlug} query parameter)',
    tags: ['user-tags'],
    successDescription: 'Users with specified tag retrieved successfully',
    deprecated: false
  });


// === Removed Nice-to-Have Contracts ===
/*
 * The following contracts were removed as they are considered nice-to-have features:
 * - findSimilarUsers: User recommendation based on tag similarity
 * - getUsersInterestedInTag: Interest-based user suggestions
 * - getTagRecommendations: Personalized tag suggestions
 * - getTrendingTagsForUser: Trending analysis for users
 */

/**
 * Export all public user tag management contracts
 */
export const publicUserTagsContract = {
  // Must-have contracts only
  getUserTags: getUserTagsContract,
  findUsersByTag: findUsersByTagContract,
};
