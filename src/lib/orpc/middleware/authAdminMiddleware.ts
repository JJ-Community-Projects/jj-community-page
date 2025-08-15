import {ORPCError} from "@orpc/server";
import {dbMiddleware} from "./dbMiddleware.ts";
import {authMiddleware} from "./authMiddleware.ts";
import {users} from "../../db/schema/auth-schema.ts";
import {eq} from "drizzle-orm";

/**
 * Admin authentication middleware for oRPC procedures
 * Extends the basic auth middleware to ensure only admin users can access protected procedures
 * Used for tag management and other admin-only operations
 */

export const adminAuthMiddleware =
  dbMiddleware.concat(authMiddleware)
    .concat(async ({context, next}) => {
      // Ensure we have a valid Astro context
      if (!context.ctx) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Missing Astro context'})
      }

      // Ensure user is authenticated
      if (!context.ctx.locals.user) {
        throw new ORPCError('UNAUTHORIZED', {message: 'Authentication required'})
      }

      const userId = context.userId

      const db = context.db

      const result = await db
        .select({
          role: users.role
        })
        .from(users)
        .where(eq(users.id, userId))
        .get()

      if (!result) {
        throw new ORPCError('UNAUTHORIZED')
      }

      if (result.role !== 'admin') {
        throw new ORPCError('UNAUTHORIZED', {message: 'User is not admin'})
      }

      return next({
        context: {
          ctx: context.ctx,
          user: context.ctx.locals.user,
          userId: context.ctx.locals.user.id as number,
          tiltifyId: context.ctx.locals.user.tiltifyId as string,
          tiltifyName: context.ctx.locals.user.tiltifyName as string,
        }
      })
    })
