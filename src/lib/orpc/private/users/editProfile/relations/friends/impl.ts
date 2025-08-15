import {friendsContract, getFriendsContract} from './contract.ts';
import {implement} from '@orpc/server';
import {dbMiddleware} from '../../../../../middleware/dbMiddleware.ts';
import {authMiddleware} from '../../../../../middleware/authMiddleware.ts';
import {blockedUsers, friendRequests, friendsTable, users} from '../../../../../../db/schema/auth-schema.ts';
import {and, eq, or} from 'drizzle-orm';

const os = implement(friendsContract)
  .use(dbMiddleware);

const gf = implement(getFriendsContract)
  .use(dbMiddleware);

// Send friend request implementation
const sendFriendRequest = os.sendFriendRequest
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const userId = context.userId;
    const { toUserId } = input;

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

    return { success: true };
  });

// Accept friend request implementation
const acceptFriendRequest = os.acceptFriendRequest
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const userId = context.userId;
    const { fromUserId } = input;

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
        })
    ]);

    return { success: true };
  });

// Decline friend request implementation
const declineFriendRequest = os.declineFriendRequest
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const userId = context.userId;
    const { fromUserId } = input;

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

    return { success: true };
  });

// Remove friend implementation
const removeFriend = os.removeFriend
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const userId = context.userId;
    const { friendUserId } = input;

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

    return { success: true };
  });

/**
 * Get all friends for the authenticated user
 */
const getFriends = gf
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db;
    const userId = context.userId;

    // Get all friends for the authenticated user with user details
    const friendships = await db.select({
      id: users.id,
      name: users.name,
      username: users.username,
      slug: users.slug,
      avatarUrl: users.avatarUrl,
    })
    .from(friendsTable)
    .innerJoin(users, or(
      and(eq(friendsTable.fromUserId, userId), eq(users.id, friendsTable.toUserId)),
      and(eq(friendsTable.toUserId, userId), eq(users.id, friendsTable.fromUserId))
    ))
    .where(or(
      eq(friendsTable.fromUserId, userId),
      eq(friendsTable.toUserId, userId)
    ))
    .all();

    return friendships;
  });

export const friendsRouter = {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriends,
};
