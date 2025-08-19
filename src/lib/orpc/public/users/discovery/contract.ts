import {oc} from '@orpc/contract'
import {z} from 'zod';
import {UserDisplaySchema} from "../../../schemas/users.ts";

const UserIdSchema = z.number().int().positive();

// Search by username using userDisplayView for comprehensive user data
export const searchByUsernameDisplayContract = oc
  .input(z.object({
    limit: z.number().min(1).max(10).default(5),
    searchTerm: z.string().min(1, 'Search term must not be empty')
  }))
  .output(z.array(UserDisplaySchema));

export const searchByUsernameContract = oc
  .input(z.object({
    limit: z.number().min(1).max(10).default(5),
    searchTerm: z.string().min(1, 'Search term must not be empty')
  }))
  .output(z.array(z.object({
    userId: z.number(),
    tiltifyUsername: z.string().nullable(),
    twitchUsername: z.string().nullable()
  })));

export const searchSimilarUsersDisplayContract = oc
  .input(z.object({
    userId: UserIdSchema,
    limit: z.number().min(1).max(10).default(5),
  }))
  .output(z.array(UserDisplaySchema));

export const discoveryContract = {
  byUsernameDisplay: searchByUsernameDisplayContract,
  searchByUsername: searchByUsernameContract,
  searchSimilarUsersDisplay: searchSimilarUsersDisplayContract,
}
