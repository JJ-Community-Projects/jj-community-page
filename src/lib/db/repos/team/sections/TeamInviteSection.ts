// src/lib/db/newRepos/team/sections/TeamInviteSection.ts
import { and, eq } from "drizzle-orm";
import { BaseSection } from "../../base/BaseSection";
import type { RepoEnv } from "../../../../db/RepoEnv";
import { teamInvitesTable } from "../../../../db/schema/jj-schema";
import { users } from "../../../../db/schema/auth-schema";
import type { TeamInvite, TeamInviteInsert } from "../../../../db/types/team";
import type { User } from "../../../../db/types/user";
import { DuplicateError, NotFoundError } from "../../../../db/errors";

/**
 * Section for managing team invites
 */
export class TeamInviteSection extends BaseSection<TeamInvite, TeamInviteInsert> {
  /** The table this section operates on */
  protected table = teamInvitesTable;

  /**
   * Creates a new TeamInviteSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds team invites by team ID
   * @param teamId - The team ID
   * @returns An array of team invites
   */
  async findByTeamId(teamId: number): Promise<TeamInvite[]> {
    try {
      return this.db.select()
        .from(this.table)
        .where(eq(this.table.teamId, teamId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find team invites for team: ${teamId}`, error);
    }
  }

  /**
   * Finds team invites by invited user ID
   * @param userId - The invited user ID
   * @returns An array of team invites
   */
  async findByInvitedUserId(userId: number): Promise<TeamInvite[]> {
    try {
      return this.db.select()
        .from(this.table)
        .where(eq(this.table.invitedUserId, userId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find team invites for user: ${userId}`, error);
    }
  }

  /**
   * Finds a team invite by team ID and invited user ID
   * @param teamId - The team ID
   * @param userId - The invited user ID
   * @returns The team invite or undefined if not found
   */
  async findByTeamAndUserId(teamId: number, userId: number): Promise<TeamInvite | undefined> {
    try {
      return this.db.select()
        .from(this.table)
        .where(
          and(
            eq(this.table.teamId, teamId),
            eq(this.table.invitedUserId, userId)
          )
        )
        .get();
    } catch (error) {
      this.handleError(`Failed to find team invite for team: ${teamId} and user: ${userId}`, error);
    }
  }

  /**
   * Checks if a user has been invited to a team
   * @param teamId - The team ID
   * @param userId - The invited user ID
   * @returns True if the user has been invited to the team, false otherwise
   */
  async isInvited(teamId: number, userId: number): Promise<boolean> {
    try {
      const invite = await this.findByTeamAndUserId(teamId, userId);
      return !!invite;
    } catch (error) {
      this.handleError(`Failed to check if user: ${userId} is invited to team: ${teamId}`, error);
    }
  }

  /**
   * Creates a new team invite
   * @param data - The team invite data
   * @returns The created team invite
   */
  async create(data: TeamInviteInsert): Promise<TeamInvite> {
    try {
      // Check if the user is already invited to the team
      const existingInvite = await this.findByTeamAndUserId(data.teamId, data.invitedUserId);
      if (existingInvite) {
        throw new DuplicateError(`User ${data.invitedUserId} is already invited to team ${data.teamId}`);
      }

      const result = await this.db.insert(this.table)
        .values(data)
        .returning()
        .get();

      return result;
    } catch (error) {
      this.handleError(`Failed to create team invite for team: ${data.teamId} and user: ${data.invitedUserId}`, error);
    }
  }

  /**
   * Deletes a team invite
   * @param teamId - The team ID
   * @param userId - The invited user ID
   * @returns The deleted team invite
   */
  async delete(teamId: number, userId: number): Promise<TeamInvite> {
    try {
      const result = await this.db.delete(this.table)
        .where(
          and(
            eq(this.table.teamId, teamId),
            eq(this.table.invitedUserId, userId)
          )
        )
        .returning()
        .get();

      if (!result) {
        throw new NotFoundError(`Team invite for team: ${teamId} and user: ${userId} not found`);
      }

      return result;
    } catch (error) {
      this.handleError(`Failed to delete team invite for team: ${teamId} and user: ${userId}`, error);
    }
  }

  /**
   * Finds team invites with invited user details by team ID
   * @param teamId - The team ID
   * @returns An array of team invites with user details
   */
  async findByTeamIdWithUsers(teamId: number): Promise<Array<TeamInvite & { user: { id: number; name: string; avatar: string | null } }>> {
    try {
      const results = await this.db.select({
        teamId: this.table.teamId,
        invitedUserId: this.table.invitedUserId,
        userId: users.id
      })
        .from(this.table)
        .innerJoin(users, eq(this.table.invitedUserId, users.id))
        .where(eq(this.table.teamId, teamId))
        .all();

      // Transform the results to include the required user fields
      return results.map(result => ({
        teamId: result.teamId,
        invitedUserId: result.invitedUserId,
        user: {
          id: result.userId,
          name: 'Unknown', // Default value since name is not in the users table
          avatar: null     // Default value since avatar is not in the users table
        }
      }));
    } catch (error) {
      this.handleError(`Failed to find team invites with users for team: ${teamId}`, error);
    }
  }
}
