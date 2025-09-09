import { z } from "zod/v4";
import { UserDisplaySchema } from "../schemas/users.ts";
import { oc, type } from "@orpc/contract";
import type { ClientDurableEventIterator } from "@orpc/experimental-durable-event-iterator/client";
import type { DurableEventIteratorObject } from "@orpc/experimental-durable-event-iterator";

// Types inferred from schemas
type UserDisplay = z.infer<typeof UserDisplaySchema>;

// Durable Event Iterator object interfaces (payloads must match DO publishEvent payloads)
export interface IFriendRequestIncomingObject
  extends DurableEventIteratorObject<{ users: UserDisplay[]; event: "update" }> {}

export interface IFriendRequestSentObject
  extends DurableEventIteratorObject<{ users: UserDisplay[]; event: "update" }> {}

export interface IFriendsListObject
  extends DurableEventIteratorObject<{ friends: UserDisplay[]; event: "update" }> {}

/**
 * Real-time stream of user friend requests (authenticated user)
 */
const getUserFriendRequestsWSContract = oc.output(
  type<ClientDurableEventIterator<IFriendRequestIncomingObject, never>>()
);

/**
 * Real-time stream of user sent friend requests (authenticated user)
 */
const getSendUserFriendRequestsWSContract = oc.output(
  type<ClientDurableEventIterator<IFriendRequestSentObject, never>>()
);

/**
 * Real-time stream of user friends list (authenticated user)
 */
const getUserFriendsWSContract = oc.output(
  type<ClientDurableEventIterator<IFriendsListObject, never>>()
);

/**
 * Real-time stream of user friend requests count (authenticated user)
 * NOTE: Implementation currently returns iterator bound to FriendsListObject channel.
 */
const getUserFriendRequestsCountWSContract = oc.output(
  type<ClientDurableEventIterator<IFriendsListObject, never>>()
);

export const privateFriendsWSContract = {
  /// Friends WS Endpoints
  getUserFriendRequestsWS: getUserFriendRequestsWSContract,
  getSendUserFriendRequestsWS: getSendUserFriendRequestsWSContract,
  getUserFriendsWS: getUserFriendsWSContract,
  getUserFriendRequestsCountWS: getUserFriendRequestsCountWSContract,
};
