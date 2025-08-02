import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {handleUnauthorized} from "../../utils.ts";
import {UserTagServiceWithUser} from "../../../lib/db/services/users/tags/UserTagServiceWithUser.ts";

/**
 * Adds a tag to the user's profile.
 * Input: An object containing:
 *   - tag (string) - The tag to add
 *   - label (string, optional) - The display label for the tag
 * Action: Adds the specified tag to the UserDO.
 * Returns: An object with a success flag.
 */
export const addTag = defineAction({
  input: z.object({
    tag: z.string(),
    label: z.string().optional()
  }),
  handler: async ({tag, label}, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    try {
      const userTagService = UserTagServiceWithUser.action(context, userId);
      await userTagService.addTag({
        tag,
        label: label || tag
      }, userId);

      return {success: true};
    } catch (error) {
      console.error('Failed to add tag:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add tag'
      });
    }
  }
});

/**
 * Removes a tag from the user's profile.
 * Input: An object containing:
 *   - tag (string) - The tag to remove
 * Action: Removes the specified tag from the UserDO.
 * Returns: An object with a success flag.
 */
export const removeTag = defineAction({
  input: z.object({
    tag: z.string()
  }),
  handler: async ({tag}, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    try {
      const userTagService = UserTagServiceWithUser.action(context, userId);
      await userTagService.removeTag(tag, userId);
      console.log('Tag removed successfully:', tag);

      return {success: true};
    } catch (error) {
      console.error('Error removing tag:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove tag'
      });
    }
  }
});
