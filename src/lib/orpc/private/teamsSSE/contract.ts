import {z} from "zod";
import {UserDisplaySchema} from "../../schemas/users.ts";
import {TeamSchema} from "../../public/schemas/teams.ts";
import {eventIterator, oc} from "@orpc/contract";

/**
 * Real-time stream of team invites (owner only)
 * Streams live updates when team invitations are created or deleted
 * Input: team ID
 * Output: server-sent events with array of UserDisplaySchema
 */
const getTeamInvitesSSEContract = oc.input(z.object({
  teamId: z.number().positive("Team ID must be positive")
}))
  .output(eventIterator(z.object({
    invites: UserDisplaySchema.array(),
    event: z.string(),
  })))

/**
 * Real-time stream of team members (owner only)
 * Streams live updates when team members are added or removed
 * Input: team ID
 * Output: server-sent events with array of UserDisplaySchema
 */
const getTeamMembersSSEContract = oc
  .input(z.object({
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(eventIterator(z.object({
    invites: UserDisplaySchema.array(),
    event: z.string(),
  })))

/**
 * Real-time stream of user invites (authenticated user)
 * Streams live updates of pending team invitations for the authenticated user
 * No input required - uses authenticated user ID from context
 * Output: server-sent events with array of invite details
 */
const getUserInvitesSSEContract = oc
  .output(eventIterator(z.object({
    invites: z.array(z.object({
      teamId: z.number(),
      name: z.string()
    })),
    event: z.string(),
  })));

/**
 * Real-time stream of user owned teams (authenticated user - admin access)
 * Streams live updates of teams the authenticated user owns
 * No input required - uses authenticated user ID from context
 * Output: server-sent events with array of owned TeamSchema
 */
const getUserTeamsAdminSSEContract = oc
  .output(eventIterator(z.object({
    teams: TeamSchema.array(), // Only owned teams
    event: z.string()
  })))

/**
 * Real-time stream of user member teams (authenticated user - member access)
 * Streams live updates of teams the authenticated user is a member of (not owner)
 * No input required - uses authenticated user ID from context
 * Output: server-sent events with array of member TeamSchema
 */
const getUserTeamsSSEContract = oc
  .output(eventIterator(z.object({
    teams: TeamSchema.array(), // Only member teams
    event: z.string()
  })))


export const privateTeamsSSEContract = {
  /// Team SSE Endpoints
  getTeamInvitesSSEContract,
  getTeamMembersSSEContract,
  getUserInvitesSSEContract,
  getUserTeamsSSEContract,
  getUserTeamsAdminSSEContract
};
