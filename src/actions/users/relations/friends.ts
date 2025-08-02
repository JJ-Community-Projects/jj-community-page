import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {handleUnauthorized} from "../../utils.ts";
import {UserRelationServiceWithUser} from "../../../lib/db/services/users/relations/UserRelationServiceWithUser.ts";

/**
 * Sends a friend request to another user.
 * Input: userId (number) - The ID of the user to send the request to
 * Action: Creates a friend request in the database.
 * Returns: An object with a success flag.
 */
export const sendFriendRequest = defineAction({
  input: z.number(),
  handler: async (toUserId, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserRelationServiceWithUser
    const relationService = UserRelationServiceWithUser.action(context, userId);
    try {
      await relationService.sendFriendRequest(toUserId);
      return {success: true};
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to send friend request'
      });
    }
  }
});

/**
 * Accepts a friend request from another user.
 * Input: userId (number) - The ID of the user who sent the request
 * Action: Updates the friend request status and creates a friendship in the database.
 * Returns: An object with a success flag.
 */
export const acceptFriendRequest = defineAction({
  input: z.number(),
  handler: async (fromUserId, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserRelationServiceWithUser
    const relationService = UserRelationServiceWithUser.action(context, userId);
    try {
      await relationService.acceptFriendRequest(fromUserId);
      return {success: true};
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to accept friend request'
      });
    }
  }
});

/**
 * Rejects a friend request from another user.
 * Input: userId (number) - The ID of the user who sent the request
 * Action: Updates the friend request status in the database.
 * Returns: An object with a success flag.
 */
export const rejectFriendRequest = defineAction({
  input: z.number(),
  handler: async (fromUserId, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserRelationServiceWithUser
    const relationService = UserRelationServiceWithUser.action(context, userId);
    try {
      await relationService.rejectFriendRequest(fromUserId);
      return {success: true};
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to reject friend request'
      });
    }
  }
});

/**
 * Removes a friendship with another user.
 * Input: userId (number) - The ID of the user to remove from friends
 * Action: Removes the friendship from the database.
 * Returns: An object with a success flag.
 */
export const removeFriendship = defineAction({
  input: z.number(),
  handler: async (otherUserId, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserRelationServiceWithUser
    const relationService = UserRelationServiceWithUser.action(context, userId);
    try {
      await relationService.removeFriendship(otherUserId);
      return {success: true};
    } catch (error) {
      console.error('Error removing friendship:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove friendship'
      });
    }
  }
});

/**
 * Gets the user's friends.
 * Input: None
 * Action: Retrieves the user's friends from the database.
 * Returns: An array of user objects.
 */
export const getFriends = defineAction({
  handler: async (_, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserRelationServiceWithUser
    const relationService = UserRelationServiceWithUser.action(context, userId);
    try {
      return await relationService.getFriends();
    } catch (error) {
      console.error('Error getting friends:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get friends'
      });
    }
  }
});

/**
 * Gets users who have sent friend requests to the user.
 * Input: None
 * Action: Retrieves incoming friend requests from the database.
 * Returns: An array of user objects.
 */
export const getIncomingRequests = defineAction({
  handler: async (_, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserRelationServiceWithUser
    const relationService = UserRelationServiceWithUser.action(context, userId);
    try {
      return await relationService.getIncomingRequestUsers();
    } catch (error) {
      console.error('Error getting incoming friend requests:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get incoming friend requests'
      });
    }
  }
});

/**
 * Gets users to whom the user has sent friend requests.
 * Input: None
 * Action: Retrieves outgoing friend requests from the database.
 * Returns: An array of user objects.
 */
export const getOutgoingRequests = defineAction({
  handler: async (_, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserRelationServiceWithUser
    const relationService = UserRelationServiceWithUser.action(context, userId);
    try {
      return await relationService.getOutgoingRequestUsers();
    } catch (error) {
      console.error('Error getting outgoing friend requests:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get outgoing friend requests'
      });
    }
  }
});
