import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {TeamRepo} from "../../../lib/db/repos/team/TeamRepo.ts";

/**
 * Retrieves all teams a user is a member of given a tiltify username.
 * Input: tiltifyUsername (string) - The tiltify username to find teams for
 * Action: Uses the TeamRepo to find all teams the user is a member of.
 * Returns: An array of teams the user is a member of.
 */
export const getTeamsByTiltifyUsername = defineAction({
  input: z.string(),
  handler: async (tiltifyUsername, ctx) => {
    try {
      const teamsRepo = TeamRepo.action(ctx);
      const teams = await teamsRepo.findVisibleByTiltifyUsername(tiltifyUsername);

      return {teams};
    } catch (e: any) {
      console.error('Error getting teams by tiltify username:', e);
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message});
    }
  }
});

/**
 * Retrieves all visible teams.
 * Input: None
 * Action: Uses the TeamRepo to find all visible teams.
 * Returns: An array of visible teams.
 */
export const findVisible = defineAction({
  handler: (_, ctx) => {
    const repo = TeamRepo.action(ctx);
    return repo.findVisible()
  }
});

/**
 * Retrieves all visible teams with their member counts.
 * Input: None
 * Action: Uses the TeamRepo to find all visible teams with their member counts.
 * Returns: An array of visible teams with their member counts.
 */
export const findAllVisibleWithMemberCount = defineAction({
  handler: (_, ctx) => {
    const repo = TeamRepo.action(ctx);
    return repo.findAllVisibleWithMemberCount()
  }
});
