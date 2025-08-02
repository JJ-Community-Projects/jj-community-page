import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {useRpcTeamDO, useRpcUserDO} from "../../getDO.ts";
import {TeamRepo} from "../../../lib/db/repos/team/TeamRepo.ts";
import {UserRepo} from "../../../lib/db/repos/user/UserRepo.ts";

/**
 * Invites a user to join a team.
 * Input: An object containing:
 *   - invitedUserId (number) - The ID of the user to invite
 *   - teamId (number) - The ID of the team
 * Action: Verifies the authenticated user is the team owner, creates an invitation in the database, and updates both TeamDO and UserDO.
 * Returns: An object with a success flag.
 */
export const invite = defineAction({
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
    const users = UserRepo.action(ctx);

    // Check if team exists and user is the owner
    const team = await teams.findById(teamId);

    if (!team) {
      throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
    }

    // Ensure only team owners can invite people
    if (team.ownerId !== user.id) {
      throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can invite users'})
    }

    console.log('invitedUserId', invitedUserId)

    const userToInvite = await users.getAccountByProvider(invitedUserId, 'tiltify')

    console.log('userToInvite', userToInvite)

    if (!userToInvite) {
      console.error('Error initializing UserToInvite:', 'user not found');
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: 'user not found'})
    }

    // Add invite to TeamDO
    await useRpcTeamDO(ctx, teamId, async (rpc) => {
      await rpc.addInvite(invitedUserId, userToInvite.providerUsername);
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });

    // Add invite to UserDO
    await useRpcUserDO(ctx, invitedUserId, async (rpc) => {
      await rpc.addInvite({
        id: team.id,
        name: team.name,
        slug: team.slug,
        ownerId: team.ownerId,
      });
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });
    return {success: true}
  }
});
