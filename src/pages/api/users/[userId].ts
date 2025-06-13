import type {APIRoute} from "astro";
import {validateSessionToken} from "../../../functions/session.ts";

export const GET: APIRoute = async (ctx) => {
  // Get the user ID from the URL parameters
  const requestedUserId = ctx.params.userId;

  if (!requestedUserId) {
    console.log('api/ws/users', 'no requestedUserId');
    return new Response('User ID is required', { status: 400 });
  }
/*
  // Check authentication from session cookie
  const token = ctx.cookies.get("session")?.value;
  if (!token) {
    console.log('api/ws/users', 'no token');
    // return new Response('Unauthorized', { status: 401 });
  }

  // Validate the session token
  const {user, session} = await validateSessionToken(ctx, token);
  if (!session || !user) {

    console.log('api/ws/users', 'no session');
    // return new Response('Unauthorized: Invalid session', { status: 401 });
  }

  const header = ctx.request.headers.get('Upgrade');
  console.log('header', header);
  // Verify that the authenticated user is accessing their own data
  if (user.id.toString() !== requestedUserId) {
    console.log('api/ws/users', 'no user');
    //return new Response('Forbidden: You can only access your own schedules', { status: 403 });
  }*/

  // Get the UserDO for this user
  const UserDO = ctx.locals.runtime.env.UserDO;
  const userDOId = UserDO.idFromName(requestedUserId);
  const stubUserDO = UserDO.get(userDOId);
  // await stubUserDO.setUserId(parseInt(requestedUserId));
  // const tables = await stubUserDO.getTables();

  return new Response('{}',{
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
