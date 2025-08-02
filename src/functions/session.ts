import {getDB} from "../lib/db/db.ts";
import {accounts, tokens, users, userSocials, userStyles} from "../lib/db/schema/auth-schema.ts";
import type {Session} from "../lib/auth/Session.ts";
import type {User} from "../lib/auth/User.ts";
import {encodeBase32, encodeHexLowerCase} from "@oslojs/encoding";
import {sha256} from "@oslojs/crypto/sha2";
import {eq} from "drizzle-orm";
import type {TiltifyToken, TiltifyUserData, TiltifySocial} from "./tiltify.ts";
import type {AstroContext} from "../lib/AstroContext.ts";
import {drizzle, type DrizzleD1Database} from "drizzle-orm/d1";
import {socialUrlRegex} from "./socialUrlRegex.ts";

/**
 * Saves social media information from Tiltify to the userSocials table
 *
 * @param db - The database connection
 * @param userId - The user ID
 * @param social - The social media information from Tiltify
 */
async function saveTiltifySocials(db: DrizzleD1Database, userId: number, social: TiltifySocial) {
  try {
    // Get regex patterns for validation
    const regexes = socialUrlRegex();

    // Map Tiltify social data to userSocials format
    const socialsToSave = [];

    // Twitch
    if (social.twitch) {
      const url = `https://twitch.tv/${social.twitch}`;
      // Validate URL against regex pattern
      if (regexes.twitch.test(url)) {
        socialsToSave.push({
          userId,
          provider: 'twitch',
          url
        });
      } else {
        console.log(`Skipping invalid Twitch URL for user ${userId}: ${url}`);
      }
    }

    // Twitter/X
    if (social.twitter) {
      const url = `https://twitter.com/${social.twitter}`;
      // Validate URL against regex pattern
      if (regexes.twitter.test(url)) {
        socialsToSave.push({
          userId,
          provider: 'twitter',
          url
        });
      } else {
        console.log(`Skipping invalid Twitter URL for user ${userId}: ${url}`);
      }
    }

    // YouTube
    if (social.youtube) {
      // YouTube can be a channel ID or username
      // For simplicity, we'll use the @username format
      const url = `https://youtube.com/@${social.youtube}`;
      // Validate URL against regex pattern
      if (regexes.youtube.test(url)) {
        socialsToSave.push({
          userId,
          provider: 'youtube',
          url
        });
      } else {
        console.log(`Skipping invalid YouTube URL for user ${userId}: ${url}`);
      }
    }

    // Save each social media link to the database
    for (const socialData of socialsToSave) {
      await db.insert(userSocials)
        .values(socialData)
        .onConflictDoUpdate({
          target: [userSocials.userId, userSocials.provider],
          set: { url: socialData.url }
        })
        .run();
    }

    console.log('Saved social media information for user', userId);
  } catch (error) {
    console.error('Error saving social media information:', error);
  }
}

/**
 * Transforms a raw session string into a valid Session object.
 * This function ensures that the expiresAt property is properly converted from a string to a Date object.
 *
 * @param {string} rawSession - The raw session string from KV storage
 * @returns {Session} A valid Session object with proper types
 * @throws {Error} If the session JSON cannot be parsed, returns a default expired session
 */
export function transformRawSession(rawSession: string): Session {
  try {
    // console.log('transformRawSession', rawSession);
    const parsedSession = JSON.parse(rawSession);
    return {
      ...parsedSession,
      expiresAt: new Date(parsedSession.expiresAt)
    };
  } catch (error) {
    console.error('Failed to parse session JSON:', error);
    // Return a default session with minimal valid data
    return {
      id: '',
      userId: 0,
      expiresAt: new Date(0) // Expired session
    };
  }
}

/**
 * Result type for session validation, containing either a valid session and user or null values for both.
 */
type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };

/**
 * Validates a session token and retrieves the associated user.
 *
 * This function:
 * 1. Converts the token to a session ID
 * 2. Retrieves the session from KV storage
 * 3. Validates the session expiration
 * 4. Retrieves the associated user account
 * 5. Extends the session if it's close to expiration
 *
 * @param {AstroContext} ctx - The Astro context object
 * @param {string} token - The session token from the cookie
 * @returns {Promise<SessionValidationResult>} Object containing the session and user if valid, or null values if invalid
 */
export async function validateSessionToken(ctx: AstroContext, token: string): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  const KV = ctx.locals.runtime.env.KV;
  const db = getDB(ctx);
  const rawSession = await KV.get(`session:${sessionId}`);
  if (!rawSession) {
    return {session: null, user: null};
  }

  const session = transformRawSession(rawSession);

  // If session ID is empty, it means the session couldn't be parsed properly
  // or the default session was returned from transformRawSession
  if (!session.id) {
    return {session: null, user: null};
  }

  const account = await db.select()
    .from(accounts)
    .where(eq(accounts.userId, session.userId))
    .get();

  if (!account) {
    return {session: null, user: null};
  }

  const user: User = {
    id: account.userId,
    tiltifyId: account.providerId,
    tiltifyName: account.providerUsername,
  };

  // Check if session has expired
  if (Date.now() >= session.expiresAt.getTime()) {
    await KV.delete(`session:${sessionId}`);
    return {session: null, user: null};
  }

  // Extend session if it's within 15 days of expiration
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // Extend by 30 days
    await KV.put(`session:${sessionId}`, JSON.stringify(session));
  }

  return {session, user};
}


export async function validateSessionTokenFromEnv(env: Env, token: string): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  const KV = env.KV;
  const db = drizzle(env.DB)
  const rawSession = await KV.get(`session:${sessionId}`);
  if (!rawSession) {
    return {session: null, user: null};
  }

  const session = transformRawSession(rawSession);

// If session ID is empty, it means the session couldn't be parsed properly
// or the default session was returned from transformRawSession
  if (!session.id) {
    return {session: null, user: null};
  }

  const account = await db.select()
    .from(accounts)
    .where(eq(accounts.userId, session.userId))
    .get();

  if (!account) {
    return {session: null, user: null};
  }

  const user: User = {
    id: account.userId,
    tiltifyId: account.providerId,
    tiltifyName: account.providerUsername,
  };

// Check if session has expired
  if (Date.now() >= session.expiresAt.getTime()) {
    await KV.delete(`session:${sessionId}`);
    return {session: null, user: null};
  }

// Extend session if it's within 15 days of expiration
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // Extend by 30 days
    await KV.put(`session:${sessionId}`, JSON.stringify(session));
  }

  return {session, user};
}

/**
 * Invalidates a specific session by its ID and removes it from the user's session list.
 *
 * This function:
 * 1. Retrieves the session from KV storage
 * 2. Deletes the session from KV storage
 * 3. Updates the user's session list to remove this session ID
 *
 * @param {AstroContext} ctx - The Astro context object
 * @param {string} sessionId - The ID of the session to invalidate
 * @returns {Promise<void>}
 */
export async function invalidateSession(ctx: AstroContext, sessionId: string): Promise<void> {
  const KV = ctx.locals.runtime.env.KV;
  const rawSession = await KV.get(`session:${sessionId}`);
  if (!rawSession) {
    return;
  }

  const session = transformRawSession(rawSession);

  // If session ID is empty, it means the session couldn't be parsed properly
  // or the default session was returned from transformRawSession
  if (!session.id) {
    return;
  }

  // Delete the session from KV storage
  await KV.delete(`session:${sessionId}`);

  // Update the user's session list
  const userId = session.userId;
  const userSessionsKey = `user-sessions:${userId}`;
  const rawSessionIds = await KV.get(userSessionsKey);
  if (!rawSessionIds) {
    return;
  }

  // Parse the user's session list
  let sessionIds: string[] = [];
  try {
    console.log('invalidateSession', rawSessionIds);
    sessionIds = JSON.parse(rawSessionIds);
  } catch (error) {
    console.error('Failed to parse rawSessionIds JSON:', error);
    return;
  }

  // Remove this session ID from the list
  const newSessionIds = sessionIds.filter(id => id !== sessionId);

  // Update the user's session list in KV storage
  await KV.put(userSessionsKey, JSON.stringify(newSessionIds), {
    expirationTtl: 30 * 24 * 60 * 60 // 30 days TTL for the index
  });
}


/**
 * Sets the session token cookie in the response.
 *
 * @param {AstroContext} context - The Astro context object
 * @param {string} token - The session token to set in the cookie
 * @param {Date} expiresAt - The expiration date for the cookie
 * @returns {void}
 */
export function setSessionTokenCookie(context: AstroContext, token: string, expiresAt: Date): void {
  context.cookies.set("session", token, {
    httpOnly: true,
    path: "/",
    secure: import.meta.env.PROD, // Only use secure in production
    sameSite: "lax",
    expires: expiresAt
  });
}

/**
 * Deletes the session token cookie by setting an empty value with immediate expiration.
 *
 * @param {AstroContext} context - The Astro context object
 * @returns {void}
 */
export function deleteSessionTokenCookie(context: AstroContext): void {
  context.cookies.set("session", "", {
    httpOnly: true,
    path: "/",
    secure: import.meta.env.PROD, // Only use secure in production
    sameSite: "lax",
    maxAge: 0 // Expire immediately
  });
}

/**
 * Invalidates all sessions for a specific user.
 *
 * This function:
 * 1. Retrieves all session IDs for the user
 * 2. Deletes each session from KV storage
 * 3. Deletes the user's session index
 *
 * @param {AstroContext} ctx - The Astro context object
 * @param {number} userId - The ID of the user whose sessions should be invalidated
 * @returns {Promise<void>}
 */
export async function invalidateUserSessions(ctx: AstroContext, userId: number): Promise<void> {
  const KV = ctx.locals.runtime.env.KV;

  // Get all sessionIds for this user
  const userSessionsKey = `user-sessions:${userId}`;
  const rawSessionIds = await KV.get(userSessionsKey);

  if (rawSessionIds) {
    let sessionIds: string[] = [];
    try {
      console.log('invalidateUserSessions', rawSessionIds);
      sessionIds = JSON.parse(rawSessionIds);
    } catch (error) {
      console.error('Failed to parse user sessions JSON:', error);
      // Use empty array as default
    }

    // Delete each session
    const deletePromises = sessionIds.map(sessionId =>
      KV.delete(`session:${sessionId}`)
    );

    // Wait for all deletions to complete
    await Promise.all(deletePromises);

    // Delete the index
    await KV.delete(userSessionsKey);
  }
}

/**
 * Generates a cryptographically secure random session token.
 *
 * This function creates a 20-byte random token and encodes it as a lowercase base32 string.
 * The resulting token is suitable for use as a session identifier.
 *
 * @returns {string} A random session token
 */
export function generateSessionToken(): string {
  const tokenBytes = new Uint8Array(20);
  crypto.getRandomValues(tokenBytes);
  return encodeBase32(tokenBytes).toLowerCase();
}


/**
 * Creates a new session for a user and stores it in KV storage.
 *
 * This function:
 * 1. Generates a session ID from the token
 * 2. Creates a session object with a 30-day expiration
 * 3. Stores the session in KV storage
 * 4. Updates the user's session list to include this session
 *
 * @param {AstroContext} context - The Astro context object
 * @param {string} token - The session token
 * @param {number} userId - The ID of the user for whom to create the session
 * @returns {Promise<Session>} The created session object
 */
export async function createSession(context: AstroContext, token: string, userId: number): Promise<Session> {
  const KV = context.locals.runtime.env.KV;
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  // Create a new session with 30-day expiration
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
  };

  // Store the session in KV storage with 7-day TTL
  await KV.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: 7 * 24 * 60 * 60 // 7 days
  });

  // Get existing sessionIds for this user
  const userSessionsKey = `user-sessions:${userId}`;
  const existingSessions = await KV.get(userSessionsKey);
  let sessionIds: string[] = [];
  if (existingSessions) {
    try {
      console.log('createSession', existingSessions);
      sessionIds = JSON.parse(existingSessions);
    } catch (error) {
      console.error('Failed to parse existing sessions JSON:', error);
      // Use empty array as default
    }
  }

  // Add this sessionId to the user's session list if not already present
  if (!sessionIds.includes(sessionId)) {
    sessionIds.push(sessionId);
    await KV.put(userSessionsKey, JSON.stringify(sessionIds), {
      expirationTtl: 30 * 24 * 60 * 60 // 30 days TTL for the index
    });
  }

  return session;
}

/**
 * Creates a new user account and session for a Tiltify user.
 *
 * This function:
 * 1. Creates a new user record in the database
 * 2. Creates an account record linking the user to their Tiltify account
 * 3. Stores the Tiltify access and refresh tokens
 * 4. Creates a new session for the user
 *
 * @param {AstroContext} ctx - The Astro context object
 * @param {string} token - The session token to use
 * @param {TiltifyUserData} tiltifyUser - The user's Tiltify user
 * @param {TiltifyToken} tiltifyToken - The Tiltify access and refresh tokens
 * @returns {Promise<Session|null>} The created session object, or null if an error occurred
 */
export async function createNewUserSession(
  ctx: AstroContext,
  token: string,
  tiltifyUser: TiltifyUserData,
  tiltifyToken: TiltifyToken,
): Promise<Session | null> {
  const KV = ctx.locals.runtime.env.KV;
  const db = getDB(ctx);

  try {
    // Create a new user record
    const user = await db.insert(users)
      .values({}).returning().then(users => users[0]);

    // Create an account record linking the user to their Tiltify account
    await db
      .insert(accounts)
      .values({
        userId: user.id,
        provider: 'tiltify',
        providerId: tiltifyUser.id,
        providerUsername: tiltifyUser.username,
        meta: tiltifyUser,
      }).returning();

    // Generate a session ID from the token
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

    // Create a new session with 30-day expiration
    const session: Session = {
      id: sessionId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
    };

    // Store the Tiltify tokens in the database
    await db.insert(tokens)
      .values({
        userId: user.id,
        provider: 'tiltify',
        accessToken: tiltifyToken.accessToken,
        refreshToken: tiltifyToken.refreshToken,
        expiresAt: new Date(Date.now() + tiltifyToken.expiresIn * 1000)
      })
      .onConflictDoUpdate({
        target: [tokens.userId, tokens.provider],
        set: {
          accessToken: tiltifyToken.accessToken,
          refreshToken: tiltifyToken.refreshToken,
          expiresAt: new Date(Date.now() + tiltifyToken.expiresIn * 1000)
        }
      })
      .run();

    // Store user's social media information from Tiltify
    if (tiltifyUser.social) {
      await saveTiltifySocials(db, user.id, tiltifyUser.social);
    }

    // Set default user styles
    try {
      await db.insert(userStyles)
        .values({
          userId: user.id,
          // Default values are already defined in the schema, but we're setting them explicitly for clarity
          primaryColor: '#E30E50',
          accentColor: '#3584BF'
        })
        .run();
      console.log('Default user styles set for user', user.id);
    } catch (error) {
      console.error('Error setting default user styles:', error);
      // Continue even if setting styles fails
    }

    // Store the session in KV storage with 7-day TTL
    await KV.put(`session:${sessionId}`, JSON.stringify(session), {
      expirationTtl: 7 * 24 * 60 * 60 // 7 days
    });

    return session;
  } catch (error) {
    console.error('createNewUserSession', error);
    return null;
  }
}
