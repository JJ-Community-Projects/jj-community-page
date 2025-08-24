import {EventPublisher} from '@orpc/server'

/**
 * Event types for user friend request updates
 */
type UserFriendRequestEvent = 'new_friend_request' | 'friend_request_accepted' | 'friend_request_declined' | 'friend_request_cancelled';

/**
 * Event types for user friends list updates
 */
type UserFriendsEvent = 'friend_added' | 'friend_removed';

/**
 * Custom FriendsEventPublisher class that extends the base EventPublisher
 * to provide convenient methods for publishing friend-related events.
 *
 * This class consolidates all friend event publishing logic into a single interface,
 * making it easier to trigger the appropriate SSE events when friend operations occur.
 * Each method handles publishing multiple related events as needed for complete
 * real-time synchronization across the application.
 *
 * @extends EventPublisher
 */
class FriendsEventPublisher extends EventPublisher<{
  updateUserFriendRequestList: { fromUserId: number, toUserId: number, event: UserFriendRequestEvent },
  updateSentFriendRequestList: { fromUserId: number, toUserId: number, event: UserFriendRequestEvent },
  updateUserFriendsList: { fromUserId: number, toUserId: number, event: UserFriendsEvent },
}> {

  /**
   * Publishes events when a friend request is sent to a user.
   *
   * Triggers two events:
   * - updateUserFriendRequestList: Notifies the recipient of the new friend request
   * - updateSentFriendRequestList: Notifies the sender that their sent request list has been updated
   *
   * @param fromUserId - The ID of the user sending the friend request
   * @param toUserId - The ID of the user receiving the friend request
   */
  sendFriendRequest(fromUserId: number, toUserId: number) {
    this.publish('updateUserFriendRequestList', {fromUserId, toUserId, event: 'new_friend_request'})
    this.publish('updateSentFriendRequestList', {fromUserId, toUserId, event: 'new_friend_request'})
  }

  /**
   * Publishes events when a user accepts a friend request.
   *
   * Triggers four events to ensure all relevant parties are notified:
   * - updateUserFriendRequestList: Updates the recipient's friend request list (request removed)
   * - updateSentFriendRequestList: Updates the sender's sent friend request list (request removed)
   * - updateUserFriendsList: Updates both users' friends lists (new friend added)
   *
   * @param fromUserId - The ID of the user who originally sent the friend request
   * @param toUserId - The ID of the user accepting the friend request
   */
  acceptFriendRequest(fromUserId: number, toUserId: number) {
    this.publish('updateUserFriendRequestList', {fromUserId, toUserId, event: 'friend_request_accepted'})
    this.publish('updateSentFriendRequestList', {fromUserId, toUserId, event: 'friend_request_accepted'})
    this.publish('updateUserFriendsList', {fromUserId, toUserId, event: 'friend_added'})
    // Also notify the original sender that their request was accepted by updating their friends list
    this.publish('updateUserFriendsList', {fromUserId: toUserId, toUserId: fromUserId, event: 'friend_added'})
  }

  /**
   * Publishes events when a user declines a friend request.
   *
   * Triggers two events:
   * - updateUserFriendRequestList: Updates the recipient's friend request list (request removed)
   * - updateSentFriendRequestList: Updates the sender's sent friend request list (request removed)
   *
   * @param fromUserId - The ID of the user who originally sent the friend request
   * @param toUserId - The ID of the user declining the friend request
   */
  declineFriendRequest(fromUserId: number, toUserId: number) {
    this.publish('updateUserFriendRequestList', {fromUserId, toUserId, event: 'friend_request_declined'})
    this.publish('updateSentFriendRequestList', {fromUserId, toUserId, event: 'friend_request_declined'})
  }

  /**
   * Publishes events when a user cancels a friend request they sent.
   *
   * Triggers two events:
   * - updateUserFriendRequestList: Updates the recipient's friend request list (request removed)
   * - updateSentFriendRequestList: Updates the sender's sent friend request list (request removed)
   *
   * @param fromUserId - The ID of the user canceling the friend request (original sender)
   * @param toUserId - The ID of the user who was to receive the friend request
   */
  cancelFriendRequest(fromUserId: number, toUserId: number) {
    this.publish('updateUserFriendRequestList', {fromUserId, toUserId, event: 'friend_request_cancelled'})
    this.publish('updateSentFriendRequestList', {fromUserId, toUserId, event: 'friend_request_cancelled'})
  }

  /**
   * Publishes events when a user removes a friend (unfriend).
   *
   * Triggers two events:
   * - updateUserFriendsList: Updates both users' friends lists (friend removed)
   *
   * @param fromUserId - The ID of the user initiating the unfriend action
   * @param toUserId - The ID of the user being unfriended
   */
  removeFriend(fromUserId: number, toUserId: number) {
    this.publish('updateUserFriendsList', {fromUserId, toUserId, event: 'friend_removed'})
    this.publish('updateUserFriendsList', {fromUserId: toUserId, toUserId: fromUserId, event: 'friend_removed'})
  }
}

/**
 * Consolidated friends event publisher for all friend-related real-time updates.
 *
 * This EventPublisher handles all friend-related Server-Sent Events (SSE) for real-time
 * communication between the server and client components.
 *
 * Event types and their purposes:
 *
 * **updateUserFriendRequestList**: Notifies users when their friend request list changes
 * - Payload: { fromUserId: number, toUserId: number } - The users involved in the friend request
 * - Triggers: New friend requests received, friend requests accepted/declined/cancelled
 * - Used by: getUserFriendRequestsSSE for streaming user's pending friend requests
 *
 * **updateUserFriendsList**: Notifies users when their friends list changes
 * - Payload: { fromUserId: number, toUserId: number } - The users involved in the friendship
 * - Triggers: Friends added, friends removed/unfriended
 * - Used by: getUserFriendsSSE for streaming user's current friends
 *
 * Usage patterns:
 * - Called after successful database operations in friend management handlers
 * - Multiple events may be published for a single operation (e.g., accepting a friend request
 *   triggers both friend request list and friends list updates)
 * - Events are only published after successful database transactions to ensure consistency
 *
 * Integration with SSE contracts:
 * - Each event type corresponds to a specific SSE contract in privateFriendsSSEContract
 * - Event payloads contain identifiers needed for the SSE handlers to fetch fresh data
 * - Real-time updates ensure UI components stay synchronized with database state
 */
export const friendsEventPublisher = new FriendsEventPublisher();
