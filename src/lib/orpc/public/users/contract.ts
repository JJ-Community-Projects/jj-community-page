import { oc } from '@orpc/contract'
import { UserProfileDataSchema } from '../schemas/users.ts'
import { UserSlugInputSchema } from '../schemas/common.ts'

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

export const usersContracts = {
  getUserFullProfileBySlugContract,
}
