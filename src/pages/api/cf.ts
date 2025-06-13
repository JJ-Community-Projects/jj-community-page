

import type {APIRoute} from "astro";


export const GET: APIRoute = async (ctx) => {
  const runtime = ctx.locals.runtime;
  return new Response(JSON.stringify(runtime), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
