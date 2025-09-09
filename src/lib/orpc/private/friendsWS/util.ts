import type {JJDrizzleDatabase} from "../../../db/db.ts";
import {userDisplayView} from "../../../db/schema/views-schema.ts";
import {friendRequests, friendsTable} from "../../../db/schema/auth-schema.ts";
import {and, eq, or} from "drizzle-orm";

/**
 * Helper function to fetch pending friend requests for a specific user.
 * Joins friend requests with user display view to get complete user information.
 *
 * @param db - Drizzle database instance
 * @param userId - ID of the user to fetch friend requests for
 * @returns Array of user display objects representing pending friend requests
 */
export function getUserFriendRequests(db: JJDrizzleDatabase, userId: number) {
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
export function getSendUserFriendRequests(db: JJDrizzleDatabase, userId: number) {
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
export function getUserFriends(db: JJDrizzleDatabase, userId: number) {
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
    .where(eq(friendsTable.fromUserId, userId))
    .all();
}
