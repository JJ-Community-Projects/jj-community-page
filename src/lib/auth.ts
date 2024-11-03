import {D1Adapter} from "@lucia-auth/adapter-sqlite";
import {Lucia} from "lucia";
import {Google, Tiltify, Twitch} from "arctic";
import type {APIContext} from 'astro';

export const twitch = new Twitch(
  import.meta.env.TWITCH_CLIENT_ID,
  import.meta.env.TWITCH_CLIENT_SECRET,
  import.meta.env.TWITCH_REDIRECT_URI
);
export const tiltify = new Tiltify(
  import.meta.env.TILTIFY_CLIENT_ID,
  import.meta.env.TILTIFY_SECRET,
  import.meta.env.TILTIFY_REDIRECT_URI
);
export const google = new Google(
  import.meta.env.GOOGLE_CLIENT_ID,
  import.meta.env.GOOGLE_CLIENT_SECRET,
  import.meta.env.GOOGLE_REDIRECT_URL
);

export function initializeLuciaFromContext(context: APIContext) {
  return initializeLucia(context.locals.runtime.env.DB);
}

export function initializeLucia(D1: D1Database) {
  const adapter = new D1Adapter(D1, {
    user: "users",
    session: "sessions"
  });
  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        // secure: false,
        secure: import.meta.env.PROD,
      },
    },
    getUserAttributes: (attributes) => {
      return {
        // TODO
      };
    },
  });
}

declare module "lucia" {
  interface Register {
    Lucia: ReturnType<typeof initializeLucia>;
    // DatabaseUserAttributes: any;
  }
}
