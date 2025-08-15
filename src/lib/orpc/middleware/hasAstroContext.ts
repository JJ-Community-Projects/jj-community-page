import type {AstroContext} from "../../AstroContext.ts";
import {ORPCError, os} from "@orpc/server";


export const hasAstroContext = os
  .$context<{ ctx?: AstroContext }>()
  .middleware(async ({context, next}) => {
    if (!context.ctx) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Missing Astro Context'
      })
    }
    return next({
      context: {
        ctx: context.ctx,
        env: context.ctx.locals.runtime.env,
      }
    })
  })
