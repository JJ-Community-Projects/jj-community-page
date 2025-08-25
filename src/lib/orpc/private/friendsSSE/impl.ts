import {implement, ORPCError} from "@orpc/server";
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {privateFriendsSSEContract} from "./contract.ts";
import {userDisplayView} from "../../../db/schema/views-schema.ts";
import {friendRequests, friendsTable} from "../../../db/schema/auth-schema.ts";
import {and, eq, or} from "drizzle-orm";
import {friendsEventPublisher} from "./friendEventPublisher.ts";
import type {JJDrizzleDatabase} from "../../../db/db.ts";

const os = implement(privateFriendsSSEContract)
  .use(dbMiddleware);

/**
 * Get event-specific delay based on event type for optimal user experience.
 * Fast response for high-priority events, longer delays for less urgent ones.
 *
 * @param eventType - The type of event that occurred
 * @returns Delay in milliseconds before processing the event
 */
function getEventDelay(eventType: string): number {
  switch (eventType) {
    case 'new_friend_request': return 500;          // Fast response for new friend requests
    case 'friend_request_accepted': return 1000;    // Standard delay
    case 'friend_request_declined': return 1000;    // Standard delay
    case 'friend_request_cancelled': return 1000;   // Standard delay
    case 'friend_added': return 500;                // Fast response for new friends
    case 'friend_removed': return 1000;             // Standard delay
    default: return 2000;                           // Conservative default for unknown events
  }
}

/**
 * Check if an event is relevant to a specific user context.
 * Filters out events that don't affect the specified user.
 *
 * @param payload - Event payload containing fromUserId, toUserId, and event type
 * @param targetUserId - The user ID this SSE stream is monitoring
 * @returns True if the event is relevant to the target user
 */
function isEventRelevantToUser(payload: { fromUserId: number, toUserId: number, event: string }, targetUserId: number): boolean {
  return payload.fromUserId === targetUserId || payload.toUserId === targetUserId;
}

/**
 * Determine if an event requires full data refetch or can be handled incrementally.
 * Some events add data (safer to refetch), others remove data (can be optimized).
 *
 * @param eventType - The type of event that occurred
 * @returns True if full refetch is recommended, false for potential incremental handling
 */
function shouldRefetchAll(eventType: string): boolean {
  switch (eventType) {
    case 'new_friend_request':
    case 'friend_added':
      return true; // These add data, safer to refetch to ensure consistency
    case 'friend_request_accepted':
    case 'friend_request_declined':
    case 'friend_request_cancelled':
    case 'friend_removed':
      return true; // For now, refetch all - future optimization could handle incrementally
    default:
      return true; // Conservative default
  }
}

/**
 * Helper function to fetch pending friend requests for a specific user.
 * Joins friend requests with user display view to get complete user information.
 *
 * @param db - Drizzle database instance
 * @param userId - ID of the user to fetch friend requests for
 * @returns Array of user display objects representing pending friend requests
 */
function getUserFriendRequests(db: JJDrizzleDatabase, userId: number) {
  return db.select({
    userId: userDisplayView.userId,
    primaryLiveStream: userDisplayView.primaryLiveStream,
    role: userDisplayView.role,
    createdAt: userDisplayView.createdAt,
    username: userDisplayView.username,
    profileImage: userDisplayView.profileImage,
    twitchLogin: userDisplayView.twitchLogin,
    tiltifySlug: userDisplayView.tiltifySlug,
    tiltifyUrl: userDisplayView.tiltifyUrl,
    primaryColor: userDisplayView.primaryColor,
    accentColor: userDisplayView.accentColor,
  })
    .from(friendRequests)
    .innerJoin(userDisplayView, eq(friendRequests.fromUserId, userDisplayView.userId))
    .where(eq(friendRequests.toUserId, userId))
    .all();
}

/**
 * Helper function to fetch sent friend requests for a specific user.
 * Joins friend requests with user display view to get complete user information.
 *
 * @param db - Drizzle database instance
 * @param userId - ID of the user to fetch sent friend requests for
 * @returns Array of user display objects representing sent friend requests
 */
function getSendUserFriendRequests(db: JJDrizzleDatabase, userId: number) {
  return db.select({
    userId: userDisplayView.userId,
    primaryLiveStream: userDisplayView.primaryLiveStream,
    role: userDisplayView.role,
    createdAt: userDisplayView.createdAt,
    username: userDisplayView.username,
    profileImage: userDisplayView.profileImage,
    twitchLogin: userDisplayView.twitchLogin,
    tiltifySlug: userDisplayView.tiltifySlug,
    tiltifyUrl: userDisplayView.tiltifyUrl,
    primaryColor: userDisplayView.primaryColor,
    accentColor: userDisplayView.accentColor,
  })
    .from(friendRequests)
    .innerJoin(userDisplayView, eq(friendRequests.toUserId, userDisplayView.userId))
    .where(eq(friendRequests.fromUserId, userId))
    .all();
}

/**
 * Helper function to fetch friends list for a specific user.
 * Joins friends table with user display view to get complete user information.
 *
 * @param db - Drizzle database instance
 * @param userId - ID of the user to fetch friends for
 * @returns Array of user display objects representing current friends
 */
function getUserFriends(db: JJDrizzleDatabase, userId: number) {
  return db.select({
    userId: userDisplayView.userId,
    primaryLiveStream: userDisplayView.primaryLiveStream,
    role: userDisplayView.role,
    createdAt: userDisplayView.createdAt,
    username: userDisplayView.username,
    profileImage: userDisplayView.profileImage,
    twitchLogin: userDisplayView.twitchLogin,
    tiltifySlug: userDisplayView.tiltifySlug,
    tiltifyUrl: userDisplayView.tiltifyUrl,
    primaryColor: userDisplayView.primaryColor,
    accentColor: userDisplayView.accentColor,
  })
    .from(friendsTable)
    .innerJoin(userDisplayView, or(
      and(eq(friendsTable.fromUserId, userId), eq(userDisplayView.userId, friendsTable.toUserId)),
      and(eq(friendsTable.toUserId, userId), eq(userDisplayView.userId, friendsTable.fromUserId))
    ))
    .where(or(
      eq(friendsTable.fromUserId, userId),
      eq(friendsTable.toUserId, userId)
    ))
    .all();
}

/**
 * Real-time stream of user friend requests (authenticated user)
 * Streams live updates of pending friend requests for the authenticated user
 * No input required - uses authenticated user ID from context
 * Requires authentication through authMiddleware
 */
const getUserFriendRequestsSSE = os
  .getUserFriendRequestsSSEContract
  .use(authMiddleware)
  .handler(async function* ({context, signal}) {
    const db = context.db
    const userId = context.userId
    try {
      // Send initial data immediately
      const friendRequests = await getUserFriendRequests(db, userId)

      yield {
        friendRequests,
        event: 'init'
      };

      // Set up polling for updates - subscribes to user friend request list changes
      for await (const payload of friendsEventPublisher.subscribe('updateUserFriendRequestList', {signal})) {
        // Filter out events not relevant to this user
        if (!isEventRelevantToUser(payload, userId)) {
          continue;
        }

        // Use event-specific delay for optimal responsiveness
        const delay = getEventDelay(payload.event);
        // await new Promise(resolve => setTimeout(resolve, delay));

        // Smart data fetching based on event type (currently all events refetch, but prepared for optimization)
        if (shouldRefetchAll(payload.event)) {
          const currentFriendRequests = await getUserFriendRequests(db, userId);
          yield {
            friendRequests: currentFriendRequests,
            event: payload.event
          };
        }
      }
    } catch (error) {
      console.error('Error in getUserFriendRequestsSSE:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream user friend requests'});
    } finally {
      console.log('getUserFriendRequestsSSE stream ended')
    }
  })

/**
 * Real-time stream of user sent friend requests (authenticated user)
 * Streams live updates of friend requests sent by the authenticated user
 * No input required - uses authenticated user ID from context
 * Requires authentication through authMiddleware
 */
const getSendUserFriendRequestsSSE = os
  .getSendUserFriendRequestsSSEContract
  .use(authMiddleware)
  .handler(async function* ({context, signal}) {
    const db = context.db
    const userId = context.userId
    try {
      // Send initial data immediately
      const sentFriendRequests = await getSendUserFriendRequests(db, userId)

      yield {
        sentFriendRequests,
        event: 'init'
      };

      // Set up polling for updates - subscribes to sent friend request list changes
      for await (const payload of friendsEventPublisher.subscribe('updateSentFriendRequestList', {signal})) {
        // Filter out events not relevant to this user
        if (!isEventRelevantToUser(payload, userId)) {
          continue;
        }

        // Use event-specific delay for optimal responsiveness
        const delay = getEventDelay(payload.event);
        // await new Promise(resolve => setTimeout(resolve, delay));

        // Smart data fetching based on event type (currently all events refetch, but prepared for optimization)
        if (shouldRefetchAll(payload.event)) {
          const currentSentFriendRequests = await getSendUserFriendRequests(db, userId);
          yield {
            sentFriendRequests: currentSentFriendRequests,
            event: payload.event
          };
        }
      }
    } catch (error) {
      console.error('Error in getSendUserFriendRequestsSSE:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream sent friend requests'});
    } finally {
      console.log('getSendUserFriendRequestsSSE stream ended')
    }
  })

/**
 * Real-time stream of user friends list (authenticated user)
 * Streams live updates of the authenticated user's friends list
 * No input required - uses authenticated user ID from context
 * Requires authentication through authMiddleware
 */
const getUserFriendsSSE = os
  .getUserFriendsSSEContract
  .use(authMiddleware)
  .handler(async function* ({context, signal}) {
    const db = context.db
    const userId = context.userId
    try {
      // Send initial data immediately
      const friends = await getUserFriends(db, userId)

      yield {
        friends,
        event: 'init'
      };

      // Set up polling for updates - subscribes to user friends list changes
      for await (const payload of friendsEventPublisher.subscribe('updateUserFriendsList', {signal})) {
        // Filter out events not relevant to this user
        if (!isEventRelevantToUser(payload, userId)) {
          continue;
        }

        // Use event-specific delay for optimal responsiveness
        const delay = getEventDelay(payload.event);
        // await new Promise(resolve => setTimeout(resolve, delay));

        // Smart data fetching based on event type (currently all events refetch, but prepared for optimization)
        if (shouldRefetchAll(payload.event)) {
          const currentFriends = await getUserFriends(db, userId);
          yield {
            friends: currentFriends,
            event: payload.event
          };
        }
      }
    } catch (error) {
      console.error('Error in getUserFriendsSSE:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream user friends'});
    } finally {
      console.log('getUserFriendsSSE stream ended')
    }
  })

/**
 * Real-time stream of user friend requests count (authenticated user)
 * Streams live updates of the count of pending friend requests for the authenticated user
 * No input required - uses authenticated user ID from context
 * Requires authentication through authMiddleware
 */
const getUserFriendRequestsCountSSE = os
  .getUserFriendRequestsCountSSEContract
  .use(authMiddleware)
  .handler(async function* ({context, signal}) {
    const db = context.db
    const userId = context.userId
    try {
      // Send initial count immediately
      const friendRequests = await getUserFriendRequests(db, userId)
      const count = friendRequests.length

      yield {
        count,
        event: 'init'
      };

      // Set up polling for updates - subscribes to user friend request list changes
      for await (const payload of friendsEventPublisher.subscribe('updateUserFriendRequestList', {signal})) {
        // Filter out events not relevant to this user
        if (!isEventRelevantToUser(payload, userId)) {
          continue;
        }

        // Use event-specific delay for optimal responsiveness
        const delay = getEventDelay(payload.event);
        // await new Promise(resolve => setTimeout(resolve, delay));

        // Smart data fetching based on event type (currently all events refetch, but prepared for optimization)
        if (shouldRefetchAll(payload.event)) {
          const currentFriendRequests = await getUserFriendRequests(db, userId);
          const currentCount = currentFriendRequests.length;
          yield {
            count: currentCount,
            event: payload.event
          };
        }
      }
    } catch (error) {
      console.error('Error in getUserFriendRequestsCountSSE:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream friend requests count'});
    } finally {
      console.log('getUserFriendRequestsCountSSE stream ended')
    }
  })

/**
 * Export all SSE router procedures for friend-related real-time functionality
 */
export const privateFriendsSSERouter = {
  getUserFriendRequestsSSE,
  getSendUserFriendRequestsSSE,
  getUserFriendsSSE,
  getUserFriendRequestsCountSSE
}
