import type {APIRoute} from "astro";
import {getBlockedNames} from "../../functions/blockedNames.ts";

export const GET: APIRoute = async (ctx) => {
  const blocked = await getBlockedNames(ctx)
  console.log(blocked)
  return new Response(JSON.stringify(blocked), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
