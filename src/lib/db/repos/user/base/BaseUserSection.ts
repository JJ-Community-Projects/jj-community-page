import { userDisplayView } from "../../../schema/views-schema.ts";
import { BaseSection } from "../../base/BaseSection.ts";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import type { UserDisplay } from "../../../types/user.ts";
import { eq } from "drizzle-orm";
import type { RepoEnv } from "../../../../db/RepoEnv";


/**
 * Base class for user-related sections that provides common functionality
 * for retrieving user display information
 */
export abstract class BaseUserSection<T, TInsert> extends BaseSection<T, TInsert> {
  /**
   * Creates a new BaseUserSection instance
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
   * @param filterColumn - The column in the relationship table to filter by
   * @param filterValue - The value to filter by
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
}
