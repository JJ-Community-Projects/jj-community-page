import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {createSlug} from "../../../functions/slug.ts";
import {useRpcTeamDO, useRpcUserDO} from "../../getDO.ts";
import {TeamRepo} from "../../../lib/db/repos/team/TeamRepo.ts";

/**
 * Creates a new team with the authenticated user as owner.
 * Input: An object containing:
 *   - name (string) - The name of the team
 *   - slug (string) - The slug for the team URL
 * Action: Creates a team in the database, initializes the TeamDO, and adds the creator as a member.
 * Returns: The ID of the created team.
 */
export const create = defineAction({
  input: z.object({
    name: z.string(),
    slug: z.string(),
  }),
  handler: async ({name, slug}, ctx) => {
    const {user, session} = ctx.locals;
    if (!user || !session) {
      throw new ActionError({code: 'UNAUTHORIZED'})
    }
    if (!slug) {
      throw new ActionError({code: 'BAD_REQUEST', message: 'slug is required'})
    }
    if (!name) {
      throw new ActionError({code: 'BAD_REQUEST', message: 'name is required'})
    }

    // Create a proper slug using the createSlug function
    slug = createSlug(slug);

    if (!slug) {
      throw new ActionError({code: 'BAD_REQUEST', message: 'Invalid slug'})
    }

    const teams = TeamRepo.action(ctx);

    // Check if slug is available
    const existingTeam = await teams.findBySlug(slug);
    if (existingTeam) {
      throw new ActionError({code: 'BAD_REQUEST', message: 'slug is used'})
    }

    // Create team in database
    const team = await teams.create({
      name: name,
      slug: slug,
      ownerId: user.id,
    });

    // Initialize TeamDO and add creator as a member
    await useRpcTeamDO(ctx, team.id, async (rpc) => {
      rpc.setTeam(team);
      // Add team creator as a member
      await rpc.addTeamMember(user.id, user.tiltifyName);
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });

    // Initialize UserDO and update user's team memberships
    await useRpcUserDO(ctx, user.id, async (rpc) => {
      // Add team to user's memberships
      await rpc.addTeam({
        id: team.id,
        name: team.name,
        slug: team.slug,
        ownerId: team.ownerId,
      });
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });

    return team.id
  }
});
