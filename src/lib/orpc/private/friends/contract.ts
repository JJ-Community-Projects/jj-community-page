import {oc} from '@orpc/contract'
import {z} from 'zod';
import {SuccessSchema, UserIdSchema} from "../../schemas/common.ts";
import {UserDisplaySchema} from "../../schemas/users.ts";

// Send friend request contract
export const sendFriendRequestContract = oc
  .input(z.object({
    toUserId: UserIdSchema
  }))
  .output(SuccessSchema);

// Accept friend request contract
export const acceptFriendRequestContract = oc
  .input(z.object({
    fromUserId: UserIdSchema
  }))
  .output(SuccessSchema);

// Decline friend request contract
export const declineFriendRequestContract = oc
  .input(z.object({
    fromUserId: UserIdSchema
  }))
  .output(SuccessSchema);

// Remove friend contract (unfriend)
export const removeFriendContract = oc
  .input(z.object({
    friendUserId: UserIdSchema
  }))
  .output(SuccessSchema);

/**
 * Get all friends for the authenticated user
 * Uses authMiddleware to access user ID from context
 */
export const getFriendsContract = oc
  .output(UserDisplaySchema.array())

export const friendsContract = {
  getFriendsContract,
  sendFriendRequestContract,
  acceptFriendRequestContract,
  declineFriendRequestContract,
  removeFriendContract,
};
