import {ORPCError, os} from '@orpc/server'
import type {AstroContext} from "../../AstroContext.ts";
import type {DrizzleD1Database} from "drizzle-orm/d1";
import {hasAstroContext} from "./hasAstroContext.ts";
import {getDB} from "../../db/db.ts";

const db = os
  .$context<{
    ctx?: AstroContext
    db?: DrizzleD1Database
  }>()
  .middleware(({context, next}) => {
    if (!context.ctx) {
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
    const db = context.db ?? getDB(context.ctx.locals.runtime.env)
    return next({
      context: { // Pass additional context
        ctx: context.ctx,
        db: db
      }
    })
  })

export const dbMiddleware = hasAstroContext.concat(db)
