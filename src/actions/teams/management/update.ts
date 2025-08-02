import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {useRpcTeamDO} from "../../getDO.ts";
import {TeamRepo} from "../../../lib/db/repos/team/TeamRepo.ts";

/**
 * Updates an existing team's information.
 * Input: An object containing:
 *   - id (number) - The ID of the team to update
 *   - name (string) - The new name for the team
 *   - slug (string) - The new slug for the team URL
 *   - visible (boolean, optional) - Whether the team should be visible
 * Action: Verifies the user is the team owner and updates the team information in the database and TeamDO.
 * Returns: The updated team object.
 */
export const update = defineAction({
  input: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    visible: z.boolean().optional(),
  }),
  handler: async ({id, name, slug, visible}, ctx) => {
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

    const teams = TeamRepo.action(ctx);

    // Check if team exists and user is the owner
    const team = await teams.findById(id);

    if (!team) {
      throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
    }

    // Ensure only team owners can update teams
    if (team.ownerId !== user.id) {
      throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can update teams'})
    }

    // Check if slug is available (if it's changed)
    if (slug !== team.slug) {
      const existingTeam = await teams.findBySlug(slug);
      if (existingTeam) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'slug is already in use'})
      }
    }

    // Update team in database
    const updatedTeam = await teams.update(id, {
      name: name,
      slug: slug,
      ...(visible !== undefined && {visible}),
    });

    // Update TeamDO
    await useRpcTeamDO(ctx, id, async (rpc) => {
      await rpc.updateTeam({
        name: name,
        slug: slug,
        ...(visible !== undefined && {visible}),
      });
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });

    return updatedTeam
  }
});
