import type { APIRoute } from 'astro'
import { privateRouter } from '../../../lib/orpc/private/privateRouter.ts'
import { onError } from '@orpc/client'
import { RPCHandler } from '@orpc/server/fetch'
import { DurableIteratorHandlerPlugin } from '@orpc/experimental-durable-iterator'
import { HibernationPlugin } from '@orpc/server/hibernation'
import { loggableError } from '../../../lib/db/loggableError.ts'
import { rejectCrossOrigin } from '../../../lib/sameOrigin.ts'

// No CORSPlugin: only same-origin requests get through, and they need no CORS headers.
const handler = new RPCHandler(privateRouter, {
  plugins: [
    new DurableIteratorHandlerPlugin(),
    new HibernationPlugin(),
  ],
  interceptors: [
    onError((error) => {
      // The error itself, so stack and cause are kept (JSON.stringify of a plain Error is `{}`,
      // F-73); loggableError drops a DrizzleQueryError's bound params (F-32)
      console.error('/api/private', loggableError(error))
    }),
  ],
})

export const ALL: APIRoute = async (context) => {
  const rejected = rejectCrossOrigin(context.request)
  if (rejected) return rejected
  console.log('/api/private', context.request.url)
  const { response } = await handler.handle(context.request, {
    prefix: '/api/private',
    context: {
      locals: context.locals,
      request: context.request,
    },
  })
  return response ?? new Response('Not found', { status: 404 })
}
