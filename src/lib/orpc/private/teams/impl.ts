import { privateTeamsContract } from './contract.ts'
import { teamsOwnerMiddleware } from './middleware.ts'
import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { authMiddleware } from '../../middleware/authMiddleware.ts'
import {
  teamInvitesTable,
  teamMembersTable,
  teamsTable,
} from '../../../db/schema/jj-schema.ts'
import { users } from '../../../db/schema/auth-schema.ts'
import type { JJDrizzleDatabase } from '../../../db/db.ts'
import { and, eq, not, sql } from 'drizzle-orm'
import {
  createSlug,
  slugFreeFrom,
  slugLookups,
  validateSlugFor,
} from '../../../../functions/slug.ts'
import {
  publishTeamAdminInvitesUpdate,
  publishTeamAdminMembersUpdate,
  publishUserInvitesUpdate,
  publishUserTeamsUpdate,
} from '../teamsWS/publisher.ts'
import { forgetPublicTeam } from '../../../services/visibilityCache.ts'
import {
  canCreateTeamFrom,
  checkCanCreateTeam,
  checkCanInviteUser,
  ownedTeamsCount,
} from '../util/limits.ts'

const os = implement(privateTeamsContract).use(dbMiddleware)

const teamMemberIds = (db: JJDrizzleDatabase, teamId: number) =>
  db
    .select({ userId: teamMembersTable.userId })
    .from(teamMembersTable)
    .where(eq(teamMembersTable.teamId, teamId))

const teamInviteeIds = (db: JJDrizzleDatabase, teamId: number) =>
  db
    .select({ userId: teamInvitesTable.invitedUserId })
    .from(teamInvitesTable)
    .where(eq(teamInvitesTable.teamId, teamId))

/** A team was renamed, hidden or deleted: refresh its members' team lists and its invitees' invite lists. */
async function publishTeamChange(
  env: Env,
  members: { userId: number }[],
  invites: { userId: number }[],
) {
  await Promise.all([
    ...members.map(({ userId }) => publishUserTeamsUpdate(env, userId)),
    ...invites.map(({ userId }) => publishUserInvitesUpdate(env, userId)),
  ])
}

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
    const db = context.db
    const userId = context.userId
    const { name, slug } = input

    // The slug as it will be stored; the dialog checks the same normalised slug (F-59)
    const validSlug = createSlug(slug)

    // One round trip: the owner limit, and whether the slug is another user's username or taken
    const [ownedRows, ...slugRows] = await db.batch([
      ownedTeamsCount(db, userId),
      ...(validSlug ? slugLookups(db, 'team', userId, [validSlug]) : []),
    ])

    const teamLimit = canCreateTeamFrom(ownedRows)
    if (!teamLimit.canCreate) {
      throw new ORPCError('FORBIDDEN', {
        message: 'Team owner limit reached',
        ...teamLimit,
      })
    }

    if (!validSlug) {
      throw new ORPCError('BAD_REQUEST', { message: 'Invalid slug format' })
    }

    if (!slugFreeFrom(slugRows)(validSlug)) {
      throw new ORPCError('CONFLICT', { message: 'Slug is already in use' })
    }

    try {
      // The team and its owner's membership in one atomic batch (SOC-02)
      const [[team]] = await db.batch([
        db
          .insert(teamsTable)
          .values({
            name: name,
            slug: validSlug,
            ownerId: userId,
            visible: false,
          })
          .returning(),
        db.insert(teamMembersTable).select(
          db
            .select({
              teamId: teamsTable.id,
              userId: sql<number>`${userId}`.as('user_id'),
            })
            .from(teamsTable)
            .where(eq(teamsTable.slug, validSlug)),
        ),
      ])

      const teamId = team.id

      // Publish WS updates for team creation (user becomes owner/member)
      await Promise.all([
        publishUserTeamsUpdate(context.env, userId),
        publishTeamAdminMembersUpdate(context.env, teamId),
      ])

      return { teamId }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error creating team:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to create team',
      })
    }
  })

/**
 * Update team information (owner only)
 * Validates slug uniqueness if changed
 */
const update = os.updateContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const team = context.team // From teamsOwnerMiddleware
    const { name, slug, visible, description } = input

    // The slug as it will be stored; checked like create, only when it changes (F-59)
    const validSlug = createSlug(slug)
    if (!validSlug) {
      throw new ORPCError('BAD_REQUEST', { message: 'Invalid slug format' })
    }

    try {
      if (validSlug !== team.slug) {
        const slugRows = await db.batch(slugLookups(db, 'team', team.ownerId, [validSlug]))
        if (!slugFreeFrom(slugRows)(validSlug)) {
          throw new ORPCError('CONFLICT', { message: 'Slug is already in use' })
        }
      }

      const [, members, invites] = await db.batch([
        db
          .update(teamsTable)
          .set({
            name: name,
            slug: validSlug,
            ...(visible !== undefined && { visible: visible }),
            ...(description !== undefined && {
              description: description ?? null,
            }),
          })
          .where(eq(teamsTable.id, input.teamId)),
        teamMemberIds(db, input.teamId),
        teamInviteeIds(db, input.teamId),
      ])

      if (visible !== undefined && visible !== team.visible) {
        await forgetPublicTeam(db, context.request.url, team)
      }

      // Members' team lists and invitees' invite lists show the team's name (F-10)
      await publishTeamChange(context.env, members, invites)

      return { success: true }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error updating team:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to update team',
      })
    }
  })

/**
 * Delete a team (owner only)
 * Cascades to remove all members and invites
 */
const deleteTeam = os.deleteContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db

    try {
      // Who to tell, read before the delete cascades members and invites (F-10)
      const [members, invites] = await db.batch([
        teamMemberIds(db, input.teamId),
        teamInviteeIds(db, input.teamId),
        db.delete(teamsTable).where(eq(teamsTable.id, input.teamId)),
      ])

      await publishTeamChange(context.env, members, invites)

      return { success: true }
    } catch (error) {
      console.error('Error deleting team:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to delete team',
      })
    }
  })

/**
 * Validate slug availability and generate suggestions (one round trip, see validateSlugFor)
 */
const validateSlug = os.validateSlugContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const { slug, tiltifyName } = input

    if (!slug) {
      throw new ORPCError('BAD_REQUEST', { message: 'Slug is required' })
    }

    try {
      return await validateSlugFor('team', context.user, slug, tiltifyName)
    } catch (error) {
      console.error('Error validating slug:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to validate slug',
      })
    }
  })

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
    const db = context.db
    const userId = context.userId
    const { teamId } = input

    // Check if team exists
    const team = await db
      .select()
      .from(teamsTable)
      .where(eq(teamsTable.id, teamId))
      .get()

    if (!team) {
      throw new ORPCError('NOT_FOUND', { message: 'Team not found' })
    }

    // Prevent team owner from leaving their own team
    if (team.ownerId === userId) {
      throw new ORPCError('FORBIDDEN', {
        message:
          'Team owner cannot leave their own team. Transfer ownership or delete the team instead.',
      })
    }

    // Check if user is actually a member
    const membership = await db
      .select()
      .from(teamMembersTable)
      .where(
        and(
          eq(teamMembersTable.teamId, teamId),
          eq(teamMembersTable.userId, userId),
        ),
      )
      .get()

    if (!membership) {
      throw new ORPCError('NOT_FOUND', {
        message: 'You are not a member of this team',
      })
    }

    try {
      // Remove user from team
      await db
        .delete(teamMembersTable)
        .where(
          and(
            eq(teamMembersTable.teamId, teamId),
            eq(teamMembersTable.userId, userId),
          ),
        )

      // Publish WS updates for user leaving team
      await Promise.all([
        publishUserTeamsUpdate(context.env, userId),
        publishTeamAdminMembersUpdate(context.env, teamId),
      ])

      return { success: true }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error leaving team:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to leave team',
      })
    }
  })

/**
 * Remove a member from team (owner only)
 * Prevents owner from removing themselves
 */
const removeMember = os.removeMemberContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const userId = context.userId
    const { userId: targetUserId, teamId } = input

    // Prevent team owner from removing themselves
    if (targetUserId === userId) {
      throw new ORPCError('FORBIDDEN', {
        message: 'Team owner cannot remove themselves from the team',
      })
    }

    try {
      // Check if target user is actually a member
      const membership = await db
        .select()
        .from(teamMembersTable)
        .where(
          and(
            eq(teamMembersTable.teamId, teamId),
            eq(teamMembersTable.userId, targetUserId),
          ),
        )
        .get()

      if (!membership) {
        throw new ORPCError('NOT_FOUND', {
          message: 'User is not a member of this team',
        })
      }

      // Remove user from team
      await db
        .delete(teamMembersTable)
        .where(
          and(
            eq(teamMembersTable.teamId, teamId),
            eq(teamMembersTable.userId, targetUserId),
          ),
        )

      // Publish WS updates for member removal
      await Promise.all([
        publishUserTeamsUpdate(context.env, targetUserId),
        publishTeamAdminMembersUpdate(context.env, teamId),
      ])

      return { success: true }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error removing team member:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to remove team member',
      })
    }
  })

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
    const db = context.db
    const { invitedUserId, teamId } = input

    try {
      // Check if invited user exists
      const invitedUser = await db
        .select()
        .from(users)
        .where(eq(users.id, invitedUserId))
        .get()

      if (!invitedUser) {
        throw new ORPCError('NOT_FOUND', { message: 'User not found' })
      }

      // Check if user is already a team member
      const existingMember = await db
        .select()
        .from(teamMembersTable)
        .where(
          and(
            eq(teamMembersTable.teamId, teamId),
            eq(teamMembersTable.userId, invitedUserId),
          ),
        )
        .get()

      if (existingMember) {
        throw new ORPCError('CONFLICT', {
          message: 'User is already a member of this team',
        })
      }

      // Enforce membership limit before inviting
      const membershipLimit = await checkCanInviteUser(db, invitedUserId)
      if (!membershipLimit.canInvite) {
        throw new ORPCError('FORBIDDEN', {
          message: 'User is at team membership limit',
          ...membershipLimit,
        })
      }

      // Create invite (using onConflictDoNothing to handle duplicate invites gracefully)
      await db
        .insert(teamInvitesTable)
        .values({
          teamId: teamId,
          invitedUserId: invitedUserId,
        })
        .onConflictDoNothing()

      await Promise.all([
        publishUserInvitesUpdate(context.env, invitedUserId),
        publishTeamAdminInvitesUpdate(context.env, teamId),
      ])

      return { success: true }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error creating team invite:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to create team invite',
      })
    }
  })

/**
 * Delete an invite (owner only)
 * Removes pending invitation
 */
const deleteInvite = os.deleteInviteContract
  .use(authMiddleware)
  .use(teamsOwnerMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const { invitedUserId, teamId } = input

    try {
      // Check if invite exists
      const invite = await db
        .select()
        .from(teamInvitesTable)
        .where(
          and(
            eq(teamInvitesTable.teamId, teamId),
            eq(teamInvitesTable.invitedUserId, invitedUserId),
          ),
        )
        .get()

      if (!invite) {
        throw new ORPCError('NOT_FOUND', { message: 'Invite not found' })
      }

      // Delete invite
      await db
        .delete(teamInvitesTable)
        .where(
          and(
            eq(teamInvitesTable.teamId, teamId),
            eq(teamInvitesTable.invitedUserId, invitedUserId),
          ),
        )

      // Publish WS updates for invite deletion
      await Promise.all([
        publishUserInvitesUpdate(context.env, invitedUserId),
        publishTeamAdminInvitesUpdate(context.env, teamId),
      ])

      return { success: true }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error deleting team invite:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to delete team invite',
      })
    }
  })

/**
 * Accept an invite to join team
 * Validates invite exists and adds user as member
 */
const acceptInvite = os.acceptInviteContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const userId = context.userId
    const { teamId } = input

    try {
      // Check if team exists
      const team = await db
        .select()
        .from(teamsTable)
        .where(eq(teamsTable.id, teamId))
        .get()

      if (!team) {
        throw new ORPCError('NOT_FOUND', { message: 'Team not found' })
      }

      // Check if user has an invite
      const invite = await db
        .select()
        .from(teamInvitesTable)
        .where(
          and(
            eq(teamInvitesTable.teamId, teamId),
            eq(teamInvitesTable.invitedUserId, userId),
          ),
        )
        .get()

      if (!invite) {
        throw new ORPCError('NOT_FOUND', { message: 'Invite not found' })
      }

      // Enforce membership limit before accepting
      const membershipLimit = await checkCanInviteUser(db, userId)
      if (!membershipLimit.canInvite) {
        throw new ORPCError('FORBIDDEN', {
          message: 'Team membership limit reached',
          ...membershipLimit,
        })
      }

      // Accept invite: remove invite and add as member
      await db
        .delete(teamInvitesTable)
        .where(
          and(
            eq(teamInvitesTable.teamId, teamId),
            eq(teamInvitesTable.invitedUserId, userId),
          ),
        )

      await db.insert(teamMembersTable).values({
        teamId: teamId,
        userId: userId,
      })

      // Publish WS updates for invite acceptance
      await Promise.all([
        publishUserInvitesUpdate(context.env, userId),
        publishUserTeamsUpdate(context.env, userId),
        publishTeamAdminInvitesUpdate(context.env, teamId),
        publishTeamAdminMembersUpdate(context.env, teamId),
      ])

      return { success: true }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error accepting team invite:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to accept team invite',
      })
    }
  })

/**
 * Reject an invite to join team
 * Removes pending invitation
 */
const rejectInvite = os.rejectInviteContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const userId = context.userId
    const { teamId } = input

    try {
      // Check if team exists
      const team = await db
        .select()
        .from(teamsTable)
        .where(eq(teamsTable.id, teamId))
        .get()

      if (!team) {
        throw new ORPCError('NOT_FOUND', { message: 'Team not found' })
      }

      // Check if user has an invite
      const invite = await db
        .select()
        .from(teamInvitesTable)
        .where(
          and(
            eq(teamInvitesTable.teamId, teamId),
            eq(teamInvitesTable.invitedUserId, userId),
          ),
        )
        .get()

      if (!invite) {
        throw new ORPCError('NOT_FOUND', { message: 'Invite not found' })
      }

      // Delete invite
      await db
        .delete(teamInvitesTable)
        .where(
          and(
            eq(teamInvitesTable.teamId, teamId),
            eq(teamInvitesTable.invitedUserId, userId),
          ),
        )

      // Publish WS updates for invite rejection
      await Promise.all([
        publishUserInvitesUpdate(context.env, userId),
        publishTeamAdminInvitesUpdate(context.env, teamId),
      ])

      return { success: true }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error rejecting team invite:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to reject team invite',
      })
    }
  })

/**
 * Get all teams for the authenticated user (owned or member)
 */
const getUserTeams = os.getTeamContract
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db
    const userId = context.userId

    try {
      // Get teams where user is owner
      const ownedTeams = await db
        .select()
        .from(teamsTable)
        .where(eq(teamsTable.ownerId, userId))
        .all()

      // Get teams where user is member
      const memberTeams = await db
        .select({
          id: teamsTable.id,
          name: teamsTable.name,
          description: teamsTable.description,
          slug: teamsTable.slug,
          ownerId: teamsTable.ownerId,
          visible: teamsTable.visible,
        })
        .from(teamMembersTable)
        .innerJoin(teamsTable, eq(teamMembersTable.teamId, teamsTable.id))
        .where(eq(teamMembersTable.userId, userId))
        .all()

      // Combine and deduplicate teams
      const allTeams = [...ownedTeams]
      for (const memberTeam of memberTeams) {
        if (!allTeams.find((team) => team.id === memberTeam.id)) {
          allTeams.push(memberTeam)
        }
      }

      return allTeams
    } catch (error) {
      console.error('Error getting teams for user:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get teams',
      })
    }
  })

/**
 * Get a specific team by ID
 * User must be either owner or member of the team
 */
const getTeamById = os.getTeamByIdContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const userId = context.userId
    const { teamId } = input

    try {
      // Get the team
      const team = await db
        .select()
        .from(teamsTable)
        .where(eq(teamsTable.id, teamId))
        .get()

      if (!team) {
        throw new ORPCError('NOT_FOUND', { message: 'Team not found' })
      }

      // Check if user has access to this team (either as owner or member)
      const isOwner = team.ownerId === userId

      if (!isOwner) {
        // Check if user is a member
        const membership = await db
          .select()
          .from(teamMembersTable)
          .where(
            and(
              eq(teamMembersTable.teamId, teamId),
              eq(teamMembersTable.userId, userId),
            ),
          )
          .get()

        if (!membership) {
          throw new ORPCError('FORBIDDEN', {
            message: 'You do not have access to this team',
          })
        }
      }

      return team
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error getting team by ID:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get team',
      })
    }
  })

// Limit-checks
const canCreateTeam = os.canCreateTeamContract
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const { db, userId } = context
    return checkCanCreateTeam(db, userId)
  })

const canInviteCurrentUser = os.canInviteCurrentUserContract
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const { db, userId } = context
    return checkCanInviteUser(db, userId)
  })

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

  // Limit-checks
  canCreateTeam,
  canInviteCurrentUser,
}
