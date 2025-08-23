import {oc} from "@orpc/contract";
import {UserTeamsResponseSchema} from "../../schemas/teams.ts";
import {UserSlugInputSchema} from "../../schemas/common.ts";


/**
 * Get teams by user ID
 * @path /users/{userId}/teams
 * @description This includes teams where the user is either a regular member or owner
 * @Input UserIdInputSchema - contains userId (string) to identify the user
 * @Output UserTeamsResponseSchema object containing array of teams that the user is a member of
 */
export const getTeamsByUserSlugContract = oc
  .input(UserSlugInputSchema)
  .output(UserTeamsResponseSchema)
  .route({
    path: '/users/{slug}/teams',
    method: 'GET',
    operationId: 'getTeamsByUserId',
    summary: 'Get user\'s teams',
    description: 'Retrieve all teams that a specific user is a member of',
    tags: ['users'],
    successDescription: 'User teams retrieved successfully',
    deprecated: false
  })


export const usersTeamsContracts = {
   getTeamsByUserSlugContract
}
