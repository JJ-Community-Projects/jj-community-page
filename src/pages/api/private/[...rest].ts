import type { APIRoute } from 'astro'
import { CORSPlugin } from '@orpc/server/plugins'
import { privateRouter } from '../../../lib/orpc/private/privateRouter.ts'
import { onError } from '@orpc/client'
import { RPCHandler } from '@orpc/server/fetch'
import { DurableEventIteratorHandlerPlugin } from '@orpc/experimental-durable-event-iterator'
import { HibernationPlugin } from '@orpc/server/hibernation'

const handler = new RPCHandler(privateRouter, {
  plugins: [
    new CORSPlugin(),
    new DurableEventIteratorHandlerPlugin(),
    new HibernationPlugin(),
  ],
  interceptors: [
    onError((error) => {
      console.error(JSON.stringify(error, null, 2))
    }),
  ],
})

export const ALL: APIRoute = async (context) => {
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
