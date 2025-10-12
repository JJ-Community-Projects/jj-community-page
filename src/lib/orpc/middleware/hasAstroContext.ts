import { ORPCError, os } from '@orpc/server'
import type { ResponseHeadersPluginContext } from '@orpc/server/plugins'

interface ORPCContext extends ResponseHeadersPluginContext {
  locals?: App.Locals
  request?: Request
  env?: Env
}

export const hasAstroContext = os
  .$context<ORPCContext>()
  .middleware(async ({ context, next }) => {
    if (!context.locals || !context.request) {
      console.error('No context')
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
    return next({
      context: {
        locals: context.locals,
        request: context.request,
        env: context.locals.runtime.env,
        resHeaders: context.resHeaders,
      },
    })
  })
