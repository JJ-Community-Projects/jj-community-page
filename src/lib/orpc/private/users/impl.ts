import {privateUsersContract} from './contract.ts';
import {implement, ORPCError} from '@orpc/server';
import {dbMiddleware} from '../../middleware/dbMiddleware.ts';
import {authMiddleware} from '../../middleware/authMiddleware.ts';
import {userDisplayView, usersSearchView} from '../../../db/schema/views-schema.ts';
import {and, eq, inArray, like, not, or} from 'drizzle-orm';
import {blockedUsers, friendsTable, users} from "../../../db/schema/auth-schema.ts";
import {teamMembersTable} from "../../../db/schema/jj-schema.ts";

const os = implement(privateUsersContract)
  .use(dbMiddleware);

/**
 * Get current authenticated user information
 * Returns the current user as UserDisplaySchema with role information
 */
const getCurrentUser = os.getCurrentUserContract
  .use(authMiddleware)
  .handler(async ({context}) => {
    const db = context.db;
    const userId = context.userId;

    try {
      // Query the current user from userDisplayView
      const user = await db.select({
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
        .from(userDisplayView)
        .where(eq(userDisplayView.userId, userId))
        .get();

      if (!user) {
        throw new ORPCError('NOT_FOUND', {message: 'User not found'});
      }

      return user;
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error getting current user:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get current user'});
    }
  });

const isAdmin = os.isAdminContract
  .use(authMiddleware)
  .handler(async ({context}) => {
    const db = context.db
    const userId = context.userId

    const user = await db.select({
      role: users.role
    }).from(users)
      .where(eq(users.id, userId))
      .get()

    if (!user) {
      throw new ORPCError('NOT_FOUND')
    }

    return user.role === 'admin'
  })

/**
 * Search users by name (authenticated user)
 * Searches for users by Tiltify and Twitch usernames using case-insensitive matching
 * Requires authentication through authMiddleware
 */
const searchByName = os.searchByNameContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const {searchTerm, includeSelf} = input;
    const userId = context.userId
    try {
      // Query 1: Get list of users who have blocked the current user
      const blockedByUsers = await db.select({
        userId: blockedUsers.userId
      })
        .from(blockedUsers)
        .where(eq(blockedUsers.blockedUser, userId))
        .all();
      const blockedUserIds = new Set(blockedByUsers.map(u => u.userId));

      // Convert search term to lowercase for case-insensitive matching
      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      // Search in both Tiltify and Twitch usernames using the usersSearchView
      // The view already stores lowercase versions of usernames for efficient searching
      const results = await db.select({
        userId: usersSearchView.userId,
        tiltifyUsername: usersSearchView.tiltifyUsername,
        twitchUsername: usersSearchView.twitchUsername,
      })
        .from(usersSearchView)
        .where(
          or(
            like(usersSearchView.tiltifyUsername, searchPattern),
            like(usersSearchView.twitchUsername, searchPattern)
          )
        )
        .limit(10 + blockedUserIds.size) // Limit results to prevent excessive data transfer
        .all();

      // Filter out blocked users and apply includeSelf logic
      return results.filter(user =>
        !blockedUserIds.has(user.userId) &&
        (includeSelf || user.userId !== userId)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to search users'});
    }
  });


/**
 * Get relations for the authenticated user:
 * - friends: direct friendships
 * - teamMates: users sharing at least one team with the user (excluding self)
 */
const getRelations = os.getRelationsContract
  .use(authMiddleware)
  .handler(async ({context}) => {
    const db = context.db;
    const userId = context.userId;

    // Projection matching UserDisplaySchema
    const fields = {
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
    };

    // 1) Friends: pick one direction only to avoid duplicates
    const friends = await db
      .select(fields)
      .from(friendsTable)
      .innerJoin(
        userDisplayView,
        and(
          eq(friendsTable.fromUserId, userId),
          eq(userDisplayView.userId, friendsTable.toUserId)
        )
      )
      .all();

    // 2) Team mates: users sharing any team with current user (exclude self, dedupe)
    const myTeams = await db
      .select({teamId: teamMembersTable.teamId})
      .from(teamMembersTable)
      .where(eq(teamMembersTable.userId, userId))
      .all();

    let teamMates: typeof friends = [];
    const teamIds = myTeams.map(t => t.teamId);
    if (teamIds.length > 0) {
      teamMates = await db
        .select(fields)
        .from(teamMembersTable)
        .innerJoin(
          userDisplayView,
          eq(userDisplayView.userId, teamMembersTable.userId)
        )
        .where(
          and(
            inArray(teamMembersTable.teamId, teamIds),
            not(eq(teamMembersTable.userId, userId))
          )
        )
        .groupBy(userDisplayView.userId) // avoid duplicates when sharing multiple teams
        .all();
    }

    return {friends, teamMates};
  });

export const privateUsersRouter = {
  getCurrentUser,
  isAdmin,
  searchByName,
  getRelations,
};
