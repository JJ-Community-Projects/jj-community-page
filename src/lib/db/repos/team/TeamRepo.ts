// src/lib/db/newRepos/team/TeamRepo.ts
import type {ActionAPIContext} from "astro:actions";
import {eq} from "drizzle-orm";
import {BaseRepo} from "../base/BaseRepo";
import type {RepoEnv} from "../../RepoEnv.ts";
import {TeamSection} from "./sections/TeamSection";
import {TeamMemberSection} from "./sections/TeamMemberSection";
import {TeamInviteSection} from "./sections/TeamInviteSection";
import {teamsTable} from "../../schema/jj-schema.ts";
import type {
  Team,
  TeamComplete,
  TeamInsert,
  TeamInvite,
  TeamMember,
  TeamUpdateInput,
  TeamWithInvites,
  TeamWithMembers
} from "../../types/team";
import {NotFoundError} from "../../errors";

/**
 * Repository for team domain operations
 * Coordinates between team-related sections
 */
export class TeamRepo extends BaseRepo {
  private readonly teamSection: TeamSection;
  private readonly teamMemberSection: TeamMemberSection;
  private readonly teamInviteSection: TeamInviteSection;

  /**
   * Creates a new TeamRepo instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.teamSection = new TeamSection(env, repoEnv);
    this.teamMemberSection = new TeamMemberSection(env, repoEnv);
    this.teamInviteSection = new TeamInviteSection(env, repoEnv);
  }

  /**
   * Creates a TeamRepo instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A TeamRepo instance
   */
  static action(ctx: ActionAPIContext) {
    return new TeamRepo(ctx.locals.runtime.env, 'action');
  }

  /**
   * Gets the team section
   * @returns The team section
   */
  getTeamSection(): TeamSection {
    return this.teamSection;
  }

  /**
   * Gets the team member section
   * @returns The team member section
   */
  getTeamMemberSection(): TeamMemberSection {
    return this.teamMemberSection;
  }

  /**
   * Gets the team invite section
   * @returns The team invite section
   */
  getTeamInviteSection(): TeamInviteSection {
    return this.teamInviteSection;
  }

  /**
   * Finds a team with its members
   * @param teamId - The ID of the team
   * @returns The team with members or undefined if not found
   */
  async findTeamWithMembers(teamId: number): Promise<TeamWithMembers | undefined> {
    try {
      const team = await this.teamSection.findById(teamId);
      if (!team) {
        return undefined;
      }

      const members = await this.teamMemberSection.findByTeamIdAsUsers(teamId);

      return {
        ...team,
        members
      };
    } catch (error) {
      this.handleError(`Failed to find team with members: ${teamId}`, error);
    }
  }

  /**
   * Finds a team with its invites
   * @param teamId - The ID of the team
   * @returns The team with invites or undefined if not found
   */
  async findTeamWithInvites(teamId: number): Promise<TeamWithInvites | undefined> {
    try {
      const team = await this.teamSection.findById(teamId);
      if (!team) {
        return undefined;
      }

      const invitesWithUsers = await this.teamInviteSection.findByTeamIdWithUsers(teamId);

      return {
        ...team,
        invites: invitesWithUsers.map(invite => ({
          userId: invite.invitedUserId,
          user: invite.user
        }))
      };
    } catch (error) {
      this.handleError(`Failed to find team with invites: ${teamId}`, error);
    }
  }

  /**
   * Finds a complete team with all relationships
   * @param teamId - The ID of the team
   * @returns The complete team or undefined if not found
   */
  async findCompleteTeam(teamId: number): Promise<TeamComplete | undefined> {
    try {
      const team = await this.teamSection.findById(teamId);
      if (!team) {
        return undefined;
      }

      const members = await this.teamMemberSection.findByTeamIdAsUsers(teamId);
      const invitesWithUsers = await this.teamInviteSection.findByTeamIdWithUsers(teamId);

      // Get owner details
      const owner = members.find(member => member.id === team.ownerId);

      return {
        ...team,
        owner: owner ? {
          id: owner.id,
          name: 'Unknown', // Default value since name is not in the users table
          avatar: null     // Default value since avatar is not in the users table
        } : {
          id: team.ownerId,
          name: 'Unknown', // Default value since name is not in the users table
          avatar: null     // Default value since avatar is not in the users table
        },
        members,
        invites: invitesWithUsers.map(invite => ({
          userId: invite.invitedUserId,
          user: invite.user
        }))
      };
    } catch (error) {
      this.handleError(`Failed to find complete team: ${teamId}`, error);
    }
  }

  /**
   * Creates a new team
   * @param data - The team data
   * @returns The created team
   */
  async createTeam(data: TeamInsert): Promise<Team> {
    try {
      const team = await this.teamSection.create(data);

      // Add the owner as a member
      await this.teamMemberSection.create({
        teamId: team.id,
        userId: team.ownerId
      });

      return team;
    } catch (error) {
      this.handleError("Failed to create team", error);
    }
  }

  /**
   * Updates a team
   * @param teamId - The ID of the team
   * @param data - The team data to update
   * @returns The updated team
   */
  async updateTeam(teamId: number, data: TeamUpdateInput): Promise<Team> {
    try {
      return this.teamSection.update(teamId, data);
    } catch (error) {
      this.handleError(`Failed to update team: ${teamId}`, error);
    }
  }

  /**
   * Deletes a team
   * @param teamId - The ID of the team
   * @returns The deleted team
   */
  async deleteTeam(teamId: number): Promise<Team> {
    try {
      return this.teamSection.delete(teamId);
    } catch (error) {
      this.handleError(`Failed to delete team: ${teamId}`, error);
    }
  }

  /**
   * Adds a member to a team
   * @param teamId - The ID of the team
   * @param userId - The ID of the user to add
   * @returns The created team member
   */
  async addTeamMember(teamId: number, userId: number): Promise<TeamMember> {
    try {
      // Check if team exists
      const team = await this.teamSection.findById(teamId);
      if (!team) {
        throw new NotFoundError(`Team with id ${teamId} not found`);
      }

      // Check if user is already a member
      const isMember = await this.teamMemberSection.isMember(teamId, userId);
      if (isMember) {
        throw new Error(`User ${userId} is already a member of team ${teamId}`);
      }

      // Remove any pending invite
      const isInvited = await this.teamInviteSection.isInvited(teamId, userId);
      if (isInvited) {
        await this.teamInviteSection.delete(teamId, userId);
      }

      return this.teamMemberSection.create({
        teamId,
        userId
      });
    } catch (error) {
      this.handleError(`Failed to add member ${userId} to team ${teamId}`, error);
    }
  }

  /**
   * Removes a member from a team
   * @param teamId - The ID of the team
   * @param userId - The ID of the user to remove
   * @returns The deleted team member
   */
  async removeTeamMember(teamId: number, userId: number): Promise<TeamMember> {
    try {
      // Check if team exists
      const team = await this.teamSection.findById(teamId);
      if (!team) {
        throw new NotFoundError(`Team with id ${teamId} not found`);
      }

      // Cannot remove the owner
      if (team.ownerId === userId) {
        throw new Error(`Cannot remove the owner from team ${teamId}`);
      }

      return this.teamMemberSection.delete(teamId, userId);
    } catch (error) {
      this.handleError(`Failed to remove member ${userId} from team ${teamId}`, error);
    }
  }

  /**
   * Invites a user to a team
   * @param teamId - The ID of the team
   * @param userId - The ID of the user to invite
   * @returns The created team invite
   */
  async inviteToTeam(teamId: number, userId: number): Promise<TeamInvite> {
    try {
      // Check if team exists
      const team = await this.teamSection.findById(teamId);
      if (!team) {
        throw new NotFoundError(`Team with id ${teamId} not found`);
      }

      // Check if user is already a member
      const isMember = await this.teamMemberSection.isMember(teamId, userId);
      if (isMember) {
        throw new Error(`User ${userId} is already a member of team ${teamId}`);
      }

      // Check if user is already invited
      const isInvited = await this.teamInviteSection.isInvited(teamId, userId);
      if (isInvited) {
        throw new Error(`User ${userId} is already invited to team ${teamId}`);
      }

      return this.teamInviteSection.create({
        teamId,
        invitedUserId: userId
      });
    } catch (error) {
      this.handleError(`Failed to invite user ${userId} to team ${teamId}`, error);
    }
  }

  /**
   * Cancels an invitation to a team
   * @param teamId - The ID of the team
   * @param userId - The ID of the invited user
   * @returns The deleted team invite
   */
  async cancelInvitation(teamId: number, userId: number): Promise<TeamInvite> {
    try {
      return this.teamInviteSection.delete(teamId, userId);
    } catch (error) {
      this.handleError(`Failed to cancel invitation for user ${userId} to team ${teamId}`, error);
    }
  }

  /**
   * Accepts an invitation to a team
   * @param teamId - The ID of the team
   * @param userId - The ID of the invited user
   * @returns The created team member
   */
  async acceptInvitation(teamId: number, userId: number): Promise<TeamMember> {
    try {
      // Check if invitation exists
      const isInvited = await this.teamInviteSection.isInvited(teamId, userId);
      if (!isInvited) {
        throw new NotFoundError(`Invitation for user ${userId} to team ${teamId} not found`);
      }

      // Delete the invitation
      await this.teamInviteSection.delete(teamId, userId);

      // Add the user as a member
      return this.teamMemberSection.create({
        teamId,
        userId
      });
    } catch (error) {
      this.handleError(`Failed to accept invitation for user ${userId} to team ${teamId}`, error);
    }
  }

  /**
   * Declines an invitation to a team
   * @param teamId - The ID of the team
   * @param userId - The ID of the invited user
   * @returns The deleted team invite
   */
  async declineInvitation(teamId: number, userId: number): Promise<TeamInvite> {
    try {
      return this.teamInviteSection.delete(teamId, userId);
    } catch (error) {
      this.handleError(`Failed to decline invitation for user ${userId} to team ${teamId}`, error);
    }
  }

  /**
   * Finds teams by owner ID
   * @param ownerId - The ID of the owner
   * @returns An array of teams
   */
  async findTeamsByOwnerId(ownerId: number): Promise<Team[]> {
    try {
      return this.teamSection.findByOwnerId(ownerId);
    } catch (error) {
      this.handleError(`Failed to find teams for owner ${ownerId}`, error);
    }
  }

  /**
   * Finds teams by member ID
   * @param userId - The ID of the member
   * @returns An array of teams
   */
  async findTeamsByMemberId(userId: number): Promise<Team[]> {
    try {
      const memberships = await this.teamMemberSection.findByUserId(userId);
      const teamIds = memberships.map(m => m.teamId);

      const teams: Team[] = [];
      for (const teamId of teamIds) {
        const team = await this.teamSection.findById(teamId);
        if (team) {
          teams.push(team);
        }
      }

      return teams;
    } catch (error) {
      this.handleError(`Failed to find teams for member ${userId}`, error);
    }
  }

  /**
   * Finds teams by invited user ID
   * @param userId - The ID of the invited user
   * @returns An array of teams
   */
  async findTeamsByInvitedUserId(userId: number): Promise<Team[]> {
    try {
      const invites = await this.teamInviteSection.findByInvitedUserId(userId);
      const teamIds = invites.map(i => i.teamId);

      const teams: Team[] = [];
      for (const teamId of teamIds) {
        const team = await this.teamSection.findById(teamId);
        if (team) {
          teams.push(team);
        }
      }

      return teams;
    } catch (error) {
      this.handleError(`Failed to find teams for invited user ${userId}`, error);
    }
  }

  /**
   * Checks if a user is a member of a team
   * @param teamId - The ID of the team
   * @param userId - The ID of the user
   * @returns True if the user is a member of the team, false otherwise
   */
  async isTeamMember(teamId: number, userId: number): Promise<boolean> {
    try {
      return this.teamMemberSection.isMember(teamId, userId);
    } catch (error) {
      this.handleError(`Failed to check if user ${userId} is a member of team ${teamId}`, error);
    }
  }

  /**
   * Checks if a user is the owner of a team
   * @param teamId - The ID of the team
   * @param userId - The ID of the user
   * @returns True if the user is the owner of the team, false otherwise
   */
  async isTeamOwner(teamId: number, userId: number): Promise<boolean> {
    try {
      const team = await this.teamSection.findById(teamId);
      return !!team && team.ownerId === userId;
    } catch (error) {
      this.handleError(`Failed to check if user ${userId} is the owner of team ${teamId}`, error);
    }
  }

  /**
   * Transfers ownership of a team
   * @param teamId - The ID of the team
   * @param newOwnerId - The ID of the new owner
   * @returns The updated team
   */
  async transferOwnership(teamId: number, newOwnerId: number): Promise<Team> {
    try {
      // Check if team exists
      const team = await this.teamSection.findById(teamId);
      if (!team) {
        throw new NotFoundError(`Team with id ${teamId} not found`);
      }

      // Check if new owner is a member
      const isMember = await this.teamMemberSection.isMember(teamId, newOwnerId);
      if (!isMember) {
        throw new Error(`User ${newOwnerId} is not a member of team ${teamId}`);
      }

      // Update the team directly using SQL
      // Since ownerId is not part of TeamUpdateInput, we need to use a different approach
      const result = await this.db.update(teamsTable)
        .set({ ownerId: newOwnerId })
        .where(eq(teamsTable.id, teamId))
        .returning()
        .get();

      if (!result) {
        throw new NotFoundError(`Team with ID ${teamId} not found`);
      }

      return result;
    } catch (error) {
      this.handleError(`Failed to transfer ownership of team ${teamId} to user ${newOwnerId}`, error);
    }
  }
}
