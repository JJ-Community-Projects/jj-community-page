import {EventPublisher} from '@orpc/server'

/**
 * Event types for user invite list updates
 */
type UserInviteEvent = 'new_invite' | 'invite_accepted' | 'invite_rejected' | 'invite_cancelled';

/**
 * Event types for user team list updates
 */
type UserTeamEvent = 'team_joined' | 'removed_from_team' | 'leave_team';

/**
 * Event types for team admin invite list updates
 */
type TeamAdminInviteEvent = 'new_invite' | 'invite_accepted' | 'invite_rejected' | 'invite_deleted';

/**
 * Event types for team admin member list updates
 */
type TeamAdminMemberEvent = 'member_added' | 'member_removed' | 'member_leaved';

/**
 * Custom TeamMemberEventPublisher class that extends the base EventPublisher
 * to provide convenient methods for publishing team-related events.
 *
 * This class consolidates all team event publishing logic into a single interface,
 * making it easier to trigger the appropriate SSE events when team operations occur.
 * Each method handles publishing multiple related events as needed for complete
 * real-time synchronization across the application.
 *
 * @extends EventPublisher
 */
class TeamMemberEventPublisher extends EventPublisher<{
  updateUserInviteList: { teamId: number, userId: number, event: UserInviteEvent },
  updateUserTeamList: { teamId: number, userId: number, event: UserTeamEvent },
  updateTeamAdminInviteList: { teamId: number, userId: number, event: TeamAdminInviteEvent },
  updateTeamAdminMemberList: { teamId: number, userId: number, event: TeamAdminMemberEvent },
}> {

  /**
   * Publishes events when a team invitation is sent to a user.
   *
   * Triggers two events:
   * - updateUserInviteList: Notifies the invited user of the new invitation
   * - updateTeamAdminInviteList: Notifies team owners of the new outgoing invitation
   *
   * @param teamId - The ID of the team extending the invitation
   * @param userId - The ID of the user being invited
   */
  sendInvite(teamId: number, userId: number) {
    this.publish('updateUserInviteList', {teamId, userId, event: 'new_invite'})
    this.publish('updateTeamAdminInviteList', {teamId, userId, event: 'new_invite'})
  }

  /**
   * Publishes events when a user accepts a team invitation.
   *
   * Triggers four events to ensure all relevant parties are notified:
   * - updateUserInviteList: Updates the user's invitation list (invite removed)
   * - updateUserTeamList: Updates the user's team membership list (new team added)
   * - updateTeamAdminInviteList: Updates team owners' pending invitations list
   * - updateTeamAdminMemberList: Updates team owners' member list (new member added)
   *
   * @param teamId - The ID of the team the user is joining
   * @param userId - The ID of the user accepting the invitation
   */
  acceptInvite(teamId: number, userId: number) {
    this.publish('updateUserInviteList', {teamId, userId, event: 'invite_accepted'})
    this.publish('updateUserTeamList', {teamId, userId, event: 'team_joined'})
    this.publish('updateTeamAdminInviteList', {teamId, userId, event: 'invite_accepted'})
    this.publish('updateTeamAdminMemberList', {teamId, userId, event: 'member_added'})
  }

  /**
   * Publishes events when a user rejects a team invitation.
   *
   * Triggers two events:
   * - updateUserInviteList: Updates the user's invitation list (invite removed)
   * - updateTeamAdminInviteList: Notifies team owners that the invitation was rejected
   *
   * @param teamId - The ID of the team whose invitation was rejected
   * @param userId - The ID of the user rejecting the invitation
   */
  rejectInvite(teamId: number, userId: number) {
    this.publish('updateUserInviteList', {teamId, userId, event: 'invite_rejected'})
    this.publish('updateTeamAdminInviteList', {teamId, userId, event: 'invite_rejected'})
  }

  /**
   * Publishes events when a team owner deletes/cancels a pending invitation.
   *
   * Triggers two events:
   * - updateUserInviteList: Updates the invited user's invitation list (invite removed)
   * - updateTeamAdminInviteList: Updates team owners' pending invitations list
   *
   * @param teamId - The ID of the team whose invitation is being deleted
   * @param userId - The ID of the user whose invitation is being cancelled
   */
  deleteInvite(teamId: number, userId: number) {
    this.publish('updateUserInviteList', {teamId, userId, event: 'invite_cancelled'})
    this.publish('updateTeamAdminInviteList', {teamId, userId, event: 'invite_deleted'})
  }

  /**
   * Publishes events when a user is removed from a team.
   *
   * Triggers two events:
   * - updateUserTeamList: Updates the removed user's team membership list
   * - updateTeamAdminMemberList: Updates team owners' member list (member removed)
   *
   * @param teamId - The ID of the team the user is being removed from
   * @param userId - The ID of the user being removed from the team
   */
  removeUserFromTeam(teamId: number, userId: number) {
    this.publish('updateUserTeamList', {teamId, userId, event: 'removed_from_team'})
    this.publish('updateTeamAdminMemberList', {teamId, userId, event: 'member_removed'})
  }

  /**
   * Publishes events when a user voluntarily leaves a team.
   *
   * This method is distinct from removeUserFromTeam as it handles the case where
   * a user initiates leaving the team themselves, rather than being removed by an owner.
   *
   * Triggers two events:
   * - updateUserTeamList: Updates the user's team membership list (team removed)
   * - updateTeamAdminMemberList: Updates team owners' member list (member left)
   *
   * @param teamId - The ID of the team the user is leaving
   * @param userId - The ID of the user who is voluntarily leaving the team
   */
  leaveTeam(teamId: number, userId: number) {
    this.publish('updateUserTeamList', {teamId, userId, event: 'leave_team'})
    this.publish('updateTeamAdminMemberList', {teamId, userId, event: 'member_leaved'})
  }
}


/**
 * Consolidated team member event publisher for all team-related real-time updates.
 *
 * This EventPublisher handles all team-related Server-Sent Events (SSE) for real-time
 * communication between the server and client components. It consolidates what were
 * previously four separate EventPublishers into a single, unified interface.
 *
 * Event types and their purposes:
 *
 * **updateUserInviteList**: Notifies users when their invitation list changes
 * - Payload: { userId: number } - The user whose invite list changed
 * - Triggers: New invitations received, invitations accepted/rejected/cancelled
 * - Used by: getUserInvitesSSEContract for streaming user's pending invitations
 *
 * **updateUserTeamList**: Notifies users when their team membership changes
 * - Payload: { userId: number } - The user whose team list changed
 * - Triggers: Joining/leaving teams, being removed from teams, creating teams
 * - Used by: getUserTeamsSSEContract for streaming user's owned/member teams
 *
 * **updateTeamAdminInviteList**: Notifies team owners when their team's invites change
 * - Payload: { teamId: number } - The team whose invitation list changed
 * - Triggers: Invitations sent, accepted, rejected, or cancelled by owners
 * - Used by: getTeamInvitesSSEContract for streaming team's pending invitations
 *
 * **updateTeamAdminMemberList**: Notifies team owners when their team's member list changes
 * - Payload: { teamId: number } - The team whose member list changed
 * - Triggers: Members joining/leaving, members being removed, ownership transfers
 * - Used by: getTeamMembersSSEContract for streaming team's current members
 *
 * Usage patterns:
 * - Called after successful database operations in team management handlers
 * - Multiple events may be published for a single operation (e.g., accepting an invite
 *   triggers both user invite list and team member list updates)
 * - Events are only published after successful database transactions to ensure consistency
 *
 * Integration with SSE contracts:
 * - Each event type corresponds to a specific SSE contract in privateTeamsSSEContract
 * - Event payloads contain identifiers needed for the SSE handlers to fetch fresh data
 * - Real-time updates ensure UI components stay synchronized with database state
 */
export const teamMemberEventPublisher = new TeamMemberEventPublisher();
