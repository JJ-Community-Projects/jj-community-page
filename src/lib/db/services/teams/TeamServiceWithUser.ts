import type {ActionAPIContext} from "astro:actions";
import {BaseService} from "../BaseService.ts";
import {TeamService} from "./TeamService.ts";
import type {Team, TeamComplete, TeamInput, TeamWithInvites, TeamWithMembers} from "../../types/team.ts";
import type {NotFoundError} from "../../errors";
import type {RepoEnv} from "../../repos/BaseRepo.ts";

/**
 * Service for team-related business logic within the context of a specific user
 * This service handles functionality within the context of a user
 */
export class TeamServiceWithUser extends BaseService {
  private teamService: TeamService;
  private userId: number;

  /**
   * Creates a new TeamServiceWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The user ID
   */
  constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv);
    this.teamService = new TeamService(env, repoEnv);
    this.userId = userId;
  }

  /**
   * Creates a TeamServiceWithUser instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param userId - The user ID
   * @returns A TeamServiceWithUser instance
   */
  static action(ctx: ActionAPIContext, userId: number) {
    return new TeamServiceWithUser(ctx.locals.runtime.env, 'action', userId);
  }

  /**
   * Gets a team by ID
   * @param teamId - The team ID
   * @returns The team
   * @throws {NotFoundError} If the team doesn't exist
   */
  async getTeamById(teamId: number): Promise<Team> {
    return await this.teamService.getTeamById(teamId, this.userId);
  }

  /**
   * Gets a team by slug
   * @param slug - The team slug
   * @returns The team
   * @throws {NotFoundError} If the team doesn't exist
   */
  async getTeamBySlug(slug: string): Promise<Team> {
    return await this.teamService.getTeamBySlug(slug, this.userId);
  }

  /**
   * Gets a team with its members
   * @param teamId - The team ID
   * @returns The team with members
   * @throws {NotFoundError} If the team doesn't exist
   */
  async getTeamWithMembers(teamId: number): Promise<TeamWithMembers> {
    return await this.teamService.getTeamWithMembers(teamId, this.userId);
  }

  /**
   * Gets a team with its invites
   * @param teamId - The team ID
   * @returns The team with invites
   * @throws {NotFoundError} If the team doesn't exist
   */
  async getTeamWithInvites(teamId: number): Promise<TeamWithInvites> {
    return await this.teamService.getTeamWithInvites(teamId, this.userId);
  }

  /**
   * Gets a complete team with members and invites
   * @param teamId - The team ID
   * @returns The complete team
   * @throws {NotFoundError} If the team doesn't exist
   */
  async getCompleteTeam(teamId: number): Promise<TeamComplete> {
    return await this.teamService.getCompleteTeam(teamId, this.userId);
  }

  /**
   * Creates a new team
   * @param data - The team data
   * @returns The created team
   */
  async createTeam(data: TeamInput): Promise<Team> {
    return await this.teamService.createTeam(data, this.userId);
  }

  /**
   * Updates a team
   * @param teamId - The team ID
   * @param data - The team data
   * @returns The updated team
   * @throws {NotFoundError} If the team doesn't exist
   */
  async updateTeam(teamId: number, data: TeamInput): Promise<Team> {
    return await this.teamService.updateTeam(teamId, data, this.userId);
  }

  /**
   * Deletes a team
   * @param teamId - The team ID
   * @throws {NotFoundError} If the team doesn't exist
   */
  async deleteTeam(teamId: number): Promise<void> {
    await this.teamService.deleteTeam(teamId, this.userId);
  }

  /**
   * Adds a member to a team
   * @param teamId - The team ID
   * @param userId - The user ID to add
   * @returns The updated team with members
   * @throws {NotFoundError} If the team or user doesn't exist
   */
  async addMember(teamId: number, userId: number): Promise<TeamWithMembers> {
    return await this.teamService.addMember(teamId, userId, this.userId);
  }

  /**
   * Removes a member from a team
   * @param teamId - The team ID
   * @param userId - The user ID to remove
   * @returns The updated team with members
   * @throws {NotFoundError} If the team or user doesn't exist
   */
  async removeMember(teamId: number, userId: number): Promise<TeamWithMembers> {
    return await this.teamService.removeMember(teamId, userId, this.userId);
  }

  /**
   * Invites a user to a team
   * @param teamId - The team ID
   * @param userId - The user ID to invite
   * @returns The updated team with invites
   * @throws {NotFoundError} If the team or user doesn't exist
   */
  async inviteUser(teamId: number, userId: number): Promise<TeamWithInvites> {
    return await this.teamService.inviteUser(teamId, userId, this.userId);
  }

  /**
   * Cancels an invitation to a team
   * @param teamId - The team ID
   * @param userId - The user ID whose invitation to cancel
   * @returns The updated team with invites
   * @throws {NotFoundError} If the team or invitation doesn't exist
   */
  async cancelInvitation(teamId: number, userId: number): Promise<TeamWithInvites> {
    return await this.teamService.cancelInvitation(teamId, userId, this.userId);
  }

  /**
   * Accepts an invitation to a team
   * @param teamId - The team ID
   * @returns The team the user joined
   * @throws {NotFoundError} If the team or invitation doesn't exist
   */
  async acceptInvitation(teamId: number): Promise<Team> {
    return await this.teamService.acceptInvitation(teamId, this.userId);
  }

  /**
   * Declines an invitation to a team
   * @param teamId - The team ID
   * @throws {NotFoundError} If the team or invitation doesn't exist
   */
  async declineInvitation(teamId: number): Promise<void> {
    await this.teamService.declineInvitation(teamId, this.userId);
  }

  /**
   * Leaves a team
   * @param teamId - The team ID
   * @throws {NotFoundError} If the team doesn't exist or the user is not a member
   */
  async leaveTeam(teamId: number): Promise<void> {
    await this.teamService.leaveTeam(teamId, this.userId);
  }
}
