import type {APIContext} from "astro";
import type {AstroContext} from "../lib/AstroContext.ts";
import {getDB} from "../lib/db/db.ts";
import {DateTime} from "luxon";
import {tokens} from "../lib/db/schema/auth-schema.ts";
import {and, eq} from "drizzle-orm";

export type TiltifyToken = {
  accessToken: string
  createdAt: string
  expiresIn: number
  refreshToken: string
  scope: string
  tokenType: string
}

/**
 * @example
 * {
 *   "access_token": "ab6a592346444dea97170837e104d8a5ab6a592346444dea97170837e104d8a5",
 *   "created_at": "2023-01-27T19:32:03Z",
 *   "expires_in": 7200,
 *   "refresh_token": "njjjytm3otetmgrjmi00yjawlwe4zgytzjixy2mzm2y3njawcg121231999393a3",
 *   "scope": "public",
 *   "token_type": "bearer"
 * }
 */
export async function getTiltifyTokenFromCode(ctx: APIContext): Promise<TiltifyToken | null> {
  const TILTIFY_CLIENT_ID = import.meta.env.TILTIFY_CLIENT_ID;
  const TILTIFY_SECRET = import.meta.env.TILTIFY_SECRET;
  const url = new URL(ctx.request.url);
  const code = url.searchParams.get("code");
  const redirectUri = new URL("/api/auth/tiltify/callback/",
    ctx.request.url);
  const body = {
    grant_type: "authorization_code",
    client_id: TILTIFY_CLIENT_ID,
    client_secret: TILTIFY_SECRET,
    redirect_uri: redirectUri.toString(),
    code: code
  }
  const tokenRes = await fetch("https://v5api.tiltify.com/oauth/token", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });
  if (!tokenRes.ok) {
    console.log('getTiltifyToken', await tokenRes.json());
    return null;
  } else {
    const token: any = await tokenRes.json();
    return {
      accessToken: token.access_token,
      createdAt: token.created_at,
      expiresIn: token.expires_in,
      refreshToken: token.refresh_token,
      scope: token.scope,
      tokenType: token.token_type,
    }
  }
}


export async function getTiltifyTokenFromContext(ctx: AstroContext): Promise<string | null> {
  const {session, user} = ctx.locals
  if (!session || !user) {
    return null
  }
  const TILTIFY_CLIENT_ID = ctx.locals.runtime.env.TILTIFY_CLIENT_ID;
  const TILTIFY_SECRET = ctx.locals.runtime.env.TILTIFY_SECRET;

  const db = getDB(ctx)
  const now = DateTime.now();
  const tokenFromDB = await db.select()
    .from(tokens)
    .where(and(eq(tokens.userId, user.id), eq(tokens.provider, 'tiltify')))
    .get()

  if (!tokenFromDB) {
    return null
  }

  const expiresAt = DateTime.fromJSDate(tokenFromDB.expiresAt)
  console.log('expiresAt', expiresAt)
  console.log('now', now)
  console.log('now < expiresAt', now < expiresAt)
  if (now < expiresAt) {
    return tokenFromDB.accessToken
  }
  const body = {
    "client_id": TILTIFY_CLIENT_ID,
    "client_secret": TILTIFY_SECRET,
    "refresh_token": tokenFromDB.refreshToken,
    "grant_type": "refresh_token"
  }
  console.log(body)
  const refreshResponse = await fetch('https://v5api.tiltify.com/oauth/token', {
    method: 'POST',
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(
      body
    ),
  })
  console.log('refreshResponse', refreshResponse)
  if (!refreshResponse.ok) {
    console.log('prepTiltifyAPIRequest', await refreshResponse.json());
    return null;
  }
  const tiltifyToken: any = await refreshResponse.json();
  console.log('tiltifyToken', tiltifyToken);
  await db.insert(tokens)
    .values({
      userId: user.id,
      provider: 'tiltify',
      accessToken: tiltifyToken.access_token,
      refreshToken: tiltifyToken.refresh_token,
      expiresAt: new Date(Date.now() + tiltifyToken.expires_in * 1000)
    })
    .onConflictDoUpdate({
      target: [tokens.userId, tokens.provider],
      set: {
        accessToken: tiltifyToken.access_token,
        refreshToken: tiltifyToken.refresh_token,
        expiresAt: new Date(Date.now() + tiltifyToken.expires_in * 1000)
      }
    })
    .run();
  return tiltifyToken.access_token
}


/**
 * Calls: https://v5api.tiltify.com/api/public/current-user
 * @example
 * {
 *   "data": {
 *     "avatar": {
 *       "alt": "Short image description used as alternative text.",
 *       "height": 200,
 *       "src": "https://tiltify.com/images/example.jpg",
 *       "width": 200
 *     },
 *     "description": "Professional twitch streamer who likes charity!",
 *     "id": "be0e3b3c-133c-4276-a3c0-7c9af6a32c0f",
 *     "legacy_id": 666497957,
 *     "slug": "username",
 *     "social": {
 *       "discord": "https://discord.gg/tiltify",
 *       "facebook": "tiltify",
 *       "instagram": "tiltify",
 *       "snapchat": "tiltify",
 *       "tiktok": "tilitfy",
 *       "twitch": "tilitfy",
 *       "twitter": "tiltify",
 *       "website": "https://tiltify.com",
 *       "youtube": "UCWcPgWbuWuJX5rHWm6Kb4Vw"
 *     },
 *     "total_amount_raised": {
 *       "currency": "USD",
 *       "value": "182.32"
 *     },
 *     "url": "https://tiltify.com/@username",
 *     "username": "UserName"
 *   }
 * }
 * @param ctx
 * @param accessToken
 */

// Define types for the Tiltify user response
export interface TiltifyAvatar {
  alt: string;
  height: number;
  src: string;
  width: number;
}

export interface TiltifySocial {
  discord?: string;
  facebook?: string;
  instagram?: string;
  snapchat?: string;
  tiktok?: string;
  twitch?: string;
  twitter?: string;
  website?: string;
  youtube?: string;
}

export interface TiltifyAmountRaised {
  currency: string;
  value: string;
}

/**
 * @example
 * {
 *  "id":"438f3bd0-af3c-4f6d-8ff5-47d76d1737d9",
 *  "description":"Account to access the api",
 *  "url":"/@ostof",
 *  "username":"ostof",
 *  "slug":"ostof",
 *  "avatar": {
 *    "width":200,
 *    "alt":"alt",
 *    "src":"https://assets.tiltify.com/assets/default-avatar.png",
 *    "height":200},
 *    "social":{"twitch":"ostof","twitter":null,"facebook":null,"discord":null,"website":null,"snapchat":null,"instagram":null,"youtube":null,"tiktok":null},
 *    "total_amount_raised":{"value":"0.00","currency":"USD"},
 *    "legacy_id":177316
 *  }
 */
export interface TiltifyUserData {
  avatar: TiltifyAvatar;
  description: string;
  id: string;
  legacy_id: number;
  slug: string;
  social: TiltifySocial;
  total_amount_raised: TiltifyAmountRaised;
  url: string;
  username: string;
}

export interface TiltifyUserResponse {
  data: TiltifyUserData;
}



export async function getTiltifyUser(accessToken: string): Promise<TiltifyUserResponse | null> {
  try {
    const response = await fetch("https://v5api.tiltify.com/api/public/current-user", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error('getTiltifyUser error:', await response.json());
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching Tiltify user:', error);
    return null;
  }
}
