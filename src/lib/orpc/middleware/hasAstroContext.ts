import {ORPCError, os} from "@orpc/server";


export const hasAstroContext = os
  .$context<{ locals?: App.Locals, request?: Request, env?: Env }>()
  .middleware(async ({context, next}) => {
    if (!context.locals || !context.request) {
      console.error('No context')
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
    return next({
      context: {
        locals: context.locals,
        request: context.request,
        env: context.locals.runtime.env
      }
    })
  })
