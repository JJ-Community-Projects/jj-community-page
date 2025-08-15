import type {APIRoute} from "astro";
import {CORSPlugin} from "@orpc/server/plugins";
import {router} from "../../lib/orpc/router.ts";
import {OpenAPIHandler} from "@orpc/openapi/fetch";

const handler = new OpenAPIHandler(router, {
  plugins: [
    new CORSPlugin(),
  ]
})

export const ALL: APIRoute = async (context) => {
  const {response} = await handler.handle(context.request, {
    prefix: '/orpc',
    context: {
      ctx: context,
    },
  })
  return response ?? new Response('Not found', {status: 404})
}
