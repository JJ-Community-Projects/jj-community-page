import type {ActionAPIContext} from "astro:actions";
import {BaseService} from "../BaseService.ts";
import {TeamService} from "./TeamService.ts";
import type {Team, TeamComplete, TeamUpdateInput, TeamWithInvites, TeamWithMembers} from "../../types/team.ts";
import type {NotFoundError} from "../../errors";
import type {RepoEnv} from "../../repos/BaseRepo.ts";

/**
 * Service for team-related business logic within the context of a specific team
 * This service handles functionality within the context of a team
 */
export class TeamServiceWithTeam extends BaseService {
  private teamService: TeamService;
  private teamId: number;

  /**
   * Creates a new TeamServiceWithTeam instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param teamId - The team ID
   */
  constructor(env: Env, repoEnv: RepoEnv, teamId: number) {
    super(env, repoEnv);
    this.teamService = new TeamService(env, repoEnv);
    this.teamId = teamId;
  }

  /**
   * Creates a TeamServiceWithTeam instance for use in Astro actions
   * @param ctx - The Astro action context
   * @param teamId - The team ID
   * @returns A TeamServiceWithTeam instance
   */
  static action(ctx: ActionAPIContext, teamId: number) {
    return new TeamServiceWithTeam(ctx.locals.runtime.env, 'action', teamId);
  }

  /**
   * Gets the team
   * @param userId - The user ID
   * @returns The team
   * @throws {NotFoundError} If the team doesn't exist
   */
  async getTeam(userId: number): Promise<Team> {
    return await this.teamService.getTeamById(this.teamId, userId);
  }

  /**
   * Gets the team with its members
   * @param userId - The user ID
   * @returns The team with members
   * @throws {NotFoundError} If the team doesn't exist
   */
  async getTeamWithMembers(userId: number): Promise<TeamWithMembers> {
    return await this.teamService.getTeamWithMembers(this.teamId, userId);
  }

  /**
   * Gets the team with its invites
   * @param userId - The user ID
   * @returns The team with invites
   * @throws {NotFoundError} If the team doesn't exist
   */
  async getTeamWithInvites(userId: number): Promise<TeamWithInvites> {
    return await this.teamService.getTeamWithInvites(this.teamId, userId);
  }

  /**
   * Gets the complete team with members and invites
   * @param userId - The user ID
   * @returns The complete team
   * @throws {NotFoundError} If the team doesn't exist
   */
  async getCompleteTeam(userId: number): Promise<TeamComplete> {
    return await this.teamService.getCompleteTeam(this.teamId, userId);
  }

  /**
   * Updates the team
   * @param data - The team data
   * @param userId - The user ID
   * @returns The updated team
   * @throws {NotFoundError} If the team doesn't exist
   */
  async updateTeam(data: TeamUpdateInput, userId: number): Promise<Team> {
    return await this.teamService.updateTeam(this.teamId, data, userId);
  }

  /**
   * Deletes the team
   * @param userId - The user ID
   * @throws {NotFoundError} If the team doesn't exist
   */
  async deleteTeam(userId: number): Promise<void> {
    await this.teamService.deleteTeam(this.teamId, userId);
  }

  /**
   * Adds a member to the team
   * @param userId - The user ID to add
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated team with members
   * @throws {NotFoundError} If the team or user doesn't exist
   */
  async addMember(userId: number, requestingUserId: number): Promise<TeamWithMembers> {
    return await this.teamService.addMember(this.teamId, userId, requestingUserId);
  }

  /**
   * Removes a member from the team
   * @param userId - The user ID to remove
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated team with members
   * @throws {NotFoundError} If the team or user doesn't exist
   */
  async removeMember(userId: number, requestingUserId: number): Promise<TeamWithMembers> {
    return await this.teamService.removeMember(this.teamId, userId, requestingUserId);
  }

  /**
   * Invites a user to the team
   * @param userId - The user ID to invite
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated team with invites
   * @throws {NotFoundError} If the team or user doesn't exist
   */
  async inviteUser(userId: number, requestingUserId: number): Promise<TeamWithInvites> {
    return await this.teamService.inviteUser(this.teamId, userId, requestingUserId);
  }

  /**
   * Cancels an invitation to the team
   * @param userId - The user ID whose invitation to cancel
   * @param requestingUserId - The ID of the user making the change
   * @returns The updated team with invites
   * @throws {NotFoundError} If the team or invitation doesn't exist
   */
  async cancelInvitation(userId: number, requestingUserId: number): Promise<TeamWithInvites> {
    return await this.teamService.cancelInvitation(this.teamId, userId, requestingUserId);
  }
}
