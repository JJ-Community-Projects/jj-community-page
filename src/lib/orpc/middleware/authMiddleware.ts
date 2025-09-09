import {ORPCError, os} from "@orpc/server";
import {hasAstroContext} from "./hasAstroContext.ts";


const auth = os
  .$context<{
    locals?: App.Locals, request: Request, env?: Env
  }>()
  .middleware(({context, next}) => {
    if (!context.locals?.user) {
      console.log('authMiddleware', context.request.url, 'UNAUTHORIZED')
      throw new ORPCError('UNAUTHORIZED')
    }
    return next({
      context: {
        locals: context.locals,
        request: context.request,
        env: context.locals.runtime.env,
        user: context.locals.user,
        userId: context.locals.user.id as number,
        tiltifyId: context.locals.user.tiltifyId as string,
        tiltifyName: context.locals.user.tiltifyName as string,
      }
    })
  })


export const authMiddleware = hasAstroContext.concat(auth);
