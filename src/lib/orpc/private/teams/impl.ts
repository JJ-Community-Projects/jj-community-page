import {privateTeamsContract} from './contract.ts';
import {teamsOwnerMiddleware} from './middleware.ts';
import {implement, ORPCError} from '@orpc/server';
import {dbMiddleware} from '../../middleware/dbMiddleware.ts';
import {authMiddleware} from '../../middleware/authMiddleware.ts';
import {teamInvitesTable, teamMembersTable, teamsTable} from '../../../db/schema/jj-schema.ts';
import {users} from '../../../db/schema/auth-schema.ts';
import {userDisplayView} from '../../../db/schema/views-schema.ts';
import {and, count, eq, not} from 'drizzle-orm';
import {createSlug, generateTeamSlugAlternativesLocals} from '../../../../functions/slug.ts';
import {teamMemberEventPublisher} from "../teamsSSE/teamEventPublisher.ts";

const os = implement(privateTeamsContract)
  .use(dbMiddleware);

/**
 * Team CRUD Operations
 */

/**
 * Create a new team with the authenticated user as owner
 * Validates slug availability and creates team with owner as member
 */
const create = os.createContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const userId = context.userId;
    const { name, slug } = input;

    // Create a proper slug using the createSlug function
    const validSlug = createSlug(slug);
    if (!validSlug) {
      throw new ORPCError('BAD_REQUEST', { message: 'Invalid slug format' });
    }

    try {
      const teamId = await db.transaction(async (tx) => {
        // Check if slug is available
        const existingTeam = await tx.select()
          .from(teamsTable)
          .where(eq(teamsTable.slug, validSlug))
          .get();

        if (existingTeam) {
          throw new ORPCError('CONFLICT', { message: 'Slug is already in use' });
        }

        // Create team
        const [team] = await tx.insert(teamsTable)
          .values({
            name: name,
            slug: validSlug,
            ownerId: userId,
            visible: false
          })
          .returning();

        // Add creator as member
        await tx.insert(teamMembersTable)
          .values({
            teamId: team.id,
            userId: userId
          });

        return team.id;
      });

      // Publish events for team creation (user becomes owner/member)
      teamMemberEventPublisher.acceptInvite(teamId, userId);

      return { teamId };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error creating team:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create team' });
    }
  });

/**
 * Update team information (owner only)
 * Validates slug uniqueness if changed
 */
const update = os.updateContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const team = context.team; // From teamsOwnerMiddleware
    const { name, slug, visible } = input;

    try {
      // Check slug uniqueness if changed
      if (slug !== team.slug) {
        const validSlug = createSlug(slug);
        if (!validSlug) {
          throw new ORPCError('BAD_REQUEST', { message: 'Invalid slug format' });
        }

        const existingTeam = await db.select()
          .from(teamsTable)
          .where(eq(teamsTable.slug, validSlug))
          .get();

        if (existingTeam) {
          throw new ORPCError('CONFLICT', { message: 'Slug is already in use' });
        }
      }

      await db.update(teamsTable)
        .set({
          name: name,
          slug: createSlug(slug),
          ...(visible !== undefined && { visible: visible })
        })
        .where(eq(teamsTable.id, input.teamId));

      return { success: true };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error updating team:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update team' });
    }
  });

/**
 * Delete a team (owner only)
 * Cascades to remove all members and invites
 */
const deleteTeam = os.deleteContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;

    try {
      await db.delete(teamsTable)
        .where(eq(teamsTable.id, input.teamId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting team:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete team' });
    }
  });

/**
 * Validate slug availability and generate suggestions
 * Uses existing slug generation functions
 */
const validateSlug = os.validateSlugContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const { slug, tiltifyName } = input;
    const user = context.user;

    if (!slug) {
      throw new ORPCError('BAD_REQUEST', { message: 'Slug is required' });
    }

    try {
      // Get alternatives using the generateTeamSlugAlternatives function
      // If it returns alternatives, the slug is not valid
      const alternatives = await generateTeamSlugAlternativesLocals(context.locals, slug, 3);

      // If alternatives is empty, the slug is valid
      if (alternatives.length === 0) {
        return {
          isValid: true,
          suggestions: []
        };
      }

      // Add tiltifyName as a suggestion if provided and different from slug
      let allAlternatives = [...alternatives];

      if (tiltifyName && tiltifyName.toLowerCase() !== slug.toLowerCase()) {
        const tiltifySlug = createSlug(tiltifyName);
        // Check if this slug is valid using generateTeamSlugAlternatives
        // If it returns an empty array, the slug is valid
        const tiltifyAlternatives = await generateTeamSlugAlternativesLocals(context.locals, tiltifySlug, 0);
        if (tiltifyAlternatives.length === 0) {
          allAlternatives.push(tiltifySlug);
        }
      } else if (user.tiltifyName && user.tiltifyName.toLowerCase() !== slug.toLowerCase()) {
        const userTiltifySlug = createSlug(user.tiltifyName);
        // Check if this slug is valid using generateTeamSlugAlternatives
        // If it returns an empty array, the slug is valid
        const userTiltifyAlternatives = await generateTeamSlugAlternativesLocals(context.locals, userTiltifySlug, 0);
        if (userTiltifyAlternatives.length === 0) {
          allAlternatives.push(userTiltifySlug);
        }
      }

      return {
        isValid: false,
        suggestions: allAlternatives
      };
    } catch (error) {
      console.error('Error validating slug:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to validate slug' });
    }
  });

/**
 * Team Member Operations
 */

/**
 * Leave a team (for non-owners)
 * Prevents team owner from leaving their own team
 */
const leaveTeam = os.leaveTeamContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const userId = context.userId;
    const { teamId } = input;

    // Check if team exists
    const team = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.id, teamId))
      .get();

    if (!team) {
      throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
    }

    // Prevent team owner from leaving their own team
    if (team.ownerId === userId) {
      throw new ORPCError('FORBIDDEN', { message: 'Team owner cannot leave their own team. Transfer ownership or delete the team instead.' });
    }

    // Check if user is actually a member
    const membership = await db.select()
      .from(teamMembersTable)
      .where(and(
        eq(teamMembersTable.teamId, teamId),
        eq(teamMembersTable.userId, userId)
      ))
      .get();

    if (!membership) {
      throw new ORPCError('NOT_FOUND', { message: 'You are not a member of this team' });
    }

    try {


      // Remove user from team
      await db.delete(teamMembersTable)
        .where(and(
          eq(teamMembersTable.teamId, teamId),
          eq(teamMembersTable.userId, userId)
        ));

      // Publish events for user leaving team
      teamMemberEventPublisher.leaveTeam(teamId, userId);

      return { success: true };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error leaving team:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to leave team' });
    }
  });

/**
 * Remove a member from team (owner only)
 * Prevents owner from removing themselves
 */
const removeMember = os.removeMemberContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const userId = context.userId;
    const { userId: targetUserId, teamId } = input;

    // Prevent team owner from removing themselves
    if (targetUserId === userId) {
      throw new ORPCError('FORBIDDEN', { message: 'Team owner cannot remove themselves from the team' });
    }

    try {
      // Check if target user is actually a member
      const membership = await db.select()
        .from(teamMembersTable)
        .where(and(
          eq(teamMembersTable.teamId, teamId),
          eq(teamMembersTable.userId, targetUserId)
        ))
        .get();

      if (!membership) {
        throw new ORPCError('NOT_FOUND', { message: 'User is not a member of this team' });
      }

      // Remove user from team
      await db.delete(teamMembersTable)
        .where(and(
          eq(teamMembersTable.teamId, teamId),
          eq(teamMembersTable.userId, targetUserId)
        ));

      // Publish events for member removal
      teamMemberEventPublisher.removeUserFromTeam(teamId, targetUserId);

      return { success: true };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error removing team member:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to remove team member' });
    }
  });

/**
 * Team Invite Operations
 */

/**
 * Create an invite to join team (owner only)
 * Validates that user exists and is not already a member or invited
 */
const createInvite = os.createInviteContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const { invitedUserId, teamId } = input;

    try {
      // Check if invited user exists
      const invitedUser = await db.select()
        .from(users)
        .where(eq(users.id, invitedUserId))
        .get();

      if (!invitedUser) {
        throw new ORPCError('NOT_FOUND', { message: 'User not found' });
      }

      // Check if user is already a team member
      const existingMember = await db.select()
        .from(teamMembersTable)
        .where(and(
          eq(teamMembersTable.teamId, teamId),
          eq(teamMembersTable.userId, invitedUserId)
        ))
        .get();

      if (existingMember) {
        throw new ORPCError('CONFLICT', { message: 'User is already a member of this team' });
      }

      // Create invite (using onConflictDoNothing to handle duplicate invites gracefully)
      await db.insert(teamInvitesTable)
        .values({
          teamId: teamId,
          invitedUserId: invitedUserId
        })
        .onConflictDoNothing();

      teamMemberEventPublisher.sendInvite(teamId, invitedUserId)
      return { success: true };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error creating team invite:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create team invite' });
    }
  });

/**
 * Delete an invite (owner only)
 * Removes pending invitation
 */
const deleteInvite = os.deleteInviteContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const { invitedUserId, teamId } = input;

    try {
      // Check if invite exists
      const invite = await db.select()
        .from(teamInvitesTable)
        .where(and(
          eq(teamInvitesTable.teamId, teamId),
          eq(teamInvitesTable.invitedUserId, invitedUserId)
        ))
        .get();

      if (!invite) {
        throw new ORPCError('NOT_FOUND', { message: 'Invite not found' });
      }

      // Delete invite
      await db.delete(teamInvitesTable)
        .where(and(
          eq(teamInvitesTable.teamId, teamId),
          eq(teamInvitesTable.invitedUserId, invitedUserId)
        ));

      // Publish events for invite deletion
      teamMemberEventPublisher.deleteInvite(teamId, invitedUserId);

      return { success: true };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error deleting team invite:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete team invite' });
    }
  });

/**
 * Accept an invite to join team
 * Validates invite exists and adds user as member
 */
const acceptInvite = os.acceptInviteContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const userId = context.userId;
    const { teamId } = input;

    try {
      // Check if team exists
      const team = await db.select()
        .from(teamsTable)
        .where(eq(teamsTable.id, teamId))
        .get();

      if (!team) {
        throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
      }

      // Check if user has an invite
      const invite = await db.select()
        .from(teamInvitesTable)
        .where(and(
          eq(teamInvitesTable.teamId, teamId),
          eq(teamInvitesTable.invitedUserId, userId)
        ))
        .get();

      if (!invite) {
        throw new ORPCError('NOT_FOUND', { message: 'Invite not found' });
      }

      // Accept invite: remove invite and add as member
      await db.transaction(async (tx) => {
        await tx.delete(teamInvitesTable)
          .where(and(
            eq(teamInvitesTable.teamId, teamId),
            eq(teamInvitesTable.invitedUserId, userId)
          ));

        await tx.insert(teamMembersTable)
          .values({
            teamId: teamId,
            userId: userId
          });
      });

      // Publish events for invite acceptance
      teamMemberEventPublisher.acceptInvite(teamId, userId);

      return { success: true };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error accepting team invite:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to accept team invite' });
    }
  });

/**
 * Reject an invite to join team
 * Removes pending invitation
 */
const rejectInvite = os.rejectInviteContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const userId = context.userId;
    const { teamId } = input;

    try {
      // Check if team exists
      const team = await db.select()
        .from(teamsTable)
        .where(eq(teamsTable.id, teamId))
        .get();

      if (!team) {
        throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
      }

      // Check if user has an invite
      const invite = await db.select()
        .from(teamInvitesTable)
        .where(and(
          eq(teamInvitesTable.teamId, teamId),
          eq(teamInvitesTable.invitedUserId, userId)
        ))
        .get();

      if (!invite) {
        throw new ORPCError('NOT_FOUND', { message: 'Invite not found' });
      }

      // Delete invite
      await db.delete(teamInvitesTable)
        .where(and(
          eq(teamInvitesTable.teamId, teamId),
          eq(teamInvitesTable.invitedUserId, userId)
        ));

      // Publish events for invite rejection
      teamMemberEventPublisher.rejectInvite(teamId, userId);

      return { success: true };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error rejecting team invite:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to reject team invite' });
    }
  });

/**
 * Get all teams for the authenticated user (owned or member)
 */
const getUserTeams = os.getTeamContract
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db;
    const userId = context.userId;

    try {
      // Get teams where user is owner
      const ownedTeams = await db.select()
        .from(teamsTable)
        .where(eq(teamsTable.ownerId, userId))
        .all();

      // Get teams where user is member
      const memberTeams = await db.select({
        id: teamsTable.id,
        name: teamsTable.name,
        description: teamsTable.description,
        slug: teamsTable.slug,
        ownerId: teamsTable.ownerId,
        visible: teamsTable.visible
      })
      .from(teamMembersTable)
      .innerJoin(teamsTable, eq(teamMembersTable.teamId, teamsTable.id))
      .where(eq(teamMembersTable.userId, userId))
      .all();

      // Combine and deduplicate teams
      const allTeams = [...ownedTeams];
      for (const memberTeam of memberTeams) {
        if (!allTeams.find(team => team.id === memberTeam.id)) {
          allTeams.push(memberTeam);
        }
      }

      return allTeams;
    } catch (error) {
      console.error('Error getting teams for user:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get teams' });
    }
  });

/**
 * Get all teams where the current user is the owner
 */
const getOwnedTeams = os.getOwnedTeamsContract
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db;
    const userId = context.userId;

    try {
      // Get teams where user is owner
      const ownedTeams = await db.select()
        .from(teamsTable)
        .where(eq(teamsTable.ownerId, userId))
        .all();

      return ownedTeams;
    } catch (error) {
      console.error('Error getting owned teams for user:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get owned teams' });
    }
  });

/**
 * Get all teams where the current user is not the owner (member only)
 */
const getNonOwnedTeams = os.getNonOwnedTeamsContract
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db;
    const userId = context.userId;

    try {
      // Get teams where user is member but not owner
      const memberTeams = await db.select({
        id: teamsTable.id,
        name: teamsTable.name,
        description: teamsTable.description,
        slug: teamsTable.slug,
        ownerId: teamsTable.ownerId,
        visible: teamsTable.visible
      })
      .from(teamMembersTable)
      .innerJoin(teamsTable, eq(teamMembersTable.teamId, teamsTable.id))
      .where(
        and(
          eq(teamMembersTable.userId, userId),
          not(eq(teamsTable.ownerId, userId)
          )
        )
      )
      .all();

      return memberTeams;
    } catch (error) {
      console.error('Error getting non-owned teams for user:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get non-owned teams' });
    }
  });

/**
 * Get all team members as UserDisplaySchema (owner only)
 */
const getTeamMembers = os.getTeamMembersContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const { teamId } = input;

    try {
      // Join team members with user display view to get UserDisplaySchema
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
        accentColor: userDisplayView.accentColor,
      })
      .from(teamMembersTable)
      .innerJoin(userDisplayView, eq(teamMembersTable.userId, userDisplayView.userId))
      .where(eq(teamMembersTable.teamId, teamId))
      .all();

      return members;
    } catch (error) {
      console.error('Error getting team members:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get team members' });
    }
  });

/**
 * Get team member count (owner only)
 */
const getTeamMemberCount = os.getTeamMemberCountContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const { teamId } = input;

    try {
      const result = await db.select({ count: count() })
        .from(teamMembersTable)
        .where(eq(teamMembersTable.teamId, teamId))
        .get();

      return { count: result?.count || 0 };
    } catch (error) {
      console.error('Error getting team member count:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get team member count' });
    }
  });

/**
 * Get team invite count (owner only)
 */
const getTeamInviteCount = os.getTeamInviteCountContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const { teamId } = input;

    try {
      const result = await db.select({ count: count() })
        .from(teamInvitesTable)
        .where(eq(teamInvitesTable.teamId, teamId))
        .get();

      return { count: result?.count || 0 };
    } catch (error) {
      console.error('Error getting team invite count:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get team invite count' });
    }
  });

/**
 * Get user invite count (authenticated user)
 */
const getUserInviteCount = os.getUserInviteCountContract
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db;
    const userId = context.userId;

    try {
      const result = await db.select({ count: count() })
        .from(teamInvitesTable)
        .where(eq(teamInvitesTable.invitedUserId, userId))
        .get();

      return { count: result?.count || 0 };
    } catch (error) {
      console.error('Error getting user invite count:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get user invite count' });
    }
  });

/**
 * Get user invites (authenticated user)
 */
const getUserInvites = os.getUserInvitesContract
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db;
    const userId = context.userId;

    try {
      const invites = await db.select({
        teamId: teamInvitesTable.teamId,
        name: teamsTable.name
      })
        .from(teamInvitesTable)
        .innerJoin(teamsTable, eq(teamInvitesTable.teamId, teamsTable.id))
        .where(eq(teamInvitesTable.invitedUserId, userId))
        .all();

      return invites;
    } catch (error) {
      console.error('Error getting user invites:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get user invites' });
    }
  });

/**
 * Get all invites for a specific team (owner only)
 */
const getTeamInvites = os.getTeamInvitesContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const { teamId } = input;

    try {
      // Join team invites with user display view to get UserDisplaySchema
      const invites = await db.select({
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
      .from(teamInvitesTable)
      .innerJoin(userDisplayView, eq(teamInvitesTable.invitedUserId, userDisplayView.userId))
      .where(eq(teamInvitesTable.teamId, teamId))
      .all();

      return invites;
    } catch (error) {
      console.error('Error getting team invites:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get team invites' });
    }
  });

/**
 * Get a specific team by ID
 * User must be either owner or member of the team
 */
const getTeamById = os.getTeamByIdContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db;
    const userId = context.userId;
    const { teamId } = input;

    try {
      // Get the team
      const team = await db.select()
        .from(teamsTable)
        .where(eq(teamsTable.id, teamId))
        .get();

      if (!team) {
        throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
      }

      // Check if user has access to this team (either as owner or member)
      const isOwner = team.ownerId === userId;

      if (!isOwner) {
        // Check if user is a member
        const membership = await db.select()
          .from(teamMembersTable)
          .where(and(
            eq(teamMembersTable.teamId, teamId),
            eq(teamMembersTable.userId, userId)
          ))
          .get();

        if (!membership) {
          throw new ORPCError('FORBIDDEN', { message: 'You do not have access to this team' });
        }
      }

      return team;
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error getting team by ID:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get team' });
    }
  });


export const privateTeamsRouter = {
  // Team CRUD Operations
  create,
  update,
  delete: deleteTeam,
  validateSlug,

  // Team Member Operations
  leaveTeam,
  removeMember,

  // Team Invite Operations
  createInvite,
  deleteInvite,
  acceptInvite,
  rejectInvite,

  // Team Query Operations
  getUserTeams,
  getTeamById,
  getOwnedTeams,
  getNonOwnedTeams,
  getTeamMembers,
  getTeamMemberCount,
  getTeamInviteCount,
  getTeamInvites,
  getUserInviteCount,
  getUserInvites,
};
