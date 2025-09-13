import {oc} from '@orpc/contract';
import {z} from "zod/v4";
import {SuccessSchema} from "../schemas/common.ts";
import {UserIdSchema} from "../schemas/users.ts";
import {SlugValidationSchema, TeamIdSchema} from "../schemas/teams.ts";
import {TeamSchema} from "../../public/schemas/teams.ts";
import {UserDisplaySchema} from "../schemas/users.ts";

/**
 * Private teams contracts for authenticated team management operations.
 * These endpoints handle team CRUD, member management, and invite operations.
 */

/**
 * Team CRUD Operations
 */

/**
 * Create a new team
 * Input: name and slug
 * Output: team ID
 */
const createContract = oc
  .input(z.object({
    name: z.string().min(1, "Team name is required").max(100, "Team name must be 100 characters or less"),
    slug: z.string().min(1, "Team slug is required").max(50, "Team slug must be 50 characters or less")
  }))
  .output(TeamIdSchema);

/**
 * Update team information
 * Input: team ID, name, slug, and optional visibility
 * Output: success flag
 */
const updateContract = oc
  .input(z.object({
    teamId: z.number().positive("Team ID must be positive"),
    name: z.string().min(1, "Team name is required").max(100, "Team name must be 100 characters or less"),
    slug: z.string().min(1, "Team slug is required").max(50, "Team slug must be 50 characters or less"),
    visible: z.boolean().optional(),
    description: z.string().max(5000, "Description is too long").nullable().optional()
  }))
  .output(SuccessSchema);

/**
 * Delete a team
 * Input: team ID
 * Output: success flag
 */
const deleteContract = oc
  .input(z.object({
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(SuccessSchema);

/**
 * Validate slug availability
 * Input: slug and optional tiltify name for suggestions
 * Output: validation result with suggestions
 */
const validateSlugContract = oc
  .input(z.object({
    slug: z.string().min(1, "Slug is required"),
    tiltifyName: z.string().optional()
  }))
  .output(SlugValidationSchema);

/**
 * Team Member Operations
 */

/**
 * Leave a team (for non-owners)
 * Input: team ID
 * Output: success flag
 */
const leaveTeamContract = oc
  .input(z.object({
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(SuccessSchema);

/**
 * Remove a member from team (owner only)
 * Input: user ID and team ID
 * Output: success flag
 */
const removeMemberContract = oc
  .input(z.object({
    userId: UserIdSchema,
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(SuccessSchema);

/**
 * Team Invite Operations
 */

/**
 * Create an invite to join team (owner only)
 * Input: invited user ID and team ID
 * Output: success flag
 */
const createInviteContract = oc
  .input(z.object({
    invitedUserId: UserIdSchema,
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(SuccessSchema);

/**
 * Delete an invite (owner only)
 * Input: invited user ID and team ID
 * Output: success flag
 */
const deleteInviteContract = oc
  .input(z.object({
    invitedUserId: z.number().positive("Invited user ID must be positive"),
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(SuccessSchema);

/**
 * Accept an invite to join team
 * Input: team ID
 * Output: success flag
 */
const acceptInviteContract = oc
  .input(z.object({
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(SuccessSchema);

/**
 * Reject an invite to join team
 * Input: team ID
 * Output: success flag
 */
const rejectInviteContract = oc
  .input(z.object({
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(SuccessSchema);

/**
 * Get all teams for the authenticated user (owned or member)
 * Uses authMiddleware to access user ID from context
 */
const getUserTeamsContract = oc
  .output(z.array(TeamSchema))

/**
 * Get all teams where the current user is the owner
 * Uses authMiddleware to access user ID from context
 */
const getOwnedTeamsContract = oc
  .output(z.array(TeamSchema))

/**
 * Get all teams where the current user is not the owner (member only)
 * Uses authMiddleware to access user ID from context
 */
const getNonOwnedTeamsContract = oc
  .output(z.array(TeamSchema))

/**
 * Get all team members as UserDisplaySchema (owner only)
 * Input: team ID
 * Output: array of UserDisplaySchema
 */
const getTeamMembersContract = oc
  .input(z.object({
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(z.array(UserDisplaySchema));

/**
 * Get team member count (owner only)
 * Input: team ID
 * Output: count number
 */
const getTeamMemberCountContract = oc
  .input(z.object({
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(z.object({
    count: z.number()
  }));

/**
 * Get team invite count (owner only)
 * Input: team ID
 * Output: count number
 */
const getTeamInviteCountContract = oc
  .input(z.object({
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(z.object({
    count: z.number()
  }));

/**
 * Get user invite count (authenticated user)
 * Returns the number of pending team invitations for the authenticated user
 * No input required - uses authenticated user ID from context
 * Output: count number
 */
const getUserInviteCountContract = oc
  .output(z.object({
    count: z.number()
  }));

/**
 * Get user invites (authenticated user)
 * Returns detailed information about pending team invitations for the authenticated user
 * No input required - uses authenticated user ID from context
 * Output: array of invite details with team information
 */
const getUserInvitesContract = oc
  .output(z.array(z.object({
    teamId: z.number(),
    name: z.string()
  })));

/**
 * Get all invites for a specific team (owner only)
 * Returns detailed information about all pending invitations for the specified team
 * Input: team ID
 * Output: array of invite details with user information
 */
const getTeamInvitesContract = oc
  .input(z.object({
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(z.array(UserDisplaySchema));

/**
 * Get a specific team by ID
 * Input: team ID
 * Output: team schema
 */
const getTeamByIdContract = oc
  .input(z.object({
    teamId: z.number().positive("Team ID must be positive")
  }))
  .output(TeamSchema);

export const privateTeamsContract = {
  // Team CRUD Operations
  createContract,
  updateContract,
  deleteContract,
  validateSlugContract,

  // Team Member Operations
  leaveTeamContract,
  removeMemberContract,

  // Team Invite Operations
  createInviteContract,
  deleteInviteContract,
  acceptInviteContract,
  rejectInviteContract,

  // Team Query Operations
  getTeamContract: getUserTeamsContract,
  getTeamByIdContract,
  getOwnedTeamsContract,
  getNonOwnedTeamsContract,
  getTeamMembersContract,
  getTeamMemberCountContract,
  getTeamInviteCountContract,
  getTeamInvitesContract,
  getUserInviteCountContract,
  getUserInvitesContract
};
