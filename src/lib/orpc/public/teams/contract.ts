import {oc} from '@orpc/contract';
import {z} from 'zod';
import {TeamSchema} from "../schemas/teams.ts";
import {UserDisplaySchema} from "../schemas/users.ts";

/**
 * Public teams contracts for retrieving team information without authentication.
 * These endpoints handle read-only operations for visible teams and their members.
 */



// Team with member count schema
const teamWithMemberCountSchema = TeamSchema.extend({
  memberCount: z.number()
});

// Team with owner info schema
const teamWithOwnerSchema = TeamSchema.extend({
  ownerName: z.string(),
  ownerTiltifyName: z.string()
});


/**
 * Find all visible teams
 * Input: none
 * Output: array of visible teams
 */
const findVisibleContract = oc
  .output(z.array(TeamSchema));

/**
 * Find all visible teams with member count
 * Input: none
 * Output: array of visible teams with member counts
 */
const findAllVisibleWithMemberCountContract = oc
  .output(z.array(teamWithMemberCountSchema));

/**
 * Get team by slug (public team viewing)
 * Input: slug (string)
 * Output: team with owner info or null
 */
const getBySlugContract = oc
  .input(z.object({
    slug: z.string().min(1, "Team slug is required")
  }))
  .output(z.object({
    team: teamWithOwnerSchema.nullable()
  }));

/**
 * Get team members by team ID (public member listing)
 * Input: teamId (number)
 * Output: array of team members
 */
const getMembersContract = oc
  .input(z.object({
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(z.object({
    members: z.array(UserDisplaySchema)
  }));


const getTeamSchedulesContract = oc
  .input(z.object({
    slug: z.string().min(1, "Team slug is required")
  }))
  .output(z.array(z.object({})));

export const publicTeamsContract = {
  findVisible: findVisibleContract,
  findAllVisibleWithMemberCount: findAllVisibleWithMemberCountContract,
  getBySlug: getBySlugContract,
  getMembers: getMembersContract
};
