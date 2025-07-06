import type {APIRoute} from "astro";
import {getUserLiveStatusDO} from "../../../../../actions/getDO.ts";


export const ALL: APIRoute = async (ctx) => {
  const env = ctx.locals.runtime.env.ENVIRONMENT
  const userId = ctx.params.userId;
  if (!userId) {
    console.log('api/ws/live/users/[userId]', 'no userId');
    return new Response('User ID is required', {status: 400});
  }

  const DO = getUserLiveStatusDO(ctx, parseInt(userId))

  return DO.fetch(ctx.request)
}
