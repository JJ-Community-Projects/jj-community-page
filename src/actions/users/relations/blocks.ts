import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {handleUnauthorized} from "../../utils.ts";
import {UserRelationServiceWithUser} from "../../../lib/db/services/users/relations/UserRelationServiceWithUser.ts";

/**
 * Blocks a user.
 * Input: userId (number) - The ID of the user to block
 * Action: Creates a block in the database.
 * Returns: An object with a success flag.
 */
export const blockUser = defineAction({
  input: z.number(),
  handler: async (blockedUserId, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserRelationServiceWithUser
    const relationService = UserRelationServiceWithUser.action(context, userId);
    try {
      await relationService.blockUser(blockedUserId);
      return {success: true};
    } catch (error) {
      console.error('Error blocking user:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to block user'
      });
    }
  }
});

/**
 * Unblocks a user.
 * Input: userId (number) - The ID of the user to unblock
 * Action: Removes the block from the database.
 * Returns: An object with a success flag.
 */
export const unblockUser = defineAction({
  input: z.number(),
  handler: async (blockedUserId, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserRelationServiceWithUser
    const relationService = UserRelationServiceWithUser.action(context, userId);
    try {
      await relationService.unblockUser(blockedUserId);
      return {success: true};
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to unblock user'
      });
    }
  }
});

/**
 * Gets users blocked by the user.
 * Input: None
 * Action: Retrieves blocked users from the database.
 * Returns: An array of user objects.
 */
export const getBlockedUsers = defineAction({
  handler: async (_, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserRelationServiceWithUser
    const relationService = UserRelationServiceWithUser.action(context, userId);
    try {
      return await relationService.getBlockedUsers();
    } catch (error) {
      console.error('Error getting blocked users:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get blocked users'
      });
    }
  }
});
