

import type {APIRoute} from "astro";


export const GET: APIRoute = async (ctx) => {
  return new Response(JSON.stringify({ cf: ctx.request.cf }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
