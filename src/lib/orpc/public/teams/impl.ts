import {publicTeamsContract} from './contract.ts';
import {implement, ORPCError} from '@orpc/server';
import {dbMiddleware} from '../../middleware/dbMiddleware.ts';
import {teamMembersTable, teamsTable} from '../../../db/schema/jj-schema.ts';
import {accounts, users} from '../../../db/schema/auth-schema.ts';
import {userDisplayView} from '../../../db/schema/views-schema.ts';
import {and, count, eq} from 'drizzle-orm';
import {input} from "gel/dist/systemUtils";

const os = implement(publicTeamsContract)
  .use(dbMiddleware);

/**
 * Find all visible teams
 * Returns all teams where visible = true
 */
const findVisible = os.findVisibleContract
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
const findAllVisibleWithMemberCount = os.findAllVisibleWithMemberCountContract
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
const getBySlug = os.getBySlugContract
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
const getMembers = os.getMembersContract
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


/**
 * Get teams by user ID
 * Returns all teams that the specified user is a member of
 * This includes teams where the user is either a member or owner
 */
const getTeamsByUserId = os.getTeamsByUserIdContract
  .handler(async ({context, input: userId}) => {
    const db = context.db;

    try {
      // Query teams where the user is a member through teamMembersTable
      // This will include teams where the user is both a regular member and owner
      const teams = await db.select({
        id: teamsTable.id,
        name: teamsTable.name,
        slug: teamsTable.slug,
        description: teamsTable.description,
        visible: teamsTable.visible,
        ownerId: teamsTable.ownerId
      })
      .from(teamMembersTable)
      .innerJoin(teamsTable, eq(teamMembersTable.teamId, teamsTable.id))
      .where(eq(teamMembersTable.userId, userId))
      .all();

      return { teams };
    } catch (error) {
      console.error('Error getting teams by user ID:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to retrieve user teams'
      });
    }
  });
export const publicTeamsRouter = {
  findVisible,
  findAllVisibleWithMemberCount,
  getBySlug,
  getMembers,
  getTeamsByUserId
};
