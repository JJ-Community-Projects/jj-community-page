// src/lib/db/newRepos/team/base/BaseTeamSection.ts
import { and, eq, sql } from "drizzle-orm";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { BaseSection } from "../../base/BaseSection";
import type { RepoEnv } from "../../../../db/RepoEnv";
import type { User, UserDisplay } from "../../../types/user";
import { userDisplayView } from "../../../schema/views-schema";

/**
 * Base class for team-related sections that provides common functionality
 * for team operations
 */
export abstract class BaseTeamSection<T, TInsert> extends BaseSection<T, TInsert> {
  /** The table this section operates on */
  protected abstract table: SQLiteTableWithColumns<any>;

  /**
   * Creates a new BaseTeamSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  protected constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Selects all UserDisplay fields from userDisplayView
   * @returns An object with all UserDisplay fields selected from userDisplayView
   */
  protected selectUserDisplayFields() {
    return {
      userId: userDisplayView.userId,
      primaryLiveStream: userDisplayView.primaryLiveStream,
      role: userDisplayView.role,
      createdAt: userDisplayView.createdAt,
      username: userDisplayView.username,
      profileImage: userDisplayView.profileImage,
      twitchLogin: userDisplayView.twitchLogin,
      tiltifySlug: userDisplayView.tiltifySlug,
      tiltifyUrl: userDisplayView.tiltifyUrl,
      primaryColor: userDisplayView.primaryColor,
      accentColor: userDisplayView.accentColor,
    };
  }

  /**
   * Generic method to find related users as UserDisplay objects
   *
   * @param table - The relationship table to query
   * @param filterColumn - The column in the relationship table to filter by (usually teamId)
   * @param filterValue - The value to filter by (usually team ID)
   * @param joinColumn - The column in the relationship table to join with userDisplayView.userId
   * @param errorMessage - The error message to use if the query fails
   * @returns An array of UserDisplay objects
   */
  protected async findRelatedUsersAsUserDisplay<TableType extends SQLiteTableWithColumns<any>>(
    table: TableType,
    filterColumn: keyof TableType['_']['columns'],
    filterValue: number,
    joinColumn: keyof TableType['_']['columns'],
    errorMessage: string
  ): Promise<UserDisplay[]> {
    try {
      return this.db.select(this.selectUserDisplayFields())
        .from(table)
        .where(eq(table[filterColumn as string], filterValue))
        .innerJoin(userDisplayView, eq(table[joinColumn as string], userDisplayView.userId))
        .all();
    } catch (error) {
      this.handleError(errorMessage, error);
    }
  }

  /**
   * Generic method to find related users as User objects
   *
   * @param table - The relationship table to query
   * @param userTable - The user table to join with
   * @param filterColumn - The column in the relationship table to filter by (usually teamId)
   * @param filterValue - The value to filter by (usually team ID)
   * @param joinColumn - The column in the relationship table to join with userTable.id
   * @param errorMessage - The error message to use if the query fails
   * @returns An array of User objects
   */
  protected async findRelatedUsersAsUsers<TableType extends SQLiteTableWithColumns<any>, UserTableType extends SQLiteTableWithColumns<any>>(
    table: TableType,
    userTable: UserTableType,
    filterColumn: keyof TableType['_']['columns'],
    filterValue: number,
    joinColumn: keyof TableType['_']['columns'],
    errorMessage: string
  ): Promise<User[]> {
    try {
      return this.db.select({
        id: userTable.id,
        createdAt: userTable.createdAt,
        role: userTable.role,
        primaryLiveStream: userTable.primaryLiveStream
      })
        .from(table)
        .where(eq(table[filterColumn as string], filterValue))
        .innerJoin(userTable, eq(table[joinColumn as string], userTable.id))
        .all();
    } catch (error) {
      this.handleError(errorMessage, error);
    }
  }

  /**
   * Generic method to check if a relationship exists between a team and a user
   *
   * @param table - The relationship table to query
   * @param teamIdColumn - The column in the relationship table that contains the team ID
   * @param teamId - The team ID to check
   * @param userIdColumn - The column in the relationship table that contains the user ID
   * @param userId - The user ID to check
   * @param errorMessage - The error message to use if the query fails
   * @returns True if the relationship exists, false otherwise
   */
  protected async relationshipExists<TableType extends SQLiteTableWithColumns<any>>(
    table: TableType,
    teamIdColumn: keyof TableType['_']['columns'],
    teamId: number,
    userIdColumn: keyof TableType['_']['columns'],
    userId: number,
    errorMessage: string
  ): Promise<boolean> {
    try {
      const result = await this.db.select({ count: sql<number>`count(*)` })
        .from(table)
        .where(
          and(
            eq(table[teamIdColumn as string], teamId),
            eq(table[userIdColumn as string], userId)
          )
        )
        .get();

      return (result?.count ?? 0) > 0;
    } catch (error) {
      this.handleError(errorMessage, error);
    }
  }
}
