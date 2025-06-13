import type {APIRoute} from "astro";
import {validateSessionToken} from "../../../../functions/session.ts";

export const ALL: APIRoute = async (ctx) => {
  const requestedTeamId = ctx.params.teamId;
  if (!requestedTeamId) {
    console.log('api/ws/teams', 'no requestedTeamId');
    return new Response('Team ID is required', {status: 400});
  }

  /*
  if (ctx.request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  // Check authentication from session cookie
  const token = ctx.cookies.get("session")?.value;
  if (!token) {
    console.log('api/ws/teams', 'no token');
    return new Response('Unauthorized', {status: 401});
  }

  // Validate the session token
  const {user, session} = await validateSessionToken(ctx, token);
  if (!session || !user) {
    console.log('api/ws/teams', 'no session');
    return new Response('Unauthorized: Invalid session', {status: 401});
  }

  // Here you could add additional checks to verify that the user has access to this team
  // For example, check if the user is a member or owner of the team
  */

  // Get the TeamDO for this team
  const TeamDO = ctx.locals.runtime.env.TeamDO;
  if (!TeamDO) {
    return new Response("Durable object not found", {status: 404});
  }

  const teamDOId = TeamDO.idFromName(requestedTeamId);
  const stubTeamDO = TeamDO.get(teamDOId);
  return stubTeamDO.fetch(ctx.request);
};
