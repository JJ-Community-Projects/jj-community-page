import type {APIRoute} from "astro";
import {CORSPlugin} from "@orpc/server/plugins";
import {privateRouter} from "../../../lib/orpc/private/privateRouter.ts";
import {onError} from "@orpc/client";
import {RPCHandler} from "@orpc/server/fetch";

const handler = new RPCHandler(privateRouter, {
  plugins: [
    new CORSPlugin()
  ],
  interceptors: [
    onError((error) => {
      console.error(error)
    })
  ],
})

export const ALL: APIRoute = async (context) => {
  console.log('/api/private', context.request.url)
  const {response} = await handler.handle(context.request, {
    prefix: '/api/private',
    context: {
      locals: context.locals,
      request: context.request,
    },
  })
  return response ?? new Response('Not found', {status: 404})
}
