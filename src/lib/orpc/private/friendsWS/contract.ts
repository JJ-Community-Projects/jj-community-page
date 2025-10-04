import { z } from 'zod/v4'
import { UserDisplaySchema } from '../schemas/users.ts'
import { oc, type } from '@orpc/contract'
import type { ClientDurableIterator } from '@orpc/experimental-durable-iterator/client'
import type { DurableIteratorObject } from '@orpc/experimental-durable-iterator'

// Types inferred from schemas
type UserDisplay = z.infer<typeof UserDisplaySchema>

// Durable Iterator object interfaces (payloads must match DO publishEvent payloads)
export interface IFriendRequestIncomingObject
  extends DurableIteratorObject<{ users: UserDisplay[]; event: 'update' }> {}

export interface IFriendRequestSentObject
  extends DurableIteratorObject<{ users: UserDisplay[]; event: 'update' }> {}

export interface IFriendsListObject
  extends DurableIteratorObject<{ friends: UserDisplay[]; event: 'update' }> {}

/**
 * Real-time stream of user friend requests (authenticated user)
 */
const getUserFriendRequestsWSContract =
  oc.output(type<ClientDurableIterator<IFriendRequestIncomingObject, never>>())

/**
 * Real-time stream of user sent friend requests (authenticated user)
 */
const getSendUserFriendRequestsWSContract =
  oc.output(type<ClientDurableIterator<IFriendRequestSentObject, never>>())

/**
 * Real-time stream of user friends list (authenticated user)
 */
const getUserFriendsWSContract =
  oc.output(type<ClientDurableIterator<IFriendsListObject, never>>())

/**
 * Real-time stream of user friend requests count (authenticated user)
 * NOTE: Implementation currently returns iterator bound to FriendsListObject channel.
 */
const getUserFriendRequestsCountWSContract =
  oc.output(type<ClientDurableIterator<IFriendsListObject, never>>())

export const privateFriendsWSContract = {
  /// Friends WS Endpoints
  getUserFriendRequestsWS: getUserFriendRequestsWSContract,
  getSendUserFriendRequestsWS: getSendUserFriendRequestsWSContract,
  getUserFriendsWS: getUserFriendsWSContract,
  getUserFriendRequestsCountWS: getUserFriendRequestsCountWSContract,
}
