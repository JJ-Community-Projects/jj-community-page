import {oc} from '@orpc/contract'
import {z} from "zod/v4";
import {SuccessSchema} from "../schemas/common.ts";
import {UserDisplaySchema, UserIdSchema} from "../schemas/users.ts";

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

// Cancel friend request contract (for requests you sent)
export const cancelFriendRequestContract = oc
  .input(z.object({
    toUserId: UserIdSchema
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
  .output(z.array(UserDisplaySchema))

export const friendsContract = {
  getFriendsContract,
  sendFriendRequestContract,
  acceptFriendRequestContract,
  declineFriendRequestContract,
  cancelFriendRequestContract,
  removeFriendContract,
};
