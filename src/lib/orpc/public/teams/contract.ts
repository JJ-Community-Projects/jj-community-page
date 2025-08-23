import {oc} from '@orpc/contract';
import {z} from "zod/v4";
import {TeamMembersOutputSchema, TeamSchema, TeamsListInputSchema, TeamSlugInputSchema, TeamSlugWithYearInputSchema, TeamNextStreamsInputSchema} from "../schemas/teams.ts";
import {SchedulesListSchema, StreamSchema, FullScheduleSchema} from "../schemas/schedules.ts";

/**
 * Public teams contracts for retrieving team information without authentication.
 * These endpoints handle read-only operations for visible teams and their members.
 */


/**
 * Find all visible teams with optional member counts
 * @path /teams
 * @description Retrieve all publicly visible teams. Use ?includeMemberCount=true to include member statistics.
 * @Input TeamsListInputSchema - contains optional includeMemberCount parameter (boolean)
 * @Output array of TeamSchema objects containing visible teams (with member counts if requested)
 */
const findVisibleTeamsContract = oc
  .input(TeamsListInputSchema)
  .output(z.array(TeamSchema))
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
  .output(TeamSchema)
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
 * Get all primary schedules of team members for a given year
 * @path /teams/{slug}/schedules/{year}
 * @description Retrieve all primary schedules from team members for a specific year
 * @Input TeamSlugWithYearInputSchema - contains slug (string) and year (number) to identify the team and year
 * @Output SchedulesListSchema array containing all primary schedules of team members for the specified year
 */
const getTeamSchedulesByYearContract = oc
  .input(TeamSlugWithYearInputSchema)
  .output(SchedulesListSchema)
  .route({
    path: '/teams/{slug}/schedules/{year}',
    method: 'GET',
    operationId: 'getTeamSchedulesByYear',
    summary: 'Get team member schedules by year',
    description: 'Retrieve all primary schedules from team members for a specific year',
    tags: ['teams'],
    successDescription: 'Team member schedules retrieved successfully',
    deprecated: false
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

/**
 * Get team's full schedule for a given year
 * @path /teams/{slug}/full-schedule/{year}
 * @description Retrieve complete schedule information with all streams from all team members' primary schedules for a specific year
 * @Input TeamSlugWithYearInputSchema - contains slug (string) and year (number) to identify the team and year
 * @Output FullScheduleSchema object containing complete aggregated schedule information with all streams, participants, and organized data
 */
const getTeamFullScheduleByYearContract = oc
  .input(TeamSlugWithYearInputSchema)
  .output(FullScheduleSchema)
  .route({
    path: '/teams/{slug}/full-schedule/{year}',
    method: 'GET',
    operationId: 'getTeamFullScheduleByYear',
    summary: 'Get team full schedule by year',
    description: 'Retrieve complete schedule information with all streams from all team members primary schedules for a specific year',
    tags: ['teams'],
    successDescription: 'Team full schedule retrieved successfully',
    deprecated: false
  });


export const publicTeamsContract = {
  findVisibleTeamsContract,
  getBySlugContract,
  getMembersContract,
  getTeamSchedulesByYearContract,
  getTeamNextStreamsContract,
  getTeamFullScheduleByYearContract,
};
