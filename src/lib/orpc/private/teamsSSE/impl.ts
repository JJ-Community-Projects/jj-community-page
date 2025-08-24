import {implement, ORPCError} from "@orpc/server";
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {privateTeamsSSEContract} from "./contract.ts";
import {userDisplayView} from "../../../db/schema/views-schema.ts";
import {teamInvitesTable, teamMembersTable, teamsTable} from "../../../db/schema/jj-schema.ts";
import {and, eq, not} from "drizzle-orm";
import {teamMemberEventPublisher} from "./teamEventPublisher.ts";
import type {JJDrizzleDatabase} from "../../../db/db.ts";
import {teamsOwnerMiddleware} from "../teams/middleware.ts";

const os = implement(privateTeamsSSEContract)
  .use(dbMiddleware);

/**
 * Get event-specific delay based on event type for optimal user experience.
 * Fast response for high-priority events, longer delays for less urgent ones.
 *
 * @param eventType - The type of event that occurred
 * @returns Delay in milliseconds before processing the event
 */
function getEventDelay(eventType: string): number {
  switch (eventType) {
    case 'new_invite': return 500;           // Fast response for new invites
    case 'invite_accepted': return 1000;     // Standard delay
    case 'invite_rejected': return 1500;     // Slightly slower
    case 'invite_deleted': return 1000;      // Standard delay
    case 'invite_cancelled': return 1000;    // Standard delay
    case 'member_added': return 500;         // Fast response for new members
    case 'member_removed': return 1000;      // Standard delay
    case 'member_leaved': return 1000;       // Standard delay
    case 'team_joined': return 500;          // Fast response for user joining
    case 'removed_from_team': return 1000;   // Standard delay
    case 'leave_team': return 1000;          // Standard delay
    default: return 2000;                    // Conservative default for unknown events
  }
}

/**
 * Check if an event is relevant to a specific team context.
 * Filters out events that don't affect the specified team.
 *
 * @param payload - Event payload containing teamId, userId, and event type
 * @param targetTeamId - The team ID this SSE stream is monitoring
 * @returns True if the event is relevant to the target team
 */
function isEventRelevantToTeam(payload: { teamId: number, userId: number, event: string }, targetTeamId: number): boolean {
  return payload.teamId === targetTeamId;
}

/**
 * Check if an event is relevant to a specific user context.
 * Filters out events that don't affect the specified user.
 *
 * @param payload - Event payload containing teamId, userId, and event type
 * @param targetUserId - The user ID this SSE stream is monitoring
 * @returns True if the event is relevant to the target user
 */
function isEventRelevantToUser(payload: { teamId: number, userId: number, event: string }, targetUserId: number): boolean {
  return payload.userId === targetUserId;
}

/**
 * Determine if an event requires full data refetch or can be handled incrementally.
 * Some events add data (safer to refetch), others remove data (can be optimized).
 *
 * @param eventType - The type of event that occurred
 * @returns True if full refetch is recommended, false for potential incremental handling
 */
function shouldRefetchAll(eventType: string): boolean {
  switch (eventType) {
    case 'new_invite':
    case 'member_added':
    case 'team_joined':
      return true; // These add data, safer to refetch to ensure consistency
    case 'invite_deleted':
    case 'invite_accepted':
    case 'invite_rejected':
    case 'invite_cancelled':
    case 'member_removed':
    case 'member_leaved':
    case 'removed_from_team':
    case 'leave_team':
      return true; // For now, refetch all - future optimization could handle incrementally
    default:
      return true; // Conservative default
  }
}

/**
 * Helper function to fetch team invites for a specific team.
 * Joins team invites with user display view to get complete user information.
 *
 * @param db - Drizzle database instance
 * @param teamId - ID of the team to fetch invites for
 * @returns Array of user display objects representing pending invites
 */
function getTeamInvites(db: JJDrizzleDatabase, teamId: number) {
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
    .from(teamInvitesTable)
    .innerJoin(userDisplayView, eq(teamInvitesTable.invitedUserId, userDisplayView.userId))
    .where(eq(teamInvitesTable.teamId, teamId))
    .all();
}

/**
 * Helper function to fetch team members for a specific team.
 * Joins team members with user display view to get complete user information.
 *
 * @param db - Drizzle database instance
 * @param teamId - ID of the team to fetch members for
 * @returns Array of user display objects representing current team members
 */
function getTeamMembers(db: JJDrizzleDatabase, teamId: number) {
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
    .from(teamMembersTable)
    .innerJoin(userDisplayView, eq(teamMembersTable.userId, userDisplayView.userId))
    .where(eq(teamMembersTable.teamId, teamId))
    .all();
}

/**
 * Helper function to fetch pending team invites for a specific user.
 * Joins team invites with teams table to get team information for each invitation.
 *
 * @param db - Drizzle database instance
 * @param userId - ID of the user to fetch invites for
 * @returns Array of objects containing teamId and team name for pending invitations
 */
function getUserInvites(db: JJDrizzleDatabase, userId: number) {
  return db.select({
    teamId: teamsTable.id,
    name: teamsTable.name
  })
    .from(teamInvitesTable)
    .innerJoin(teamsTable, eq(teamInvitesTable.teamId, teamsTable.id))
    .where(eq(teamInvitesTable.invitedUserId, userId))
    .all();
}


/**
 * Helper function to fetch teams owned by a specific user.
 *
 * @param db - Drizzle database instance
 * @param userId - ID of the user to fetch owned teams for
 * @returns Array of team objects where user is the owner
 */
async function getUserOwnedTeams(db: JJDrizzleDatabase, userId: number) {
  return db.select({
    id: teamsTable.id,
    ownerId: teamsTable.ownerId,
    name: teamsTable.name,
    description: teamsTable.description,
    slug: teamsTable.slug,
    visible: teamsTable.visible,
  })
    .from(teamsTable)
    .where(eq(teamsTable.ownerId, userId))
    .all();
}

/**
 * Helper function to fetch teams where user is a member (not owner).
 *
 * @param db - Drizzle database instance
 * @param userId - ID of the user to fetch member teams for
 * @returns Array of team objects where user is a member but not owner
 */
async function getUserMemberTeams(db: JJDrizzleDatabase, userId: number) {
  return db.select({
    id: teamsTable.id,
    ownerId: teamsTable.ownerId,
    name: teamsTable.name,
    description: teamsTable.description,
    slug: teamsTable.slug,
    visible: teamsTable.visible,
  })
    .from(teamsTable)
    .innerJoin(teamMembersTable, eq(teamsTable.id, teamMembersTable.teamId))
    .where(and(
      eq(teamMembersTable.userId, userId),
      not(eq(teamsTable.ownerId, userId)) // Exclude teams where user is owner
    ))
    .all();
}

/**
 * Helper function to fetch all teams associated with a user.
 * Includes both teams the user owns and teams the user is a member of.
 *
 * @param db - Drizzle database instance
 * @param userId - ID of the user to fetch teams for
 * @returns Array of team objects (TeamSchema format)
 */
async function getUserTeams(db: JJDrizzleDatabase, userId: number) {
  // Get teams where user is a member
  return db.select({
   id: teamsTable.id,
   ownerId: teamsTable.ownerId,
   name: teamsTable.name,
   description: teamsTable.description,
   slug: teamsTable.slug,
   visible: teamsTable.visible,
 })
   .from(teamsTable)
   .innerJoin(teamMembersTable, eq(teamsTable.id, teamMembersTable.teamId))
   .where(eq(teamMembersTable.userId, userId)).all()
}

/**
 * Real-time stream of team invites (owner only)
 * Streams live updates when team invitations are created or deleted
 * Requires team ownership validation through teamsOwnerMiddleware
 */
const getTeamInvitesSSE = os
  .getTeamInvitesSSEContract
  .use(teamsOwnerMiddleware)
  .handler(async function* ({context, input, signal}) {
    const db = context.db
    const teamId = input.teamId
    try {
      // Send initial data immediately
      const invites = await getTeamInvites(db, teamId)

      yield {
        invites,
        event: 'init'
      };

      // Set up polling for updates - subscribes to team admin invite list changes
      for await (const payload of teamMemberEventPublisher.subscribe('updateTeamAdminInviteList', {signal})) {
        // Filter out events not relevant to this team
        if (!isEventRelevantToTeam(payload, teamId)) {
          continue;
        }

        // Use event-specific delay for optimal responsiveness
        const delay = getEventDelay(payload.event);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Smart data fetching based on event type (currently all events refetch, but prepared for optimization)
        if (shouldRefetchAll(payload.event)) {
          const currentInvites = await getTeamInvites(db, teamId);
          yield {
            invites: currentInvites,
            event: payload.event
          };
        }
      }
    } catch (error) {
      console.error('Error in getTeamInvitesSSE:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream team invites'});
    } finally {
      console.log('getTeamInvitesSSE stream ended')
    }
  })

/**
 * Real-time stream of team members (owner only)
 * Streams live updates when team members are added or removed
 * Requires team ownership validation through teamsOwnerMiddleware
 */
const getTeamMembersSSE = os
  .getTeamMembersSSEContract
  .use(teamsOwnerMiddleware)
  .handler(async function* ({context, input, signal}) {
    const db = context.db
    const teamId = input.teamId
    try {
      // Send initial data immediately
      const members = await getTeamMembers(db, teamId)

      yield {
        invites: members, // Note: contract uses 'invites' field name for consistency
        event: 'init'
      };

      // Set up polling for updates - subscribes to team admin member list changes
      for await (const payload of teamMemberEventPublisher.subscribe('updateTeamAdminMemberList', {signal})) {
        // Filter out events not relevant to this team
        if (!isEventRelevantToTeam(payload, teamId)) {
          continue;
        }

        // Use event-specific delay for optimal responsiveness
        const delay = getEventDelay(payload.event);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Smart data fetching based on event type (currently all events refetch, but prepared for optimization)
        if (shouldRefetchAll(payload.event)) {
          const currentMembers = await getTeamMembers(db, teamId);
          yield {
            invites: currentMembers, // Note: contract uses 'invites' field name for consistency
            event: payload.event
          };
        }
      }
    } catch (error) {
      console.error('Error in getTeamMembersSSE:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream team members'});
    } finally {
      console.log('getTeamMembersSSE stream ended')
    }
  })

/**
 * Real-time stream of user invites (authenticated user)
 * Streams live updates of pending team invitations for the authenticated user
 * No input required - uses authenticated user ID from context
 * Requires authentication through authMiddleware
 */
const getUserInvitesSSE = os
  .getUserInvitesSSEContract
  .use(authMiddleware)
  .handler(async function* ({context, signal}) {
    const db = context.db
    const userId = context.userId
    try {
      // Send initial data immediately
      const invites = await getUserInvites(db, userId)

      yield {
        invites,
        event: 'init'
      };

      // Set up polling for updates - subscribes to user invite list changes
      for await (const payload of teamMemberEventPublisher.subscribe('updateUserInviteList', {signal})) {
        // Filter out events not relevant to this user
        if (!isEventRelevantToUser(payload, userId)) {
          continue;
        }

        // Use event-specific delay for optimal responsiveness
        const delay = getEventDelay(payload.event);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Smart data fetching based on event type (currently all events refetch, but prepared for optimization)
        if (shouldRefetchAll(payload.event)) {
          const currentInvites = await getUserInvites(db, userId);
          yield {
            invites: currentInvites,
            event: payload.event
          };
        }
      }
    } catch (error) {
      console.error('Error in getUserInvitesSSE:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream user invites'});
    } finally {
      console.log('getUserInvitesSSE stream ended')
    }
  })


/**
 * Real-time stream of user member teams (authenticated user - member access)
 * Streams live updates of teams the authenticated user is a member of (not owner)
 * No input required - uses authenticated user ID from context
 * Requires authentication through authMiddleware
 */
const getUserTeamsSSE = os
  .getUserTeamsSSEContract
  .use(authMiddleware)
  .handler(async function* ({context, signal}) {
    const db = context.db
    const userId = context.userId
    try {
      // Send initial data immediately - only member teams
      const memberTeams = await getUserMemberTeams(db, userId)

      yield {
        teams: memberTeams,
        event: 'init'
      };

      // Set up polling for updates - subscribes to user team list changes
      for await (const payload of teamMemberEventPublisher.subscribe('updateUserTeamList', {signal})) {
        // Filter out events not relevant to this user
        if (!isEventRelevantToUser(payload, userId)) {
          continue;
        }

        // Use event-specific delay for optimal responsiveness
        const delay = getEventDelay(payload.event);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Smart data fetching based on event type
        if (shouldRefetchAll(payload.event)) {
          const currentMemberTeams = await getUserMemberTeams(db, userId);

          yield {
            teams: currentMemberTeams,
            event: payload.event
          };
        }
      }
    } catch (error) {
      console.error('Error in getUserTeamsSSE:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream user member teams'});
    } finally {
      console.log('getUserTeamsSSE stream ended')
    }
  })


/**
 * Real-time stream of user owned teams (authenticated user - admin access)
 * Streams live updates of teams the authenticated user owns
 * No input required - uses authenticated user ID from context
 * Requires authentication through authMiddleware
 */
const getUserTeamsAdminSSE = os
  .getUserTeamsAdminSSEContract
  .use(authMiddleware)
  .handler(async function* ({context, signal}) {
    const db = context.db
    const userId = context.userId
    try {
      // Send initial data immediately - only owned teams
      const ownedTeams = await getUserOwnedTeams(db, userId)

      yield {
        teams: ownedTeams,
        event: 'init'
      };

      // Set up polling for updates - subscribes to user team list changes
      for await (const payload of teamMemberEventPublisher.subscribe('updateUserTeamList', {signal})) {
        // Filter out events not relevant to this user
        if (!isEventRelevantToUser(payload, userId)) {
          continue;
        }

        // Use event-specific delay for optimal responsiveness
        const delay = getEventDelay(payload.event);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Smart data fetching based on event type
        if (shouldRefetchAll(payload.event)) {
          const currentOwnedTeams = await getUserOwnedTeams(db, userId);

          yield {
            teams: currentOwnedTeams,
            event: payload.event
          };
        }
      }
    } catch (error) {
      console.error('Error in getUserTeamsAdminSSE:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream user owned teams'});
    } finally {
      console.log('getUserTeamsAdminSSE stream ended')
    }
  })

/**
 * Real-time stream of user team invites count (authenticated user)
 * Streams live updates of the count of pending team invitations for the authenticated user
 * No input required - uses authenticated user ID from context
 * Requires authentication through authMiddleware
 */
const getUserTeamInvitesCountSSE = os
  .getUserTeamInvitesCountSSEContract
  .use(authMiddleware)
  .handler(async function* ({context, signal}) {
    const db = context.db
    const userId = context.userId
    try {
      // Send initial count immediately
      const invites = await getUserInvites(db, userId)
      const count = invites.length

      yield {
        count,
        event: 'init'
      };

      // Set up polling for updates - subscribes to user invite list changes
      for await (const payload of teamMemberEventPublisher.subscribe('updateUserInviteList', {signal})) {
        // Filter out events not relevant to this user
        if (!isEventRelevantToUser(payload, userId)) {
          continue;
        }

        // Use event-specific delay for optimal responsiveness
        const delay = getEventDelay(payload.event);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Smart data fetching based on event type (currently all events refetch, but prepared for optimization)
        if (shouldRefetchAll(payload.event)) {
          const currentInvites = await getUserInvites(db, userId);
          const currentCount = currentInvites.length;
          yield {
            count: currentCount,
            event: payload.event
          };
        }
      }
    } catch (error) {
      console.error('Error in getUserTeamInvitesCountSSE:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream team invites count'});
    } finally {
      console.log('getUserTeamInvitesCountSSE stream ended')
    }
  })

/**
 * Export all SSE router procedures for team-related real-time functionality
 */
export const privateTeamsSSERouter = {
  getTeamInvitesSSE,
  getTeamMembersSSE,
  getUserInvitesSSE,
  getUserTeamsSSE,
  getUserTeamsAdminSSE,
  getUserTeamInvitesCountSSE
}
