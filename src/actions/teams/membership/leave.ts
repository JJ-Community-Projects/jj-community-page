import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {useRpcTeamDO, useRpcUserDO} from "../../getDO.ts";
import {TeamRepo} from "../../../lib/db/repos/team/TeamRepo.ts";

/**
 * Allows a team member to leave a team.
 * Input: teamId (number) - The ID of the team to leave
 * Action: Verifies the user is not the team owner, removes them from the team in the database, and updates both TeamDO and UserDO.
 * Returns: An object with a success flag.
 */
export const leaveTeam = defineAction({
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

    // Prevent team owner from leaving their own team
    if (team.ownerId === user.id) {
      throw new ActionError({
        code: 'FORBIDDEN',
        message: 'Team owner cannot leave their own team. Transfer ownership or delete the team instead.'
      })
    }

    // Remove user from team in TeamDO
    await useRpcTeamDO(ctx, teamId, async (rpc) => {
      await rpc.userLeaveTeam(user.id);
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });

    // Update UserDO state
    await useRpcUserDO(ctx, user.id, async (rpc) => {
      await rpc.leaveTeam(teamId);
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });
    return {success: true}
  }
});
