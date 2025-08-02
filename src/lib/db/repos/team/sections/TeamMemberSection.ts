// src/lib/db/newRepos/team/sections/TeamMemberSection.ts
import { and, eq } from "drizzle-orm";
import { BaseSection } from "../../base/BaseSection";
import type { RepoEnv } from "../../../../db/RepoEnv";
import { teamMembersTable } from "../../../../db/schema/jj-schema";
import { users } from "../../../../db/schema/auth-schema";
import type { TeamMember, TeamMemberInsert } from "../../../../db/types/team";
import type { User } from "../../../../db/types/user";
import { DuplicateError, NotFoundError } from "../../../../db/errors";

/**
 * Section for managing team members
 */
export class TeamMemberSection extends BaseSection<TeamMember, TeamMemberInsert> {
  /** The table this section operates on */
  protected table = teamMembersTable;

  /**
   * Creates a new TeamMemberSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds team members by team ID
   * @param teamId - The team ID
   * @returns An array of team members
   */
  async findByTeamId(teamId: number): Promise<TeamMember[]> {
    try {
      return this.db.select()
        .from(this.table)
        .where(eq(this.table.teamId, teamId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find team members for team: ${teamId}`, error);
    }
  }

  /**
   * Finds team members by user ID
   * @param userId - The user ID
   * @returns An array of team members
   */
  async findByUserId(userId: number): Promise<TeamMember[]> {
    try {
      return this.db.select()
        .from(this.table)
        .where(eq(this.table.userId, userId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find team memberships for user: ${userId}`, error);
    }
  }

  /**
   * Finds a team member by team ID and user ID
   * @param teamId - The team ID
   * @param userId - The user ID
   * @returns The team member or undefined if not found
   */
  async findByTeamAndUserId(teamId: number, userId: number): Promise<TeamMember | undefined> {
    try {
      return this.db.select()
        .from(this.table)
        .where(
          and(
            eq(this.table.teamId, teamId),
            eq(this.table.userId, userId)
          )
        )
        .get();
    } catch (error) {
      this.handleError(`Failed to find team member for team: ${teamId} and user: ${userId}`, error);
    }
  }

  /**
   * Checks if a user is a member of a team
   * @param teamId - The team ID
   * @param userId - The user ID
   * @returns True if the user is a member of the team, false otherwise
   */
  async isMember(teamId: number, userId: number): Promise<boolean> {
    try {
      const member = await this.findByTeamAndUserId(teamId, userId);
      return !!member;
    } catch (error) {
      this.handleError(`Failed to check if user: ${userId} is a member of team: ${teamId}`, error);
    }
  }

  /**
   * Creates a new team member
   * @param data - The team member data
   * @returns The created team member
   */
  async create(data: TeamMemberInsert): Promise<TeamMember> {
    try {
      // Check if the user is already a member of the team
      const existingMember = await this.findByTeamAndUserId(data.teamId, data.userId);
      if (existingMember) {
        throw new DuplicateError(`User ${data.userId} is already a member of team ${data.teamId}`);
      }

      const result = await this.db.insert(this.table)
        .values(data)
        .returning()
        .get();

      return result;
    } catch (error) {
      this.handleError(`Failed to create team member for team: ${data.teamId} and user: ${data.userId}`, error);
    }
  }

  /**
   * Deletes a team member
   * @param teamId - The team ID
   * @param userId - The user ID
   * @returns The deleted team member
   */
  async delete(teamId: number, userId: number): Promise<TeamMember> {
    try {
      const result = await this.db.delete(this.table)
        .where(
          and(
            eq(this.table.teamId, teamId),
            eq(this.table.userId, userId)
          )
        )
        .returning()
        .get();

      if (!result) {
        throw new NotFoundError(`Team member for team: ${teamId} and user: ${userId} not found`);
      }

      return result;
    } catch (error) {
      this.handleError(`Failed to delete team member for team: ${teamId} and user: ${userId}`, error);
    }
  }

  /**
   * Finds team members as User objects by team ID
   * @param teamId - The team ID
   * @returns An array of users who are members of the team
   */
  async findByTeamIdAsUsers(teamId: number): Promise<User[]> {
    try {
      return this.db.select({
        id: users.id,
        createdAt: users.createdAt,
        role: users.role,
        primaryLiveStream: users.primaryLiveStream
      })
        .from(this.table)
        .innerJoin(users, eq(this.table.userId, users.id))
        .where(eq(this.table.teamId, teamId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find team members as users for team: ${teamId}`, error);
    }
  }
}
