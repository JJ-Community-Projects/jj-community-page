import {oc} from '@orpc/contract';
import {z} from "zod/v4";
import {
  TeamMembersOutputSchema,
  TeamNextStreamsInputSchema,
  TeamSchema,
  TeamsListInputSchema,
  TeamSlugInputSchema,
  TeamWithMemberCountSchema
} from "../schemas/teams.ts";
import {StreamSchema} from "../schemas/schedules.ts";

/**
 * Public teams contracts for retrieving team information without authentication.
 * These endpoints handle read-only operations for visible teams and their members.
 */


/**
 * Find all visible teams with member counts
 * @path /teams
 * @description Retrieve all publicly visible teams with member count statistics included.
 * @Input TeamsListInputSchema - contains optional includeMemberCount parameter (boolean)
 * @Output array of TeamWithMemberCountSchema objects containing visible teams with member counts
 */
const findVisibleTeamsContract = oc
  .input(TeamsListInputSchema)
  .output(z.array(TeamWithMemberCountSchema))
  .route({
    path: '/teams',
    method: 'GET',
    operationId: 'findVisibleTeams',
    summary: 'Find visible teams',
    description: 'Retrieve all publicly visible teams. Use ?includeMemberCount=true to include member statistics.',
    tags: ['teams'],
    successDescription: 'Visible teams retrieved successfully',
    deprecated: false
  });

/**
 * Get team by slug (public team viewing)
 * @path /teams/{slug}
 * @description Retrieve detailed team information including owner data by slug
 * @Input TeamSlugInputSchema - contains slug (string) to identify the team
 * @Output TeamSchema object containing team information with owner info or null
 */
const getBySlugContract = oc
  .input(TeamSlugInputSchema)
  .output(TeamWithMemberCountSchema)
  .route({
    path: '/teams/{slug}',
    method: 'GET',
    operationId: 'getTeamBySlug',
    summary: 'Get team by slug',
    description: 'Retrieve detailed team information including owner data by slug',
    tags: ['teams'],
    successDescription: 'Team information retrieved successfully',
    deprecated: false
  });

/**
 * Get team members by team ID (public member listing)
 * @path /teams/{slug}/members
 * @description Retrieve list of team members with their display information
 * @Input TeamSlugInputSchema - contains slug (string) to identify the team
 * @Output TeamMembersOutputSchema object containing array of team members
 */
const getMembersContract = oc
  .input(TeamSlugInputSchema)
  .output(TeamMembersOutputSchema)
  .route({
    path: '/teams/{slug}/members',
    method: 'GET',
    operationId: 'getTeamMembers',
    summary: 'Get team members',
    description: 'Retrieve list of team members with their display information',
    tags: ['teams'],
    successDescription: 'Team members retrieved successfully',
    deprecated: false,
  });

/**
 * Get next n streams from all team member schedules
 * @path /teams/{slug}/next-streams/
 * @description Retrieve the next upcoming streams from all team members with optional uniqueness filtering
 * @Input TeamNextStreamsInputSchema - contains slug (string), limit (number, optional, max 50), and unique (boolean, optional)
 * @Output array of StreamSchema objects containing next streams from team member schedules
 */
const getTeamNextStreamsContract = oc
  .input(TeamNextStreamsInputSchema)
  .output(z.array(StreamSchema))
  .route({
    path: '/teams/{slug}/next-streams/',
    method: 'GET',
    operationId: 'getTeamNextStreams',
    summary: 'Get next streams from team members',
    description: 'Retrieve the next upcoming streams from all team members with optional uniqueness filtering',
    tags: ['teams'],
    successDescription: 'Next team member streams retrieved successfully',
    deprecated: false
  });

export const publicTeamsContract = {
  findVisibleTeamsContract,
  getBySlugContract,
  getMembersContract,
  getTeamNextStreamsContract,
};
