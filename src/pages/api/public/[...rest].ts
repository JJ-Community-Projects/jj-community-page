import { env } from 'cloudflare:workers'
import type { APIRoute } from 'astro'
import { CORSPlugin, ResponseHeadersPlugin } from '@orpc/server/plugins'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { SmartCoercionPlugin } from '@orpc/json-schema'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { publicHttpRouter } from '../../../lib/orpc/public/publicRouter.ts'
import { onError } from '@orpc/client'
import { loggableError } from '../../../lib/db/loggableError.ts'

// Only the Twitch extension's routes; the other public procedures are called in-process
// (serverClientPublic). CORS stays open: the extension runs on *.ext-twitch.tv.
const handler = new OpenAPIHandler(publicHttpRouter, {
  interceptors: [
    onError((raw) => {
      const error = loggableError(raw) // F-32
      console.error('OpenAPIHandler', error)
      const cause = (error as any).cause
      if (cause) {
        console.error('OpenAPIHandler', cause)
        console.error('OpenAPIHandler', JSON.stringify(cause))
      }
    }),
  ],
  plugins: [
    new CORSPlugin(),
    new ResponseHeadersPlugin(),
    new SmartCoercionPlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
})

export const ALL: APIRoute = async (context) => {
  console.log('api/public/[...rest].ts')
  try {
    const { response } = await handler.handle(context.request, {
      prefix: '/api/public',
      context: {
        locals: context.locals,
        request: context.request,
        env: env,
      },
    })
    return response ?? new Response('Not found', { status: 404 })
  } catch (e) {
    console.error('error', e)
  }
  return new Response('Not found', { status: 404 })
}
