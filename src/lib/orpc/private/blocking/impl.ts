import {blockContract} from './contract.ts';
import {implement} from '@orpc/server';
import {dbMiddleware} from '../../middleware/dbMiddleware.ts';
import {authMiddleware} from '../../middleware/authMiddleware.ts';
import {blockedUsers, friendRequests, friendsTable} from '../../../db/schema/auth-schema.ts';
import {userDisplayView} from '../../../db/schema/views-schema.ts';
import {and, eq, or} from 'drizzle-orm';
import {forgetRelatedUsers} from '../../../services/relatedUsersCache.ts';
import {
  publishFriendRequestIncomingUpdate,
  publishFriendRequestSentUpdate,
  publishFriendsListUpdate,
} from '../friendsWS/publisher.ts';

const os = implement(blockContract)
  .use(dbMiddleware);

// Block user implementation
const blockUser = os.blockUserContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const userId = context.userId;
    const { blockedUserId } = input;

    // Prevent blocking yourself
    if (userId === blockedUserId) {
      throw new Error('Cannot block yourself');
    }

    // Check if user is already blocked
    const existingBlock = await db.select()
      .from(blockedUsers)
      .where(
        and(
          eq(blockedUsers.userId, userId),
          eq(blockedUsers.blockedUser, blockedUserId)
        )
      )
      .get();

    if (existingBlock) {
      throw new Error('User is already blocked');
    }

    // Remove any existing friendship and friend requests, then block user
    const [removedFriendship, removedRequests] = await db.batch([
      // Remove friendship if exists
      db.delete(friendsTable)
        .where(
          or(
            and(eq(friendsTable.fromUserId, userId), eq(friendsTable.toUserId, blockedUserId)),
            and(eq(friendsTable.fromUserId, blockedUserId), eq(friendsTable.toUserId, userId))
          )
        ),
      // Remove any pending friend requests
      db.delete(friendRequests)
        .where(
          or(
            and(eq(friendRequests.fromUserId, userId), eq(friendRequests.toUserId, blockedUserId)),
            and(eq(friendRequests.fromUserId, blockedUserId), eq(friendRequests.toUserId, userId))
          )
        ),
      // Add block
      db.insert(blockedUsers)
        .values({
          userId: userId,
          blockedUser: blockedUserId
        })
    ]);
    await forgetRelatedUsers(context.env, [userId, blockedUserId]);

    // Live updates for what the block removed, as removeFriend / cancelFriendRequest (F-09).
    // A request may have gone either way, so both users' request lists are refreshed.
    const users = [userId, blockedUserId];
    await Promise.all([
      ...(removedFriendship.meta.changes > 0
        ? users.map((id) => publishFriendsListUpdate(context.env, id))
        : []),
      ...(removedRequests.meta.changes > 0
        ? users.flatMap((id) => [
            publishFriendRequestIncomingUpdate(context.env, id),
            publishFriendRequestSentUpdate(context.env, id),
          ])
        : []),
    ]);

    return { success: true };
  });

// Unblock user implementation
const unblockUser = os.unblockUserContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const userId = context.userId;
    const { blockedUserId } = input;

    // Check if user is blocked
    const existingBlock = await db.select()
      .from(blockedUsers)
      .where(
        and(
          eq(blockedUsers.userId, userId),
          eq(blockedUsers.blockedUser, blockedUserId)
        )
      )
      .get();

    if (!existingBlock) {
      throw new Error('User is not blocked');
    }

    // Remove the block
    await db.delete(blockedUsers)
      .where(
        and(
          eq(blockedUsers.userId, userId),
          eq(blockedUsers.blockedUser, blockedUserId)
        )
      );
    await forgetRelatedUsers(context.env, [userId, blockedUserId]);

    return { success: true };
  });

// List blocked users implementation
const listBlockedUsers = os.listBlockedUsersContract
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db;
    const userId = context.userId;

    // Get all users blocked by the current user
    const blockedUsersList = await db.select({
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
      .from(blockedUsers)
      .innerJoin(userDisplayView, eq(blockedUsers.blockedUser, userDisplayView.userId))
      .where(eq(blockedUsers.userId, userId))
      .all();

    return blockedUsersList;
  });

export const blockRouter = {
  blockUser,
  unblockUser,
  listBlockedUsers
};
