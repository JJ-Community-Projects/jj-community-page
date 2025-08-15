import {ORPCError, os} from "@orpc/server";
import {hasAstroContext} from "./hasAstroContext.ts";
import type {AstroContext} from "../../AstroContext.ts";


const auth = os
  .$context<{
    ctx?: AstroContext
  }>()
  .middleware(({context, next}) => {
    if (!context.ctx) {
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
    if (!context.ctx.locals.user) {
      throw new ORPCError('UNAUTHORIZED')
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


export const authMiddleware = hasAstroContext.concat(auth);
