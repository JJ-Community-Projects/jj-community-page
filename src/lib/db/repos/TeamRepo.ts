import {DrizzleD1Database} from "drizzle-orm/d1";
import {Repo} from "./Repo";
import {teamInvitesTable, teamMembersTable, teamsTable} from "../schema/schema";
import type {InferInsertModel, InferSelectModel} from "drizzle-orm";
import {and, eq} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError";

/**
 * Repository for working with teams
 */
export class TeamRepo extends Repo<typeof teamsTable._['config']> {
  constructor(db: DrizzleD1Database) {
    super(db, teamsTable);
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
      throw new DatabaseError(`Failed to find team by id: ${id}`, error);
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
      throw new DatabaseError(`Failed to find team by slug: ${slug}`, error);
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
      throw new DatabaseError(`Failed to find teams by owner ID: ${ownerId}`, error);
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
      throw new DatabaseError("Failed to find visible teams", error);
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
      throw new DatabaseError("Failed to find all teams", error);
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
      throw new DatabaseError("Failed to create team", error);
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
      throw new DatabaseError(`Failed to update team with id: ${id}`, error);
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
      throw new DatabaseError(`Failed to delete team with id: ${id}`, error);
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
      throw new DatabaseError(`Failed to get members for team with id: ${teamId}`, error);
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
      throw new DatabaseError(`Failed to add user ${userId} to team with id: ${teamId}`, error);
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
      throw new DatabaseError(`Failed to remove user ${userId} from team with id: ${teamId}`, error);
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
      throw new DatabaseError(`Failed to check if user ${userId} is a member of team with id: ${teamId}`, error);
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
      throw new DatabaseError(`Failed to get invites for team with id: ${teamId}`, error);
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
      throw new DatabaseError(`Failed to get invites for user with id: ${userId}`, error);
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
      throw new DatabaseError(`Failed to add invite for user ${invitedUserId} to team with id: ${teamId}`, error);
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
      throw new DatabaseError(`Failed to delete invite for user ${invitedUserId} from team with id: ${teamId}`, error);
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
      throw new DatabaseError(`Failed to check if user ${invitedUserId} has been invited to team with id: ${teamId}`, error);
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
      throw new DatabaseError(`Failed to accept invite for user ${invitedUserId} to team with id: ${teamId}`, error);
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
      throw new DatabaseError(`Failed to reject invite for user ${invitedUserId} to team with id: ${teamId}`, error);
    }
  }

  // endregion Team Invites Operations
}
