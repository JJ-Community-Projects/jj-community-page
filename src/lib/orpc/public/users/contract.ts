import {oc} from '@orpc/contract'
import {z} from "zod/v4";
import {
  TwitchChannelSchema,
  UserPaginationOutputSchema,
  UserPaginationSchema,
  UserProfileDataSchema,
} from "../schemas/users.ts";
import {UserDisplaySchema} from "../schemas/UserDisplaySchema.ts";
import {UserSlugInputSchema} from "../schemas/common.ts";

/**
 * Get all users
 * @path /users/all
 * @description Returns complete list of all users without pagination (use with caution for large datasets)
 * @Input none - no input parameters required
 * @Output array of UserDisplaySchema objects containing all registered users
 */
export const getAllUsersContract = oc
  .output(z.array(UserDisplaySchema))
  .route({
    path: '/users-all',
    method: 'GET',
    operationId: 'getAllUsers',
    summary: 'Get all users',
    description: 'Retrieve complete list of all registered users (use with caution)',
    tags: ['users'],
    successDescription: 'Complete user list retrieved successfully',
    deprecated: false
  })
/**
 * Get paginated user list
 * @path /users
 * @description Supports pagination to handle large user datasets efficiently
 * @Input UserPaginationSchema - pagination parameters (page, limit, etc.)
 * @Output array of UserDisplaySchema objects containing basic user display information
 */
export const getAllUsersPagedContract = oc.input(UserPaginationSchema)
  .output(UserPaginationOutputSchema)
  .route({
    path: '/users',
    method: 'GET',
    operationId: 'getAllUsersPaged',
    summary: 'Get paginated user list',
    description: 'Retrieve users with pagination support',
    tags: ['users'],
  })

/**
 * Get user by slug
 * @path /users/{slug}
 * @description Retrieves user data using their human-readable slug identifier
 * @Input UserSlugInputSchema - contains slug (string) to identify the user
 * @Output UserDisplaySchema object with basic user display information
 */
export const getUserBySlugContract = oc.input(UserSlugInputSchema)
  .output(UserDisplaySchema)
  .route({
    path: '/users/{slug}',
    method: 'GET',
    operationId: 'getUserBySlug',
    summary: 'Get user by slug',
    description: 'Retrieve basic user display information using their unique slug identifier',
    tags: ['users'],
    successDescription: 'User display information retrieved successfully',
    deprecated: false
  })

/**
 * Get user profile by slug
 * @path /users/{slug}/full-profile
 * @description Retrieves detailed profile information including bio, stats, and user preferences
 * @Input UserSlugInputSchema - contains slug (string) to identify the user
 * @Output UserProfileDataSchema object with comprehensive user profile data
 */
export const getUserFullProfileBySlugContract = oc.input(UserSlugInputSchema)
  .output(UserProfileDataSchema)
  .route({
    path: '/users/{slug}/profile',
    method: 'GET',
    operationId: 'getUserProfileBySlug',
    summary: 'Get user profile by slug',
    description: 'Retrieve comprehensive user profile data including bio, stats, and preferences',
    tags: ['users'],
    successDescription: 'User profile data retrieved successfully',
    deprecated: false,
  })

/**
 * Get Twitch channel by user slug
 * @path /users/{slug}/twitch-channel
 * @description Retrieves associated Twitch channel information using user slug, returns null if no Twitch account is linked
 * @Input UserSlugInputSchema - contains slug (string) to identify the user
 * @Output TwitchChannelSchema (nullable) - Twitch channel data or null if not linked
 */
export const getTwitchChannelByUserSlugContract = oc.input(UserSlugInputSchema)
  .output(TwitchChannelSchema.optional())
  .route({
    path: '/users/{slug}/twitch',
    method: 'GET',
    operationId: 'getTwitchChannelByUserSlug',
    summary: 'Get Twitch channel by user slug',
    description: 'Retrieve associated Twitch channel information using user slug',
    tags: ['users'],
    successDescription: 'Twitch channel information retrieved successfully',
    deprecated: false
  })

export const usersContracts = {
  // All users
  getAllUsersContract,
  getAllUsersPagedContract,

  // user data by slug
  getUserBySlugContract,
  getUserFullProfileBySlugContract,
  getTwitchChannelByUserSlugContract,
}
