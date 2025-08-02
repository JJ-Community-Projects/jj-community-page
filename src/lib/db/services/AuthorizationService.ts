import type { ActionAPIContext } from "astro:actions";
import { ScheduleAuthorizationService } from "./schedules/ScheduleAuthorizationService.ts";
import { TeamAuthorizationService } from "./teams/TeamAuthorizationService.ts";
import { UserAuthorizationService } from "./users/UserAuthorizationService.ts";
import type {RepoEnv} from "../repos/BaseRepo.ts";

/**
 * Service for handling authorization checks
 * This service delegates to specialized authorization services for schedules, teams, and users
 */
export class AuthorizationService {
  private scheduleAuthService: ScheduleAuthorizationService;
  private teamAuthService: TeamAuthorizationService;
  private userAuthService: UserAuthorizationService;

  /**
   * Creates a new AuthorizationService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(private env: Env, private repoEnv: RepoEnv) {
    this.scheduleAuthService = new ScheduleAuthorizationService(env, repoEnv);
    this.teamAuthService = new TeamAuthorizationService(env, repoEnv);
    this.userAuthService = new UserAuthorizationService(env, repoEnv);
  }

  /**
   * Creates an AuthorizationService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns An AuthorizationService instance
   */
  static action(ctx: ActionAPIContext) {
    return new AuthorizationService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Ensures the user can view a schedule
   * @param userId - The user ID
   * @param scheduleId - The schedule ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the schedule doesn't exist
   */
  async ensureCanViewSchedule(userId: number, scheduleId: number): Promise<void> {
    return this.scheduleAuthService.ensureCanViewSchedule(userId, scheduleId);
  }

  /**
   * Ensures the user can edit a schedule
   * @param userId - The user ID
   * @param scheduleId - The schedule ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the schedule doesn't exist
   */
  async ensureCanEditSchedule(userId: number, scheduleId: number): Promise<void> {
    return this.scheduleAuthService.ensureCanEditSchedule(userId, scheduleId);
  }

  /**
   * Ensures the user can delete a schedule
   * @param userId - The user ID
   * @param scheduleId - The schedule ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the schedule doesn't exist
   */
  async ensureCanDeleteSchedule(userId: number, scheduleId: number): Promise<void> {
    return this.scheduleAuthService.ensureCanDeleteSchedule(userId, scheduleId);
  }

  /**
   * Ensures the user can create a schedule
   * @param userId - The user ID
   * @throws {AuthorizationError} If the user doesn't have permission
   */
  async ensureCanCreateSchedule(userId: number): Promise<void> {
    return this.scheduleAuthService.ensureCanCreateSchedule(userId);
  }

  /**
   * Ensures the user can view a team
   * @param userId - The user ID
   * @param teamId - The team ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the team doesn't exist
   */
  async ensureCanViewTeam(userId: number, teamId: number): Promise<void> {
    return this.teamAuthService.ensureCanViewTeam(userId, teamId);
  }

  /**
   * Ensures the user can edit a team
   * @param userId - The user ID
   * @param teamId - The team ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the team doesn't exist
   */
  async ensureCanEditTeam(userId: number, teamId: number): Promise<void> {
    return this.teamAuthService.ensureCanEditTeam(userId, teamId);
  }

  /**
   * Ensures the user can delete a team
   * @param userId - The user ID
   * @param teamId - The team ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the team doesn't exist
   */
  async ensureCanDeleteTeam(userId: number, teamId: number): Promise<void> {
    return this.teamAuthService.ensureCanDeleteTeam(userId, teamId);
  }

  /**
   * Ensures the user can create a team
   * @param userId - The user ID
   * @throws {AuthorizationError} If the user doesn't have permission
   */
  async ensureCanCreateTeam(userId: number): Promise<void> {
    return this.teamAuthService.ensureCanCreateTeam(userId);
  }

  /**
   * Ensures the user can invite members to a team
   * @param userId - The user ID
   * @param teamId - The team ID
   * @throws {AuthorizationError} If the user doesn't have permission
   * @throws {NotFoundError} If the team doesn't exist
   */
  async ensureCanInviteToTeam(userId: number, teamId: number): Promise<void> {
    return this.teamAuthService.ensureCanInviteToTeam(userId, teamId);
  }

  /**
   * Ensures the user is an admin
   * @param userId - The user ID
   * @throws {AuthorizationError} If the user is not an admin
   */
  async ensureIsAdmin(userId: number): Promise<void> {
    return this.userAuthService.ensureIsAdmin(userId);
  }
}
