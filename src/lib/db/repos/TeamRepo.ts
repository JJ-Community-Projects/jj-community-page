import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import {Repo, type RepoEnv} from "./Repo";
import {teamInvitesTable, teamMembersTable, teamsTable} from "../schema/schema";
import type {InferInsertModel, InferSelectModel} from "drizzle-orm";
import {and, eq} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError";
import type {ActionAPIContext} from "astro:actions";
import {UserRepo} from "./UserRepo.ts";
import {accounts} from "../schema/auth-schema";

/**
 * Repository for working with teams
 */
export class TeamRepo extends Repo<typeof teamsTable._['config']> {
  private userRepo: UserRepo;

  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv, teamsTable);
    this.userRepo = new UserRepo(this.env, this.repoEnv);
  }

  static action(ctx: ActionAPIContext) {
    return new TeamRepo(ctx.locals.runtime.env, 'action')
  }

  // region Basic Team Operations
  /**
   * Find a team by its primary key
   * @param id The primary key value
   * @returns Promise resolving to the team or null if not found
   *
   * SQL: `SELECT * FROM "teams" WHERE "teams"."id" = ?`
   */
  async findById(id: number): Promise<InferSelectModel<typeof teamsTable> | null> {
    try {
      const result = await this.db.select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .get();

      return result || null;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to find team by id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find team by id: ${id}`, error);
      }
    }
  }

  /**
   * Find a team by its slug
   * @param slug The team slug
   * @returns Promise resolving to the team or null if not found
   *
   * SQL: `SELECT * FROM "teams" WHERE "teams"."slug" = ?`
   */
  async findBySlug(slug: string): Promise<InferSelectModel<typeof teamsTable> | null> {
    try {
      const result = await this.db.select()
        .from(this.table)
        .where(eq(this.table.slug, slug))
        .get();

      return result || null;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to find team by slug: ${slug}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find team by slug: ${slug}`, error);
      }
    }
  }

  /**
   * Find teams by owner ID
   * @param ownerId The owner ID
   * @returns Promise resolving to an array of teams
   *
   * SQL: `SELECT * FROM "teams" WHERE "teams"."ownerId" = ?`
   */
  async findByOwnerId(ownerId: number): Promise<InferSelectModel<typeof teamsTable>[]> {
    try {
      return await this.db.select()
        .from(this.table)
        .where(eq(this.table.ownerId, ownerId))
        .all();
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to find teams by owner ID: ${ownerId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find teams by owner ID: ${ownerId}`, error);
      }
    }
  }

  /**
   * Find visible teams
   * @returns Promise resolving to an array of visible teams
   *
   * SQL: `SELECT * FROM "teams" WHERE "teams"."visible" = ?`
   */
  async findVisible(): Promise<InferSelectModel<typeof teamsTable>[]> {
    try {
      return await this.db.select()
        .from(this.table)
        .where(eq(this.table.visible, true))
        .all();
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError("Failed to find visible teams", error).toActionError();
      } else {
        throw new DatabaseError("Failed to find visible teams", error);
      }
    }
  }

  /**
   * Find visible teams where the user is a member or owner
   * @param userId The user ID
   * @returns Promise resolving to an array of visible teams where the user is a member or owner
   *
   * SQL: `SELECT DISTINCT t.* FROM "teams" t
   *       LEFT JOIN "team_members" tm ON t."team_id" = tm."team_id"
   *       WHERE t."team_visibility" = true AND (tm."user_id" = ? OR t."owner_id" = ?)`
   */
  async findVisibleByUserId(userId: number): Promise<InferSelectModel<typeof teamsTable>[]> {
    try {
      // Find teams where the user is a member
      const memberTeams = await this.db.select({
          id: teamsTable.id,
          ownerId: teamsTable.ownerId,
          name: teamsTable.name,
          description: teamsTable.description,
          slug: teamsTable.slug,
          visible: teamsTable.visible
        })
        .from(teamsTable)
        .innerJoin(teamMembersTable, eq(teamsTable.id, teamMembersTable.teamId))
        .where(
          and(
            eq(teamsTable.visible, true),
            eq(teamMembersTable.userId, userId)
          )
        )
        .all();

      // Find teams where the user is the owner
      const ownerTeams = await this.db.select()
        .from(teamsTable)
        .where(
          and(
            eq(teamsTable.visible, true),
            eq(teamsTable.ownerId, userId)
          )
        )
        .all();

      // Combine the results, removing duplicates
      const allTeams = [...memberTeams];

      // Add owner teams if they're not already in the result
      for (const ownerTeam of ownerTeams) {
        if (!allTeams.some(team => team.id === ownerTeam.id)) {
          allTeams.push(ownerTeam);
        }
      }

      return allTeams;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to find visible teams for user with id: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find visible teams for user with id: ${userId}`, error);
      }
    }
  }

  /**
   * Find visible teams where the user with the given Tiltify username is a member or owner
   * @param username The Tiltify username (accounts.providerUsername)
   * @returns Promise resolving to an array of visible teams where the user is a member or owner
   *
   * SQL: `SELECT DISTINCT t.* FROM "teams" t
   *       LEFT JOIN "team_members" tm ON t."team_id" = tm."team_id"
   *       LEFT JOIN "accounts" a ON tm."user_id" = a."user_id"
   *       WHERE t."team_visibility" = true AND a."provider_username" = ?`
   */
  async findVisibleByTiltifyUsername(username: string): Promise<InferSelectModel<typeof teamsTable>[]> {
    try {
      // Find the user with the given Tiltify username
      const account = await this.db.select({
          userId: accounts.userId
        })
        .from(accounts)
        .where(and(eq(accounts.providerUsername, username), eq(accounts.provider, 'tiltify')))
        .get();

      if (!account) {
        return [];
      }

      const userId = account.userId;

      // Find teams where the user is a member
      const memberTeams = await this.db.select({
          id: teamsTable.id,
          ownerId: teamsTable.ownerId,
          name: teamsTable.name,
          description: teamsTable.description,
          slug: teamsTable.slug,
          visible: teamsTable.visible
        })
        .from(teamsTable)
        .innerJoin(teamMembersTable, eq(teamsTable.id, teamMembersTable.teamId))
        .where(
          and(
            eq(teamsTable.visible, true),
            eq(teamMembersTable.userId, userId)
          )
        )
        .all();

      // Find teams where the user is the owner
      const ownerTeams = await this.db.select()
        .from(teamsTable)
        .where(
          and(
            eq(teamsTable.visible, true),
            eq(teamsTable.ownerId, userId)
          )
        )
        .all();

      // Combine the results, removing duplicates
      const allTeams = [...memberTeams];

      // Add owner teams if they're not already in the result
      for (const ownerTeam of ownerTeams) {
        if (!allTeams.some(team => team.id === ownerTeam.id)) {
          allTeams.push(ownerTeam);
        }
      }

      return allTeams;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to find visible teams for user with Tiltify username: ${username}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find visible teams for user with Tiltify username: ${username}`, error);
      }
    }
  }

  /**
   * Find all teams in the table
   * @returns Promise resolving to an array of teams
   *
   * SQL: `SELECT * FROM "teams"`
   */
  async findAll(): Promise<InferSelectModel<typeof teamsTable>[]> {
    try {
      return await this.db.select()
        .from(this.table)
        .all();
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError("Failed to find all teams", error).toActionError();
      } else {
        throw new DatabaseError("Failed to find all teams", error);
      }
    }
  }

  /**
   * Create a new team
   * @param data The data to insert
   * @returns Promise resolving to the created team
   *
   * SQL: `INSERT INTO "teams" (...) VALUES (...) RETURNING *`
   */
  async create(data: InferInsertModel<typeof teamsTable>): Promise<InferSelectModel<typeof teamsTable>> {
    try {
      const [result] = await this.db.insert(this.table)
        .values(data)
        .returning();

      return result;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError("Failed to create team", error).toActionError();
      } else {
        throw new DatabaseError("Failed to create team", error);
      }
    }
  }

  /**
   * Update a team by its primary key
   * @param id The primary key value
   * @param data The data to update
   * @returns Promise resolving to the updated team
   *
   * SQL: `UPDATE "teams" SET ... WHERE "teams"."id" = ? RETURNING *`
   */
  async update(id: number, data: Partial<InferSelectModel<typeof teamsTable>>): Promise<InferSelectModel<typeof teamsTable>> {
    try {
      const [result] = await this.db.update(this.table)
        .set(data)
        .where(eq(this.table.id, id))
        .returning();

      return result;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to update team with id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to update team with id: ${id}`, error);
      }
    }
  }

  /**
   * Delete a team by its primary key
   * @param id The primary key value
   * @returns Promise resolving to a boolean indicating if the team was deleted
   *
   * SQL: `DELETE FROM "teams" WHERE "teams"."id" = ?`
   */
  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.db.delete(this.table)
        .where(eq(this.table.id, id))
        .run();

      return result.results.length > 0;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to delete team with id: ${id}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to delete team with id: ${id}`, error);
      }
    }
  }

  // endregion Basic Team Operations

  // region Team Members Operations
  /**
   * Get all members of a team
   * @param teamId The team ID
   * @returns Promise resolving to an array of team members
   *
   * SQL: `SELECT * FROM "teamMembers" WHERE "teamMembers"."teamId" = ?`
   */
  async getTeamMembers(teamId: number): Promise<InferSelectModel<typeof teamMembersTable>[]> {
    try {
      return await this.db.select()
        .from(teamMembersTable)
        .where(eq(teamMembersTable.teamId, teamId))
        .all();
    } catch (error) {
      console.log('TeamRepo', 'getTeamMembers', error)
      if (this.isAction()) {
        throw new DatabaseError(`Failed to get members for team with id: ${teamId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get members for team with id: ${teamId}`, error);
      }
    }
  }

  /**
   * Add a user to a team
   * @param teamId The team ID
   * @param userId The user ID to add
   * @returns Promise resolving to the created team member record
   *
   * SQL: `INSERT INTO "teamMembers" ("teamId", "userId", "joinedAt") VALUES (?, ?, ?) RETURNING *`
   */
  async addTeamMember(teamId: number, userId: number): Promise<InferSelectModel<typeof teamMembersTable>> {
    try {
      const [result] = await this.db.insert(teamMembersTable)
        .values({
          teamId,
          userId
        })
        .returning();

      return result;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to add user ${userId} to team with id: ${teamId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to add user ${userId} to team with id: ${teamId}`, error);
      }
    }
  }

  /**
   * Remove a user from a team
   * @param teamId The team ID
   * @param userId The user ID to remove
   * @returns Promise resolving to a boolean indicating if the user was removed
   *
   * SQL: `DELETE FROM "teamMembers" WHERE ("teamMembers"."teamId" = ? AND "teamMembers"."userId" = ?)`
   */
  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    try {
      const result = await this.db.delete(teamMembersTable)
        .where(
          and(
            eq(teamMembersTable.teamId, teamId),
            eq(teamMembersTable.userId, userId)
          )
        )
        .run();

      return result.results.length > 0;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to remove user ${userId} from team with id: ${teamId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to remove user ${userId} from team with id: ${teamId}`, error);
      }
    }
  }

  /**
   * Check if a user is a member of a team
   * @param teamId The team ID
   * @param userId The user ID to check
   * @returns Promise resolving to a boolean indicating if the user is a member
   *
   * SQL: `SELECT * FROM "teamMembers" WHERE ("teamMembers"."teamId" = ? AND "teamMembers"."userId" = ?)`
   */
  async isTeamMember(teamId: number, userId: number): Promise<boolean> {
    try {
      const result = await this.db.select()
        .from(teamMembersTable)
        .where(
          and(
            eq(teamMembersTable.teamId, teamId),
            eq(teamMembersTable.userId, userId)
          )
        )
        .get();

      return !!result;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to check if user ${userId} is a member of team with id: ${teamId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to check if user ${userId} is a member of team with id: ${teamId}`, error);
      }
    }
  }

  // endregion Team Members Operations

  // region Team Invites Operations
  /**
   * Get all invites for a team
   * @param teamId The team ID
   * @returns Promise resolving to an array of team invites
   *
   * SQL: `SELECT * FROM "teamInvites" WHERE "teamInvites"."teamId" = ?`
   */
  async getTeamInvites(teamId: number): Promise<InferSelectModel<typeof teamInvitesTable>[]> {
    try {
      return await this.db.select()
        .from(teamInvitesTable)
        .where(eq(teamInvitesTable.teamId, teamId))
        .all();
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to get invites for team with id: ${teamId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get invites for team with id: ${teamId}`, error);
      }
    }
  }

  /**
   * Get all invites for a user
   * @param userId The user ID
   * @returns Promise resolving to an array of team invites
   *
   * SQL: `SELECT * FROM "teamInvites" WHERE "teamInvites"."invitedUserId" = ?`
   */
  async getInvitesByUser(userId: number): Promise<InferSelectModel<typeof teamInvitesTable>[]> {
    try {
      return await this.db.select()
        .from(teamInvitesTable)
        .where(eq(teamInvitesTable.invitedUserId, userId))
        .all();
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to get invites for user with id: ${userId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to get invites for user with id: ${userId}`, error);
      }
    }
  }

  /**
   * Add an invite to a team
   * @param teamId The team ID
   * @param invitedUserId The user ID to invite
   * @returns Promise resolving to the created team invite record
   *
   * SQL: `INSERT INTO "teamInvites" ("teamId", "invitedUserId", "invitedAt") VALUES (?, ?, ?) RETURNING *`
   */
  async addInvite(teamId: number, invitedUserId: number): Promise<InferSelectModel<typeof teamInvitesTable>> {
    try {
      const [result] = await this.db.insert(teamInvitesTable)
        .values({
          teamId,
          invitedUserId
        })
        .returning();

      return result;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to add invite for user ${invitedUserId} to team with id: ${teamId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to add invite for user ${invitedUserId} to team with id: ${teamId}`, error);
      }
    }
  }

  /**
   * Delete an invite from a team
   * @param teamId The team ID
   * @param invitedUserId The invited user ID
   * @returns Promise resolving to a boolean indicating if the invite was deleted
   *
   * SQL: `DELETE FROM "teamInvites" WHERE ("teamInvites"."teamId" = ? AND "teamInvites"."invitedUserId" = ?)`
   */
  async deleteInvite(teamId: number, invitedUserId: number): Promise<boolean> {
    try {
      const result = await this.db.delete(teamInvitesTable)
        .where(
          and(
            eq(teamInvitesTable.teamId, teamId),
            eq(teamInvitesTable.invitedUserId, invitedUserId)
          )
        )
        .run();

      return result.results.length > 0;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to delete invite for user ${invitedUserId} from team with id: ${teamId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to delete invite for user ${invitedUserId} from team with id: ${teamId}`, error);
      }
    }
  }

  /**
   * Check if a user has been invited to a team
   * @param teamId The team ID
   * @param invitedUserId The invited user ID
   * @returns Promise resolving to a boolean indicating if the user has been invited
   *
   * SQL: `SELECT * FROM "teamInvites" WHERE ("teamInvites"."teamId" = ? AND "teamInvites"."invitedUserId" = ?)`
   */
  async hasInvite(teamId: number, invitedUserId: number): Promise<boolean> {
    try {
      const result = await this.db.select()
        .from(teamInvitesTable)
        .where(
          and(
            eq(teamInvitesTable.teamId, teamId),
            eq(teamInvitesTable.invitedUserId, invitedUserId)
          )
        )
        .get();

      return !!result;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to check if user ${invitedUserId} has been invited to team with id: ${teamId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to check if user ${invitedUserId} has been invited to team with id: ${teamId}`, error);
      }
    }
  }

  /**
   * Accept an invite to a team (adds the user to the team and removes the invite)
   * @param teamId The team ID
   * @param invitedUserId The invited user ID
   * @returns Promise resolving to a boolean indicating if the invite was accepted
   *
   * SQL:
   * 1. `SELECT * FROM "teamInvites" WHERE ("teamInvites"."teamId" = ? AND "teamInvites"."invitedUserId" = ?)`
   * 2. `INSERT INTO "teamMembers" ("teamId", "userId", "joinedAt") VALUES (?, ?, ?) RETURNING *`
   * 3. `DELETE FROM "teamInvites" WHERE ("teamInvites"."teamId" = ? AND "teamInvites"."invitedUserId" = ?)`
   */
  async acceptInvite(teamId: number, invitedUserId: number): Promise<boolean> {
    try {
      // Check if the invite exists
      const invite = await this.hasInvite(teamId, invitedUserId);
      if (!invite) {
        return false;
      }

      // Add the user to the team
      await this.addTeamMember(teamId, invitedUserId);

      // Delete the invite
      await this.deleteInvite(teamId, invitedUserId);

      return true;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to accept invite for user ${invitedUserId} to team with id: ${teamId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to accept invite for user ${invitedUserId} to team with id: ${teamId}`, error);
      }
    }
  }

  /**
   * Reject an invite to a team (removes the invite)
   * @param teamId The team ID
   * @param invitedUserId The invited user ID
   * @returns Promise resolving to a boolean indicating if the invite was rejected
   *
   * SQL: `DELETE FROM "teamInvites" WHERE ("teamInvites"."teamId" = ? AND "teamInvites"."invitedUserId" = ?)`
   */
  async rejectInvite(teamId: number, invitedUserId: number): Promise<boolean> {
    try {
      return await this.deleteInvite(teamId, invitedUserId);
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to reject invite for user ${invitedUserId} to team with id: ${teamId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to reject invite for user ${invitedUserId} to team with id: ${teamId}`, error);
      }
    }
  }

  // endregion Team Invites Operations

  /**
   * Find all teams a user is a member of given a tiltify username
   *
   * This function performs the following operations:
   * 1. Finds the user with the given tiltify username
   * 2. If found, retrieves all teams owned by that user
   * 3. Finds all visible teams where the user is a member (but not owner)
   * 4. Combines and returns both sets of teams
   *
   * @param tiltifyUsername - The tiltify username to find teams for
   * @returns Promise resolving to an array of teams the user is a member of
   */
  async findTeamsByTiltifyUsername(tiltifyUsername: string): Promise<InferSelectModel<typeof teamsTable>[]> {
    try {
      // Use the userRepo initialized in the constructor

      // Get the user data by tiltify username
      const userData = await this.userRepo.getUserByTiltifyUsername(tiltifyUsername);

      // If no user found, return empty array
      if (!userData) {
        return [];
      }

      const userId = userData.user.id;

      // Get teams owned by the user
      const ownedTeams = await this.findByOwnerId(userId);

      // Get all visible teams
      const allVisibleTeams = await this.findVisible();

      // Get teams where user is a member (but not owner)
      const memberTeams = [];
      for (const team of allVisibleTeams) {
        if (team.ownerId !== userId) {
          const isMember = await this.isTeamMember(team.id, userId);
          if (isMember) {
            memberTeams.push(team);
          }
        }
      }

      // Combine owned and member teams
      return [...ownedTeams, ...memberTeams];
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to find teams for tiltify username: ${tiltifyUsername}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find teams for tiltify username: ${tiltifyUsername}`, error);
      }
    }
  }


  /**
 * Find all visible teams with member count and owner tiltify username
 *
 * This function performs the following operations:
 * 1. Gets all visible teams
 * 2. For each team, counts the number of members
 * 3. For each team, gets the tiltify username of the owner
 * 4. Returns the combined data
 *
 * @returns Promise resolving to an array of visible teams with member count and owner tiltify username
 */
  async findAllVisibleWithMemberCount(): Promise<(InferSelectModel<typeof teamsTable> & {members: number, ownerTiltifyUsername: string})[]> {
    try {
      // Get all visible teams
      const visibleTeams = await this.findVisible();

      // Process each team to add member count and owner tiltify username
      const result = [];

      for (const team of visibleTeams) {
        // Get team members to count them
        const teamMembers = await this.getTeamMembers(team.id);
        const memberCount = teamMembers.length;

        // Get owner's tiltify account
        const ownerAccount = await this.db.select({
          providerUsername: accounts.providerUsername
        })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, team.ownerId),
            eq(accounts.provider, 'tiltify')
          )
        )
        .get();

        const ownerTiltifyUsername = ownerAccount?.providerUsername || '';

        // Add team with additional data to result
        result.push({
          ...team,
          members: memberCount,
          ownerTiltifyUsername
        });
      }

      return result;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError("Failed to find visible teams with member count", error).toActionError();
      } else {
        throw new DatabaseError("Failed to find visible teams with member count", error);
      }
    }
  }
}
