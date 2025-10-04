import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { authMiddleware } from '../../middleware/authMiddleware.ts'
import { DurableIterator } from '@orpc/experimental-durable-iterator'
import { FriendsListObject } from './do/FriendsListObject.ts'
import type { FriendRequestSentObject } from './do/FriendRequestSentObject.ts'
import type { FriendRequestIncomingObject } from './do/FriendRequestIncomingObject.ts'
import { friendsChannels } from './channels.ts'
import { privateFriendsWSContract } from './contract.ts'

const os = implement(privateFriendsWSContract)

/**
 * Real-time stream of user friend requests (authenticated user)
 * Streams live updates of pending friend requests for the authenticated user
 * No input required - uses authenticated user ID from context
 * Requires authentication through authMiddleware
 */
const getUserFriendRequestsWS = os.getUserFriendRequestsWS
  .use(authMiddleware)
  .use(dbMiddleware)
  .handler(async ({ context }) => {
    const userId = context.userId
    try {
      const channelId = friendsChannels.userIncomingRequests(userId)

      return new DurableIterator<FriendRequestIncomingObject>(channelId, {
        signingKey: context.env!.ORPC_DEI_SIGNING_KEY,
        tokenTTLSeconds: 300,
        att: {
          userId: userId,
        },
      })
    } catch (error) {
      console.error('Error in getUserFriendRequestsWS:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to stream user friend requests',
      })
    } finally {
      console.log('getUserFriendRequestsWS stream ended')
    }
  })

/**
 * Real-time stream of user sent friend requests (authenticated user)
 * Streams live updates of friend requests sent by the authenticated user
 * No input required - uses authenticated user ID from context
 * Requires authentication through authMiddleware
 */
const getSendUserFriendRequestsWS = os.getSendUserFriendRequestsWS
  .use(authMiddleware)
  .use(dbMiddleware)
  .handler(async ({ context }) => {
    const userId = context.userId
    try {
      const channelId = friendsChannels.userSentRequests(userId)

      return new DurableIterator<FriendRequestSentObject>(channelId, {
        signingKey: context.env!.ORPC_DEI_SIGNING_KEY,
        tokenTTLSeconds: 300,
        att: {
          userId: userId,
        },
      })
    } catch (error) {
      console.error('Error in getSendUserFriendRequestsWS:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to stream sent friend requests',
      })
    } finally {
      console.log('getSendUserFriendRequestsWS stream ended')
    }
  })

/**
 * Real-time stream of user friends list (authenticated user)
 * Streams live updates of the authenticated user's friends list
 * No input required - uses authenticated user ID from context
 * Requires authentication through authMiddleware
 */
const getUserFriendsWS = os.getUserFriendsWS
  .use(authMiddleware)
  .use(dbMiddleware)
  .handler(async function ({ context }) {
    const userId = context.userId
    try {
      const channelId = friendsChannels.userFriendsList(userId)
      return new DurableIterator<FriendsListObject>(channelId, {
        signingKey: context.env!.ORPC_DEI_SIGNING_KEY,
        tokenTTLSeconds: 300,
        att: {
          userId: userId,
        },
      })
    } catch (error) {
      console.error('Error in getUserFriendsWS:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to stream user friends',
      })
    } finally {
      console.log('getUserFriendsWS stream ended')
    }
  })

/**
 * Real-time stream of user friend requests count (authenticated user)
 * Streams live updates of the count of pending friend requests for the authenticated user
 * No input required - uses authenticated user ID from context
 * Requires authentication through authMiddleware
 */
const getUserFriendRequestsCountWS = os.getUserFriendRequestsCountWS
  .use(authMiddleware)
  .use(dbMiddleware)
  .handler(async function ({ context }) {
    const userId = context.userId
    try {
      // Send initial count immediately

      // Switch to Durable Event Iterator subscription by returning iterator bound to per-user incoming-requests channel
      const channelId = friendsChannels.userIncomingRequests(userId)
      return new DurableIterator<FriendsListObject>(channelId, {
        signingKey: context.env!.ORPC_DEI_SIGNING_KEY,
        tokenTTLSeconds: 300,
        att: {
          userId: userId,
        },
      })
    } catch (error) {
      console.error('Error in getUserFriendRequestsCountWS:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to stream friend requests count',
      })
    } finally {
      console.log('getUserFriendRequestsCountWS stream ended')
    }
  })

/**
 * Export all WS router procedures for friend-related real-time functionality
 */
export const privateFriendsWSRouter = {
  getUserFriendRequestsWS,
  getSendUserFriendRequestsWS,
  getUserFriendsWS,
  getUserFriendRequestsCountWS,
}
