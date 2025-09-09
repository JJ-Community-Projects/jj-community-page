import {friendsContract} from './contract.ts';
import {implement} from '@orpc/server';
import {dbMiddleware} from '../../middleware/dbMiddleware.ts';
import {authMiddleware} from '../../middleware/authMiddleware.ts';
import {and, eq, or} from 'drizzle-orm';
import {blockedUsers, friendRequests, friendsTable} from "../../../db/schema/auth-schema.ts";
import {userDisplayView} from "../../../db/schema/views-schema.ts";
import {
  publishFriendRequestIncomingUpdate,
  publishFriendRequestSentUpdate,
  publishFriendsListUpdate
} from "../friendsWS/publisher.ts";

const os = implement(friendsContract)
  .use(dbMiddleware);


// Send friend request implementation
const sendFriendRequest = os.sendFriendRequestContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;
    const {toUserId} = input;

    // Prevent sending friend request to yourself
    if (userId === toUserId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check if users are already friends
    const existingFriendship = await db.select()
      .from(friendsTable)
      .where(
        or(
          and(eq(friendsTable.fromUserId, userId), eq(friendsTable.toUserId, toUserId)),
          and(eq(friendsTable.fromUserId, toUserId), eq(friendsTable.toUserId, userId))
        )
      )
      .get();

    if (existingFriendship) {
      throw new Error('Users are already friends');
    }

    // Check if friend request already exists
    const existingRequest = await db.select()
      .from(friendRequests)
      .where(
        or(
          and(eq(friendRequests.fromUserId, userId), eq(friendRequests.toUserId, toUserId)),
          and(eq(friendRequests.fromUserId, toUserId), eq(friendRequests.toUserId, userId))
        )
      )
      .get();

    if (existingRequest) {
      throw new Error('Friend request already exists');
    }

    // Check if either user has blocked the other
    const blockExists = await db.select()
      .from(blockedUsers)
      .where(
        or(
          and(eq(blockedUsers.userId, userId), eq(blockedUsers.blockedUser, toUserId)),
          and(eq(blockedUsers.userId, toUserId), eq(blockedUsers.blockedUser, userId))
        )
      )
      .get();

    if (blockExists) {
      throw new Error('Cannot send friend request to blocked user');
    }

    // Insert friend request
    await db.insert(friendRequests)
      .values({
        fromUserId: userId,
        toUserId: toUserId
      });

    // Publish event for real-time updates via Durable Objects
    await publishFriendRequestIncomingUpdate(context.env, toUserId);
    await publishFriendRequestSentUpdate(context.env, userId);

    return {success: true};
  });

// Accept friend request implementation
const acceptFriendRequest = os.acceptFriendRequestContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;
    const {fromUserId} = input;

    // Check if friend request exists
    const friendRequest = await db.select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.fromUserId, fromUserId),
          eq(friendRequests.toUserId, userId)
        )
      )
      .get();

    if (!friendRequest) {
      throw new Error('Friend request not found');
    }

    // Remove the friend request and add friendship in a transaction
    await db.batch([
      db.delete(friendRequests)
        .where(
          and(
            eq(friendRequests.fromUserId, fromUserId),
            eq(friendRequests.toUserId, userId)
          )
        ),
      db.insert(friendsTable)
        .values({
          fromUserId: fromUserId,
          toUserId: userId
        }),
      db.insert(friendsTable)
        .values({
          fromUserId: userId,
          toUserId: fromUserId
        })
    ]);

    // Publish event for real-time updates via Durable Objects
    await publishFriendRequestIncomingUpdate(context.env, userId);
    await publishFriendRequestSentUpdate(context.env, fromUserId);
    await publishFriendsListUpdate(context.env, userId)
    await publishFriendsListUpdate(context.env, fromUserId)

    return {success: true};
  });

// Decline friend request implementation
const declineFriendRequest = os.declineFriendRequestContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;
    const {fromUserId} = input;

    // Check if friend request exists
    const friendRequest = await db.select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.fromUserId, fromUserId),
          eq(friendRequests.toUserId, userId)
        )
      )
      .get();

    if (!friendRequest) {
      throw new Error('Friend request not found');
    }

    // Remove the friend request
    await db.delete(friendRequests)
      .where(
        and(
          eq(friendRequests.fromUserId, fromUserId),
          eq(friendRequests.toUserId, userId)
        )
      );

    // Publish event for real-time updates via Durable Objects
    await publishFriendRequestIncomingUpdate(context.env, userId);
    await publishFriendRequestSentUpdate(context.env, fromUserId);

    return {success: true};
  });

// Cancel friend request implementation (for requests you sent)
const cancelFriendRequest = os.cancelFriendRequestContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;
    const {toUserId} = input;

    // Check if friend request exists (where current user is the sender)
    const friendRequest = await db.select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.fromUserId, userId),
          eq(friendRequests.toUserId, toUserId)
        )
      )
      .get();

    if (!friendRequest) {
      throw new Error('Friend request not found');
    }

    // Remove the friend request
    await db.delete(friendRequests)
      .where(
        and(
          eq(friendRequests.fromUserId, userId),
          eq(friendRequests.toUserId, toUserId)
        )
      );

    // Publish event for real-time updates via Durable Objects
    await publishFriendRequestIncomingUpdate(context.env, toUserId);
    await publishFriendRequestSentUpdate(context.env, userId);

    return {success: true};
  });

// Remove friend implementation
const removeFriend = os.removeFriendContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;
    const {friendUserId} = input;

    // Check if friendship exists
    const friendship = await db.select()
      .from(friendsTable)
      .where(
        or(
          and(eq(friendsTable.fromUserId, userId), eq(friendsTable.toUserId, friendUserId)),
          and(eq(friendsTable.fromUserId, friendUserId), eq(friendsTable.toUserId, userId))
        )
      )
      .get();

    if (!friendship) {
      throw new Error('Friendship not found');
    }

    // Remove the friendship
    await db.delete(friendsTable)
      .where(
        or(
          and(eq(friendsTable.fromUserId, userId), eq(friendsTable.toUserId, friendUserId)),
          and(eq(friendsTable.fromUserId, friendUserId), eq(friendsTable.toUserId, userId))
        )
      );

    // Publish event for real-time updates via Durable Objects
    await publishFriendsListUpdate(context.env, userId);
    await publishFriendsListUpdate(context.env, friendUserId);

    return {success: true};
  });

/**
 * Get all friends for the authenticated user
 */
const getFriends = os.getFriendsContract
  .use(authMiddleware)
  .handler(async ({context}) => {
    const db = context.db;
    const userId = context.userId;

    // Get all friends for the authenticated user with user details from userDisplayView
    const friendships = await db.select({
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
        // and(eq(friendsTable.toUserId, userId), eq(userDisplayView.userId, friendsTable.fromUserId))
      ))
      .where(
        eq(friendsTable.toUserId, userId)
      )
      .all();

    return friendships;
  });

export const friendsRouter = {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriends,
};
