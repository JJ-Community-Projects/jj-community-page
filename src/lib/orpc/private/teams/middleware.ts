import {ORPCError} from "@orpc/server";
import {and, eq} from "drizzle-orm";
import {teamMembersTable, teamsTable} from "../../../db/schema/jj-schema.ts";
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

/**
 * Middleware that validates the current user owns the specified team or is a member of it.
 * Expects teamId in the input and adds team data to context.
 */
export const teamsMemberMiddleware =
  authMiddleware
    .concat(dbMiddleware)
    .concat(async ({context, next}, input: { teamId: number }) => {
      const db = context.db;
      const userId = context.userId;
      const {teamId} = input;

      const team = await db.select()
        .from(teamsTable)
        .where(eq(teamsTable.id, teamId))
        .get();

      if (!team) {
        throw new ORPCError('NOT_FOUND', {message: 'Team not found'});
      }

      if (team.ownerId !== userId) {
        const membership = await db.select()
          .from(teamMembersTable)
          .where(and(
            eq(teamMembersTable.teamId, teamId),
            eq(teamMembersTable.userId, userId),
          ))
          .get();

        if (!membership) {
          throw new ORPCError('FORBIDDEN', {message: 'You do not have access to this team'});
        }
      }

      return next({
        context: {
          ...context,
          team,
        }
      });
    });
