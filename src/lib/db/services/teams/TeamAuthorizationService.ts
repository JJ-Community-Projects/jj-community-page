import type { ActionAPIContext } from "astro:actions";
import { BaseService } from "../BaseService.ts";
import { TeamRepo } from "../../repos/teams/TeamRepo.ts";
import { TeamMemberRepo } from "../../repos/teams/TeamMemberRepo.ts";
import { UserRepo } from "../../repos/users/UserRepo.ts";
import { AuthorizationError, NotFoundError } from "../../errors";
import type {RepoEnv} from "../../repos/BaseRepo.ts";

/**
 * Service for handling team-related authorization checks
 */
export class TeamAuthorizationService extends BaseService {
  private teamRepo: TeamRepo;
  private teamMemberRepo: TeamMemberRepo;
  private userRepo: UserRepo;

  /**
   * Creates a new TeamAuthorizationService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.teamRepo = new TeamRepo(env, repoEnv);
    this.teamMemberRepo = new TeamMemberRepo(env, repoEnv);
    this.userRepo = new UserRepo(env, repoEnv);
  }

  /**
   * Creates a TeamAuthorizationService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A TeamAuthorizationService instance
   */
  static action(ctx: ActionAPIContext) {
    return new TeamAuthorizationService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Ensures the user can view a team
   * @param userId - The user ID
   * @param teamId - The team ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the team doesn't exist
   */
  async ensureCanViewTeam(userId: number, teamId: number): Promise<void> {
    const team = await this.teamRepo.findById(teamId);

    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Public teams can be viewed by anyone
    if (team.visible) {
      return;
    }

    // Team owners can always view their teams
    if (team.ownerId === userId) {
      return;
    }

    // Team members can view the team
    const isMember = await this.teamMemberRepo.isMember(teamId, userId);
    if (isMember) {
      return;
    }

    // Check if user is an admin
    const user = await this.userRepo.findById(userId);
    if (user && user.role === 'admin') {
      return;
    }

    throw new AuthorizationError(`You don't have permission to view this team`);
  }

  /**
   * Ensures the user can edit a team
   * @param userId - The user ID
   * @param teamId - The team ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the team doesn't exist
   */
  async ensureCanEditTeam(userId: number, teamId: number): Promise<void> {
    const team = await this.teamRepo.findById(teamId);

    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Only team owners can edit their teams
    if (team.ownerId === userId) {
      return;
    }

    throw new AuthorizationError(`You don't have permission to edit this team`);
  }

  /**
   * Ensures the user can delete a team
   * @param userId - The user ID
   * @param teamId - The team ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the team doesn't exist
   */
  async ensureCanDeleteTeam(userId: number, teamId: number): Promise<void> {
    const team = await this.teamRepo.findById(teamId);

    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Only team owners can delete their teams
    if (team.ownerId === userId) {
      return;
    }

    throw new AuthorizationError(`You don't have permission to delete this team`);
  }

  /**
   * Ensures the user can create a team
   * @param userId - The user ID
   * @throws {AuthorizationError} If the user doesn't have permission
   */
  async ensureCanCreateTeam(userId: number): Promise<void> {
    // All authenticated users can create teams
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      throw new AuthorizationError(`User with ID ${userId} not found`);
    }
  }

  /**
   * Ensures the user can invite members to a team
   * @param userId - The user ID
   * @param teamId - The team ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the team doesn't exist
   */
  async ensureCanInviteToTeam(userId: number, teamId: number): Promise<void> {
    const team = await this.teamRepo.findById(teamId);

    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found`);
    }

    // Only team owners can invite members
    if (team.ownerId === userId) {
      return;
    }

    throw new AuthorizationError(`You don't have permission to invite members to this team`);
  }
}
