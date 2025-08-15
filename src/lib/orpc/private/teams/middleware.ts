import {ORPCError} from "@orpc/server";
import {eq} from "drizzle-orm";
import {teamsTable} from "../../../db/schema/jj-schema.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";

/**
 * Middleware that validates the current user owns the specified team.
 * Expects teamId in the input and adds team data to context.
 */
export const teamsOwnerMiddleware =
  authMiddleware
    .concat(dbMiddleware)
    .concat(async ({context, next}, input: { teamId: number }) => {
      const db = context.db;
      const userId = context.userId;
      const {teamId} = input;

      // Get team and verify ownership
      const team = await db.select()
        .from(teamsTable)
        .where(eq(teamsTable.id, teamId))
        .get();

      if (!team) {
        throw new ORPCError('NOT_FOUND', {message: 'Team not found'});
      }

      if (team.ownerId !== userId) {
        throw new ORPCError('FORBIDDEN', {message: 'Only team owners can perform this action'});
      }

      return next({
        context: {
          ...context,
          team, // Add team data to context for use in handlers
        }
      });
    });
