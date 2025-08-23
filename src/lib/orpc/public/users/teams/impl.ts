import {teamMembersTable, teamsTable} from "../../../../db/schema/jj-schema.ts";
import {eq} from "drizzle-orm";
import {implement} from "@orpc/server";
import {dbMiddleware} from "../../../middleware/dbMiddleware.ts";
import {usersTeamsContracts} from "./contract.ts";
import {getUserBySlug as getUserBySlugUtil} from "../util.ts";

const os = implement(usersTeamsContracts)
  .use(dbMiddleware);

/**
 * Get teams by user ID
 * Returns all teams that the specified user is a member of
 * This includes teams where the user is either a member or owner
 */
export const getTeamsByUserSlug = os.getTeamsByUserSlugContract
  .handler(async ({context, input}) => {
    const db = context.db;

    // Fetch user by slug (throws NOT_FOUND if user doesn't exist)
    const user = await getUserBySlugUtil(db, input.slug);
    const userId = user.userId;

    // Query teams where the user is a member through teamMembersTable
    // This will include teams where the user is both a regular member and owner
    const teams = await db.select({
      id: teamsTable.id,
      name: teamsTable.name,
      slug: teamsTable.slug,
      description: teamsTable.description,
      visible: teamsTable.visible,
      ownerId: teamsTable.ownerId
    })
      .from(teamMembersTable)
      .innerJoin(teamsTable, eq(teamMembersTable.teamId, teamsTable.id))
      .where(eq(teamMembersTable.userId, userId))
      .all();

    return {teams};
  })


export const userTeamsRouter = {
  getTeamsByUserSlug
}
