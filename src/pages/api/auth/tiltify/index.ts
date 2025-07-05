import type {APIRoute} from "astro";
import {generateState} from "arctic";


export const GET: APIRoute = (ctx) => {

  const state = generateState();
  console.log('ctx.request.url', ctx.request.url);
  const TILTIFY_CLIENT_ID = import.meta.env.TILTIFY_CLIENT_ID;
  const redirectUri = new URL("/api/auth/tiltify/callback/", ctx.request.url).toString();
  console.log('redirectUri', redirectUri);
  // const authUrl = `https://v5api.tiltify.com/oauth/authorize?response_type=code&client_id=${TILTIFY_CLIENT_ID}&redirect_uri=${redirectUri}&scope=public&state=${state}`;

  const authUrl = new URL('https://v5api.tiltify.com/oauth/authorize')
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'public');
  authUrl.searchParams.set('client_id', TILTIFY_CLIENT_ID);

  ctx.cookies.set("tiltify_oauth_state", state, {
    httpOnly: true,
    maxAge: 60 * 10,
    secure: import.meta.env.PROD,
    path: "/",
    sameSite: "lax"
  });

  const authUrlStr = authUrl.toString();
  return ctx.redirect(authUrlStr);
}
