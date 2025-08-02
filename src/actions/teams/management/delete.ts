import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {useRpcTeamDO, useRpcUserDO} from "../../getDO.ts";
import {TeamRepo} from "../../../lib/db/repos/team/TeamRepo.ts";

/**
 * Deletes a team owned by the authenticated user.
 * Input: teamId (number) - The ID of the team to delete
 * Action: Verifies the user is the team owner, deletes the team from the database, and updates all team members' UserDOs.
 * Returns: An object with a success flag.
 */
export const deleteTeam = defineAction({
  input: z.number(),
  handler: async (teamId, ctx) => {
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

    // Ensure only team owners can delete teams
    if (team.ownerId !== user.id) {
      throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can delete teams'})
    }

    // Get all team members from the database
    const members = await teams.getTeamMembers(teamId);
    const memberIds = members.map(member => member.userId);

    // Delete team in TeamDO
    await useRpcTeamDO(ctx, teamId, async (rpc) => {
      await rpc.deleteTeam();
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });

    // Update UserDO for each team member
    if (memberIds.length > 0) {
      for (const memberId of memberIds) {
        await useRpcUserDO(ctx, memberId, async (rpc) => {
          await rpc.teamDeleted(teamId);
        }, (error) => {
          throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
        });
      }
    }

    return {success: true}
  }
});
