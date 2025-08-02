import {TeamRepo} from "../../repos/teams/TeamRepo.ts";
import {TeamMemberRepo} from "../../repos/teams/TeamMemberRepo.ts";
import {TeamInviteRepo} from "../../repos/teams/TeamInviteRepo.ts";
import {UserRepo} from "../../repos/users/UserRepo.ts";
import {TeamAuthorizationService} from "./TeamAuthorizationService.ts";
import {AuthorizationError, DuplicateError, NotFoundError, ServiceError, ValidationError} from "../../errors";
import type {
  Team,
  TeamComplete,
  TeamInput,
  TeamUpdateInput,
  TeamWithInvites,
  TeamWithMembers
} from "../../types/team.ts";
import type {User} from "../../types/user.ts";
import type {RepoEnv} from "../../repos/BaseRepo.ts";
import {BaseService} from "../BaseService.ts";

/**
 * Service for team-related business logic
 */
export class TeamService extends BaseService {
  private teamRepo: TeamRepo;
  private teamMemberRepo: TeamMemberRepo;
  private teamInviteRepo: TeamInviteRepo;
  private userRepo: UserRepo;
  private authService: TeamAuthorizationService;

  /**
   * Creates a new TeamService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.teamRepo = new TeamRepo(env, repoEnv);
    this.teamMemberRepo = new TeamMemberRepo(env, repoEnv);
    this.teamInviteRepo = new TeamInviteRepo(env, repoEnv);
    this.userRepo = new UserRepo(env, repoEnv);
    this.authService = new TeamAuthorizationService(env, repoEnv);
  }

  /**
   * Gets a team by ID with authorization check
   * @param teamId - The team ID
   * @param userId - The user ID
   * @returns The team
   * @throws {NotFoundError} If the team doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the team
   */
  async getTeamById(teamId: number, userId: number): Promise<Team> {
    // Authorization check
    await this.authService.ensureCanViewTeam(userId, teamId);

    // Get team
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    return team;
  }

  /**
   * Gets a team by slug with authorization check
   * @param slug - The team slug
   * @param userId - The user ID
   * @returns The team
   * @throws {NotFoundError} If the team doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the team
   */
  async getTeamBySlug(slug: string, userId: number): Promise<Team> {
    // Get team
    const team = await this.teamRepo.findBySlug(slug);
    if (!team) {
      throw new NotFoundError(`Team with slug "${slug}" not found`);
    }

    // Authorization check
    await this.authService.ensureCanViewTeam(userId, team.id);

    return team;
  }

  /**
   * Gets a team with its members
   * @param teamId - The team ID
   * @param userId - The user ID
   * @returns The team with members
   * @throws {NotFoundError} If the team doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the team
   */
  async getTeamWithMembers(teamId: number, userId: number): Promise<TeamWithMembers> {
    // Authorization check
    await this.authService.ensureCanViewTeam(userId, teamId);

    // Get team
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Get members
    const memberEntries = await this.teamMemberRepo.findByTeamId(teamId);

    // Get member user details
    const members: User[] = await Promise.all(
      memberEntries.map(async (entry) => {
        return await this.userRepo.findById(entry.userId);
      })
    ).then((users) => {
      return users.filter((user)=>user!==undefined);
    })

    return {
      ...team,
      members: members.filter(Boolean) // Filter out null values
    };
  }

  /**
   * Gets a team with its invites
   * @param teamId - The team ID
   * @param userId - The user ID
   * @returns The team with invites
   * @throws {NotFoundError} If the team doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the team
   */
  async getTeamWithInvites(teamId: number, userId: number): Promise<TeamWithInvites> {
    // Authorization check
    await this.authService.ensureCanViewTeam(userId, teamId);

    // Get team
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Check if user is team owner or admin
    const isOwner = team.ownerId === userId;
    let isAdmin = false;

    if (!isOwner) {
      const user = await this.userRepo.findById(userId);
      isAdmin = user?.role === 'admin';

      if (!isAdmin) {
        throw new AuthorizationError("Only team owners and admins can view team invites");
      }
    }

    // Get invites
    const inviteEntries = await this.teamInviteRepo.findByTeamId(teamId);


    // Get invited user details
    const invites = await Promise.all(
      inviteEntries.map(async (entry) => {
        const user = await this.userRepo.findById(entry.invitedUserId);
        return {
          userId: entry.invitedUserId,
          user: user ? {
            id: user.id,
            name: user.role, // Using role as name for simplicity
            avatar: null
          } : null
        };
      })
    );

    return {
      ...team,
      invites: invites.filter(invite => invite.user) // Filter out null values
    };
  }

  /**
   * Gets a complete team with members and invites
   * @param teamId - The team ID
   * @param userId - The user ID
   * @returns The complete team
   * @throws {NotFoundError} If the team doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to view the team
   */
  async getCompleteTeam(teamId: number, userId: number): Promise<TeamComplete> {
    // Authorization check
    await this.authService.ensureCanViewTeam(userId, teamId);

    // Get team
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Check if user is team owner or admin for viewing invites
    const isOwner = team.ownerId === userId;
    let isAdmin = false;

    if (!isOwner) {
      const user = await this.userRepo.findById(userId);
      isAdmin = user?.role === 'admin';
    }

    // Get owner details
    const owner = await this.userRepo.findById(team.ownerId);
    if (!owner) {
      throw new NotFoundError(`Team owner with ID ${team.ownerId} not found`);
    }

    // Get members
    const memberEntries = await this.teamMemberRepo.findByTeamId(teamId);

    // Get member user details
    const members: User[] = await Promise.all(
      memberEntries.map(async (entry) => {
        const user = await this.userRepo.findById(entry.userId);
        return user;
      })
    );

    // Get invites if user is owner or admin
    let invites = [];
    if (isOwner || isAdmin) {
      const inviteEntries = await this.teamInviteRepo.findByTeamId(teamId);

      invites = await Promise.all(
        inviteEntries.map(async (entry) => {
          const user = await this.userRepo.findById(entry.invitedUserId);
          return {
            userId: entry.invitedUserId,
            user: user ? {
              id: user.id,
              name: user.role, // Using role as name for simplicity
              avatar: null
            } : null
          };
        })
      );
    }

    return {
      ...team,
      owner: {
        id: owner.id,
        name: owner.role, // Using role as name for simplicity
        avatar: null
      },
      members: members.filter(Boolean), // Filter out null values
      invites: invites.filter(invite => invite.user) // Filter out null values
    };
  }

  /**
   * Creates a new team
   * @param data - The team data
   * @param userId - The user ID
   * @returns The created team
   * @throws {ValidationError} If the input data is invalid
   * @throws {AuthorizationError} If the user doesn't have permission to create a team
   */
  async createTeam(data: TeamInput, userId: number): Promise<Team> {
    // Authorization check
    await this.authService.ensureCanCreateTeam(userId);

    // Validate input
    this.validateTeamInput(data);

    // Check for duplicate slug
    const existing = await this.teamRepo.findBySlug(data.slug);
    if (existing) {
      throw new ValidationError(`Team with slug "${data.slug}" already exists`);
    }

    // Create team
    return await this.teamRepo.createTeam({
      ...data,
      ownerId: userId
    });
  }

  /**
   * Updates a team
   * @param teamId - The team ID
   * @param data - The team data
   * @param userId - The user ID
   * @returns The updated team
   * @throws {NotFoundError} If the team doesn't exist
   * @throws {ValidationError} If the input data is invalid
   * @throws {AuthorizationError} If the user doesn't have permission to update the team
   */
  async updateTeam(teamId: number, data: TeamUpdateInput, userId: number): Promise<Team> {
    // Authorization check
    await this.authService.ensureCanEditTeam(userId, teamId);

    // Get existing team
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Validate slug if changing
    if (data.slug && data.slug !== team.slug) {
      if (!this.isValidSlug(data.slug)) {
        throw new ValidationError("Slug can only contain lowercase letters, numbers, and hyphens");
      }

      const existing = await this.teamRepo.findBySlug(data.slug);
      if (existing && existing.id !== teamId) {
        throw new ValidationError(`Team with slug "${data.slug}" already exists`);
      }
    }

    // Update team
    return await this.teamRepo.updateTeam(teamId, data);
  }

  /**
   * Deletes a team
   * @param teamId - The team ID
   * @param userId - The user ID
   * @throws {NotFoundError} If the team doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission to delete the team
   */
  async deleteTeam(teamId: number, userId: number): Promise<void> {
    // Authorization check
    await this.authService.ensureCanDeleteTeam(userId, teamId);

    // Check if team exists
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Delete team
    await this.teamRepo.delete(teamId);
  }

  /**
   * Adds a member to a team
   * @param teamId - The team ID
   * @param userId - The user ID to add
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated team with members
   * @throws {NotFoundError} If the team or user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {DuplicateError} If the user is already a member
   */
  async addMember(teamId: number, userId: number, requestingUserId: number): Promise<TeamWithMembers> {
    // Authorization check
    await this.authService.ensureCanEditTeam(requestingUserId, teamId);

    // Check if team exists
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Check if user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    // Check if user is already a member
    const isMember = await this.teamMemberRepo.isMember(teamId, userId);
    if (isMember) {
      throw new DuplicateError(`User ${userId} is already a member of team ${teamId}`);
    }

    try {
      // Add member
      await this.teamMemberRepo.addMember({
        teamId,
        userId
      });

      // Return team with members
      return await this.getTeamWithMembers(teamId, requestingUserId);
    } catch (error) {
      // Handle specific errors
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error adding team member:", error);
      throw new ServiceError("Failed to add team member", error);
    }
  }

  /**
   * Removes a member from a team
   * @param teamId - The team ID
   * @param userId - The user ID to remove
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated team with members
   * @throws {NotFoundError} If the team or user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async removeMember(teamId: number, userId: number, requestingUserId: number): Promise<TeamWithMembers> {
    // Authorization check
    await this.authService.ensureCanEditTeam(requestingUserId, teamId);

    // Check if team exists
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Cannot remove the owner
    if (team.ownerId === userId) {
      throw new ValidationError("Cannot remove the team owner");
    }

    // Check if user is a member
    const isMember = await this.teamMemberRepo.isMember(teamId, userId);
    if (!isMember) {
      throw new NotFoundError(`User ${userId} is not a member of team ${teamId}`);
    }

    try {
      // Remove member
      await this.teamMemberRepo.removeMember(teamId, userId);

      // Return team with members
      return await this.getTeamWithMembers(teamId, requestingUserId);
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error removing team member:", error);
      throw new ServiceError("Failed to remove team member", error);
    }
  }

  /**
   * Invites a user to a team
   * @param teamId - The team ID
   * @param userId - The user ID to invite
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated team with invites
   * @throws {NotFoundError} If the team or user doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   * @throws {DuplicateError} If the user is already invited
   */
  async inviteUser(teamId: number, userId: number, requestingUserId: number): Promise<TeamWithInvites> {
    // Authorization check
    await this.authService.ensureCanInviteToTeam(requestingUserId, teamId);

    // Check if team exists
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Check if user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    // Check if user is already a member
    const isMember = await this.teamMemberRepo.isMember(teamId, userId);
    if (isMember) {
      throw new ValidationError(`User ${userId} is already a member of team ${teamId}`);
    }

    // Check if user is already invited
    const isInvited = await this.teamInviteRepo.isInvited(teamId, userId);
    if (isInvited) {
      throw new DuplicateError(`User ${userId} is already invited to team ${teamId}`);
    }

    try {
      // Create invite
      await this.teamInviteRepo.createInvite({
        teamId,
        invitedUserId: userId
      });

      // Return team with invites
      return await this.getTeamWithInvites(teamId, requestingUserId);
    } catch (error) {
      // Handle specific errors
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error inviting user to team:", error);
      throw new ServiceError("Failed to invite user to team", error);
    }
  }

  /**
   * Cancels an invitation to a team
   * @param teamId - The team ID
   * @param userId - The user ID whose invitation to cancel
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated team with invites
   * @throws {NotFoundError} If the team or invitation doesn't exist
   * @throws {AuthorizationError} If the requesting user doesn't have permission
   */
  async cancelInvitation(teamId: number, userId: number, requestingUserId: number): Promise<TeamWithInvites> {
    // Authorization check
    await this.authService.ensureCanInviteToTeam(requestingUserId, teamId);

    // Check if team exists
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Check if invitation exists
    const isInvited = await this.teamInviteRepo.isInvited(teamId, userId);
    if (!isInvited) {
      throw new NotFoundError(`Invitation for user ${userId} to team ${teamId} not found`);
    }

    try {
      // Delete invitation
      await this.teamInviteRepo.deleteInvite(teamId, userId);

      // Return team with invites
      return await this.getTeamWithInvites(teamId, requestingUserId);
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error canceling team invitation:", error);
      throw new ServiceError("Failed to cancel team invitation", error);
    }
  }

  /**
   * Accepts an invitation to a team
   * @param teamId - The team ID
   * @param userId - The user ID accepting the invitation
   * @returns The team the user joined
   * @throws {NotFoundError} If the team or invitation doesn't exist
   * @throws {AuthorizationError} If the user doesn't have permission
   */
  async acceptInvitation(teamId: number, userId: number): Promise<Team> {
    // Check if team exists
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Check if invitation exists
    const isInvited = await this.teamInviteRepo.isInvited(teamId, userId);
    if (!isInvited) {
      throw new NotFoundError(`Invitation for user ${userId} to team ${teamId} not found`);
    }

    try {
      // Add user to team
      await this.teamMemberRepo.addMember({teamId, userId});

      // Delete invitation
      await this.teamInviteRepo.deleteInvite(teamId, userId);

      // Return team
      return team;
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error accepting team invitation:", error);
      throw new ServiceError("Failed to accept team invitation", error);
    }
  }

  /**
   * Declines an invitation to a team
   * @param teamId - The team ID
   * @param userId - The user ID declining the invitation
   * @throws {NotFoundError} If the team or invitation doesn't exist
   */
  async declineInvitation(teamId: number, userId: number): Promise<void> {
    // Check if team exists
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Check if invitation exists
    const isInvited = await this.teamInviteRepo.isInvited(teamId, userId);
    if (!isInvited) {
      throw new NotFoundError(`Invitation for user ${userId} to team ${teamId} not found`);
    }

    try {
      // Delete invitation
      await this.teamInviteRepo.deleteInvite(teamId, userId);
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error declining team invitation:", error);
      throw new ServiceError("Failed to decline team invitation", error);
    }
  }

  /**
   * Allows a user to leave a team
   * @param teamId - The team ID
   * @param userId - The user ID leaving the team
   * @throws {NotFoundError} If the team doesn't exist or the user is not a member
   * @throws {ValidationError} If the user is the team owner
   */
  async leaveTeam(teamId: number, userId: number): Promise<void> {
    // Check if team exists
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Team owner cannot leave the team
    if (team.ownerId === userId) {
      throw new ValidationError("Team owner cannot leave the team");
    }

    // Check if user is a member
    const isMember = await this.teamMemberRepo.isMember(teamId, userId);
    if (!isMember) {
      throw new NotFoundError(`User ${userId} is not a member of team ${teamId}`);
    }

    try {
      // Remove member
      await this.teamMemberRepo.removeMember(teamId, userId);
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and throw service error for other errors
      console.error("Error leaving team:", error);
      throw new ServiceError("Failed to leave team", error);
    }
  }

  /**
   * Validates team input data
   * @param data - The team data to validate
   * @throws {ValidationError} If the input data is invalid
   */
  private validateTeamInput(data: TeamInput): void {
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError("Team name is required");
    }

    if (!this.isValidSlug(data.slug)) {
      throw new ValidationError("Slug can only contain lowercase letters, numbers, and hyphens");
    }
  }

  /**
   * Checks if a slug is valid
   * @param slug - The slug to check
   * @returns True if the slug is valid, false otherwise
   */
  private isValidSlug(slug: string): boolean {
    return Boolean(slug && /^[a-z0-9-]+$/.test(slug));
  }
}
