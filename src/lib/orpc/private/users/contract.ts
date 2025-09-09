import {oc} from '@orpc/contract';
import {UserDisplaySchema} from "../schemas/users.ts";
import z from 'zod/v4';

/**
 * Private users contracts for authenticated user operations.
 * These endpoints handle user-specific information and data retrieval.
 */

/**
 * Get current authenticated user information
 * Returns the current user as UserDisplaySchema with role information
 * No input required - uses authenticated user ID from context
 * Output: UserDisplaySchema with role field
 */
const getCurrentUserContract = oc
  .output(UserDisplaySchema);


const isAdminContract = oc.output(z.boolean());

/**
 * Search users by name (authenticated user)
 * @description Searches for users by Tiltify and Twitch usernames using case-insensitive matching
 * @Input object with searchTerm (string) - the search query
 * @Output array of objects with userId, tiltifyUsername, and twitchUsername
 */
const searchByNameContract = oc
  .input(z.object({
    searchTerm: z.string().min(1, "Search term must not be empty").max(100, "Search term too long"),
    includeSelf: z.boolean().default(false)
  }))
  .output(z.array(z.object({
    userId: z.number(),
    tiltifyUsername: z.string().nullable(),
    twitchUsername: z.string().nullable(),
  })));


/**
 * Get relations (friends + team mates) for the authenticated user
 * Output shape exactly:
 * { friends: UserDisplaySchema[]; teamMates: UserDisplaySchema[] }
 */
const getRelationsContract = oc.output(
  z.object({
    friends: z.array(UserDisplaySchema),
    teamMates: z.array(UserDisplaySchema),
  })
);

export const privateUsersContract = {
  getCurrentUserContract,
  isAdminContract,
  searchByNameContract,
  getRelationsContract,
};
