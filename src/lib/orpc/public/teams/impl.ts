import {publicTeamsContract} from './contract.ts';
import {implement, ORPCError} from '@orpc/server';
import {dbMiddleware} from '../../middleware/dbMiddleware.ts';
import {teamMembersTable, teamsTable} from '../../../db/schema/jj-schema.ts';
import {accounts, users} from '../../../db/schema/auth-schema.ts';
import {userDisplayView} from '../../../db/schema/views-schema.ts';
import {and, count, eq} from 'drizzle-orm';

const os = implement(publicTeamsContract)
  .use(dbMiddleware);

/**
 * Find all visible teams
 * Returns all teams where visible = true
 */
const findVisible = os.findVisible
  .handler(async ({ context }) => {
    const db = context.db;

    try {
      const teams = await db.select()
        .from(teamsTable)
        .where(eq(teamsTable.visible, true))
        .all();

      return teams;
    } catch (error) {
      console.error('Error finding visible teams:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to retrieve visible teams'
      });
    }
  });

/**
 * Find all visible teams with member count
 * Returns all visible teams with their member counts
 */
const findAllVisibleWithMemberCount = os.findAllVisibleWithMemberCount
  .handler(async ({ context }) => {
    const db = context.db;

    try {
      const teams = await db.select({
        id: teamsTable.id,
        name: teamsTable.name,
        slug: teamsTable.slug,
        description: teamsTable.description,
        visible: teamsTable.visible,
        ownerId: teamsTable.ownerId,
        memberCount: count(teamMembersTable.userId)
      })
      .from(teamsTable)
      .leftJoin(teamMembersTable, eq(teamsTable.id, teamMembersTable.teamId))
      .where(eq(teamsTable.visible, true))
      .groupBy(teamsTable.id)
      .all();

      return teams;
    } catch (error) {
      console.error('Error finding visible teams with member count:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to retrieve teams with member counts'
      });
    }
  });

/**
 * Get team by slug with owner information
 * Returns team details with owner info for public viewing
 */
const getBySlug = os.getBySlug
  .handler(async ({ context, input }) => {
    const db = context.db;
    const { slug } = input;

    try {
      const team = await db.select({
        id: teamsTable.id,
        name: teamsTable.name,
        slug: teamsTable.slug,
        description: teamsTable.description,
        visible: teamsTable.visible,
        ownerId: teamsTable.ownerId,
        ownerName: accounts.providerUsername,
        ownerTiltifyName: accounts.providerUsername
      })
      .from(teamsTable)
      .innerJoin(users, eq(teamsTable.ownerId, users.id))
      .innerJoin(accounts, and(
        eq(users.id, accounts.userId),
        eq(accounts.provider, 'tiltify')
      ))
      .where(and(
        eq(teamsTable.slug, slug),
        eq(teamsTable.visible, true)
      ))
      .get();

      return { team: team || null };
    } catch (error) {
      console.error('Error getting team by slug:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to retrieve team'
      });
    }
  });

/**
 * Get team members by team ID in user display format
 * Returns team member details for public viewing (only for visible teams)
 */
const getMembers = os.getMembers
  .handler(async ({ context, input }) => {
    const db = context.db;
    const { teamId } = input;

    try {
      // First check if team exists and is visible
      const team = await db.select()
        .from(teamsTable)
        .where(and(
          eq(teamsTable.id, teamId),
          eq(teamsTable.visible, true)
        ))
        .get();

      if (!team) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Team not found or not visible'
        });
      }

      // Get team members in user display format
      const members = await db.select({
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
        accentColor: userDisplayView.accentColor
      })
      .from(teamMembersTable)
      .innerJoin(userDisplayView, eq(teamMembersTable.userId, userDisplayView.userId))
      .where(eq(teamMembersTable.teamId, teamId))
      .all();

      return { members };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error getting team members:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to retrieve team members'
      });
    }
  });

export const publicTeamsRouter = {
  findVisible,
  findAllVisibleWithMemberCount,
  getBySlug,
  getMembers
};
