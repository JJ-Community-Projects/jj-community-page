import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {TeamRepo} from "../../../lib/db/repos/TeamRepo.ts";
import {useRpcTeamDO, useRpcUserDO} from "../../getDO.ts";

/**
 * Removes an invitation to a team.
 * Input: An object containing:
 *   - invitedUserId (number) - The ID of the user whose invitation is being removed
 *   - teamId (number) - The ID of the team
 * Action: Verifies the authenticated user is the team owner, removes the invitation from the database, and updates both TeamDO and UserDO.
 * Returns: An object with a success flag.
 */
export const removeInvite = defineAction({
  input: z.object({
    invitedUserId: z.number(),
    teamId: z.number(),
  }),
  handler: async ({invitedUserId, teamId}, ctx) => {
    const {user, session} = ctx.locals;
    if (!user || !session) {
      throw new ActionError({code: 'UNAUTHORIZED'})
    }

    const teams = TeamRepo.action(ctx);

    // Check if team exists and user is the owner
    const team = await teams.findById(teamId);

    if (!team) {
      throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
    }

    // Ensure only team owners can remove invites
    if (team.ownerId !== user.id) {
      throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can remove invites'})
    }

    // Check if invite exists
    const hasInvite = await teams.hasInvite(teamId, invitedUserId);

    if (!hasInvite) {
      throw new ActionError({code: 'NOT_FOUND', message: 'Invite not found'})
    }

    // Delete invite from TeamDO
    await useRpcTeamDO(ctx, teamId, async (rpc) => {
      await rpc.deleteInvite(invitedUserId);
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });

    // Update UserDO state
    await useRpcUserDO(ctx, invitedUserId, async (rpc) => {
      await rpc.rejectInvite(teamId);
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });
    return {success: true}
  }
});

/**
 * Accepts an invitation to join a team.
 * Input: teamId (number) - The ID of the team whose invitation is being accepted
 * Action: Verifies the authenticated user has an invitation, adds them as a team member, and updates both TeamDO and UserDO.
 * Returns: An object with a success flag.
 */
export const acceptInvite = defineAction({
  input: z.number(),
  handler: async (teamId, ctx) => {
    const {user, session} = ctx.locals;
    if (!user || !session) {
      throw new ActionError({code: 'UNAUTHORIZED'})
    }

    const teams = TeamRepo.action(ctx);

    // Check if team exists
    const team = await teams.findById(teamId);

    if (!team) {
      throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
    }

    // Check if user has an invite
    const hasInvite = await teams.hasInvite(teamId, user.id);

    if (!hasInvite) {
      throw new ActionError({code: 'NOT_FOUND', message: 'Invite not found'})
    }

    await useRpcTeamDO(ctx, teamId, async (rpc) => {
      await rpc.acceptInvite(user.id, user.tiltifyName)
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    })

    await useRpcUserDO(ctx, user.id, async (rpc) => {
      await rpc.acceptInvite({
        id: team.id,
        name: team.name,
        slug: team.slug,
        ownerId: team.ownerId,
      })
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    })

    return {success: true}
  }
});

/**
 * Rejects an invitation to join a team.
 * Input: teamId (number) - The ID of the team whose invitation is being rejected
 * Action: Verifies the authenticated user has an invitation, removes the invitation from the database, and updates both TeamDO and UserDO.
 * Returns: An object with a success flag.
 */
export const rejectInvite = defineAction({
  input: z.number(),
  handler: async (teamId, ctx) => {
    const {user, session} = ctx.locals;
    if (!user || !session) {
      throw new ActionError({code: 'UNAUTHORIZED'})
    }

    const teams = TeamRepo.action(ctx);

    // Check if team exists
    const team = await teams.findById(teamId);

    if (!team) {
      throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
    }

    // Check if user has an invite
    const hasInvite = await teams.hasInvite(teamId, user.id);

    if (!hasInvite) {
      throw new ActionError({code: 'NOT_FOUND', message: 'Invite not found'})
    }

    await useRpcTeamDO(ctx, teamId, async (rpc) => {
      await rpc.deleteInvite(user.id)
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    })

    await useRpcUserDO(ctx, user.id, async (rpc) => {
      await rpc.rejectInvite(teamId)
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    })

    return {success: true}
  }
});
