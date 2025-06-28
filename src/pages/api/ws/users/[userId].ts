import type {APIRoute} from "astro";
import {validateSessionToken} from "../../../../functions/session.ts";
import {getRPCUserDO, getUserDO} from "../../../../actions/getDO.ts";

export const ALL: APIRoute = async (ctx) => {
  const requestedUserId = ctx.params.userId;
  if (!requestedUserId) {
    console.log('api/ws/users', 'no requestedUserId');
    return new Response('User ID is required', {status: 400});
  }
  /*
  if (ctx.request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  // Get the user ID from the URL parameters

  // Check authentication from session cookie
  const token = ctx.cookies.get("session")?.value;
  if (!token) {
    console.log('api/ws/users', 'no token');
    return new Response('Unauthorized', {status: 401});
  }

  // Validate the session token
  const {user, session} = await validateSessionToken(ctx, token);
  if (!session || !user) {

    console.log('api/ws/users', 'no session');
    return new Response('Unauthorized: Invalid session', {status: 401});
  }

  const header = ctx.request.headers.get('Upgrade');
  console.log('header', header);
  // Verify that the authenticated user is accessing their own data
  if (user.id.toString() !== requestedUserId) {
    console.log('api/ws/users', 'no user');
    return new Response('Forbidden: You can only access your own schedules', {status: 403});
  }*/

  const stubUserDO = await getUserDO(ctx, parseInt(requestedUserId))
  return stubUserDO.fetch(ctx.request)
  /*
  // await stubUserDO.setUserId(parseInt(requestedUserId));
  // const resp = await stubUserDO.fetch(ctx.request);
  console.log(`ws/users/${requestedUserId}`, resp.status)
  console.log(`ws/users/${requestedUserId}`, resp.statusText)
  console.log(`ws/users/${requestedUserId}`, resp.headers)
  console.log(`ws/users/${requestedUserId}`, resp.webSocket !== null)

  const x = getWsServerDurableObjectFetch('TinyDO')

  // @ts-ignore
  return x(ctx.request, ctx.locals.runtime.env)
  */
};
