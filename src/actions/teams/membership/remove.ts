import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {useRpcTeamDO, useRpcUserDO} from "../../getDO.ts";
import {TeamRepo} from "../../../lib/db/repos/team/TeamRepo.ts";

/**
 * Allows a team owner to remove a user from their team.
 * Input: An object containing:
 *   - userId (number) - The ID of the user to remove
 *   - teamId (number) - The ID of the team
 * Action: Verifies the authenticated user is the team owner, removes the specified user from the team, and updates both TeamDO and UserDO.
 * Returns: An object with a success flag.
 */
export const removeUser = defineAction({
  input: z.object({
    userId: z.number(),
    teamId: z.number(),
  }),
  handler: async ({userId, teamId}, ctx) => {
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

    // Ensure only team owners can remove users
    if (team.ownerId !== user.id) {
      throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can remove users'})
    }

    // Prevent team owner from removing themselves
    if (userId === user.id) {
      throw new ActionError({code: 'FORBIDDEN', message: 'Team owner cannot remove themselves from the team'})
    }

    // Remove user from team in TeamDO
    await useRpcTeamDO(ctx, teamId, async (rpc) => {
      await rpc.deleteTeamMember(userId);
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });

    // Update UserDO state
    await useRpcUserDO(ctx, userId, async (rpc) => {
      await rpc.removedFromTeam(teamId);
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });
    return {success: true}
  }
});
