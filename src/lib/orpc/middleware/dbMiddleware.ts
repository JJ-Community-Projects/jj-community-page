import { ORPCError, os } from '@orpc/server'
import { hasAstroContext } from './hasAstroContext.ts'
import { getDB, type JJDrizzleDatabase } from '../../db/db.ts'
import type { ResponseHeadersPluginContext } from '@orpc/server/plugins'

interface ORPCContext extends ResponseHeadersPluginContext {
  locals?: App.Locals
  request?: Request
  env?: Env
  db?: JJDrizzleDatabase
}

const db = os.$context<ORPCContext>().middleware(({ context, next }) => {
  if (!context.env || !context.locals || !context.request) {
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }
  const db = context.db ?? getDB(context.locals.runtime.env)

  return next({
    context: {
      // Pass additional context
      db: db,
      env: context.locals.runtime.env,
      request: context.request,
      locals: context.locals,
      resHeaders: context.resHeaders,
    },
  })
})

export const dbMiddleware = hasAstroContext.concat(db)
