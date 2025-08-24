import {z} from "zod/v4";
import {UserDisplaySchema} from "../schemas/users.ts";
import {eventIterator, oc} from "@orpc/contract";

/**
 * Real-time stream of user friend requests (authenticated user)
 * Streams live updates of pending friend requests for the authenticated user
 * No input required - uses authenticated user ID from context
 * Output: server-sent events with array of friend request details
 */
const getUserFriendRequestsSSEContract = oc
  .output(eventIterator(z.object({
    friendRequests: z.array(UserDisplaySchema),
    event: z.string(),
  })));

/**
 * Real-time stream of user sent friend requests (authenticated user)
 * Streams live updates of friend requests sent by the authenticated user
 * No input required - uses authenticated user ID from context
 * Output: server-sent events with array of sent friend request details
 */
const getSendUserFriendRequestsSSEContract = oc
  .output(eventIterator(z.object({
    sentFriendRequests: z.array(UserDisplaySchema),
    event: z.string(),
  })));

/**
 * Real-time stream of user friends list (authenticated user)
 * Streams live updates of the authenticated user's friends list
 * No input required - uses authenticated user ID from context
 * Output: server-sent events with array of friends
 */
const getUserFriendsSSEContract = oc
  .output(eventIterator(z.object({
    friends: z.array(UserDisplaySchema),
    event: z.string(),
  })));

/**
 * Real-time stream of user friend requests count (authenticated user)
 * Streams live updates of the count of pending friend requests for the authenticated user
 * No input required - uses authenticated user ID from context
 * Output: server-sent events with count of friend requests
 */
const getUserFriendRequestsCountSSEContract = oc
  .output(eventIterator(z.object({
    count: z.number(),
    event: z.string(),
  })));

export const privateFriendsSSEContract = {
  /// Friends SSE Endpoints
  getUserFriendRequestsSSEContract,
  getSendUserFriendRequestsSSEContract,
  getUserFriendsSSEContract,
  getUserFriendRequestsCountSSEContract
};
