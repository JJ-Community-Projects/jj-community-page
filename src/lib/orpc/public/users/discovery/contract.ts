import { oc } from '@orpc/contract'
import { z } from 'zod/v4'
import {
  BasicUserSearchOutputSchema,
  SimilarUsersInputSchema,
  UserSearchInputSchema,
} from '../../schemas/users.ts'
import { UserDisplaySchema } from '../../schemas/UserDisplaySchema.ts'

// Search by username using userDisplayView for comprehensive user data
export const searchByUsernameDisplayContract = oc
  .input(UserSearchInputSchema)
  .output(z.array(UserDisplaySchema))
  .route({
    path: '/users/search',
    method: 'GET',
    operationId: 'searchUsersByUsernameDisplay',
    summary: 'Search users by username (display)',
    description:
      'Search for users by username with comprehensive display data (use ?format=display query parameter)',
    tags: ['user-discovery'],
    successDescription: 'User search results retrieved successfully',
    deprecated: false,
  })

export const searchByUsernameContract = oc
  .input(UserSearchInputSchema)
  .output(z.array(BasicUserSearchOutputSchema))
  .route({
    path: '/users/search/basic',
    method: 'GET',
    operationId: 'searchUsersByUsername',
    summary: 'Search users by username (basic)',
    description: 'Basic username search returning essential user identifiers',
    tags: ['user-discovery'],
    successDescription: 'User search results retrieved successfully',
    deprecated: false,
  })

export const searchSimilarUsersDisplayContract = oc
  .input(SimilarUsersInputSchema)
  .output(
    z.array(
      UserDisplaySchema.extend({
        sharedTags: z.number(),
        jaccard: z.number(),
      }),
    ),
  )
  .route({
    path: '/users/{userId}/similar',
    method: 'GET',
    operationId: 'searchSimilarUsers',
    summary: 'Find similar users',
    description:
      'Discover users with similar profiles or interests based on user ID',
    tags: ['user-discovery'],
    successDescription: 'Similar users retrieved successfully',
    deprecated: false,
  })

export const discoveryContract = {
  byUsernameDisplay: searchByUsernameDisplayContract,
  searchByUsername: searchByUsernameContract,
  searchSimilarUsersDisplay: searchSimilarUsersDisplayContract,
}
