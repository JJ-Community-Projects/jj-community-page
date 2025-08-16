import {ORPCError} from "@orpc/server";
import {hasAstroContext} from "./hasAstroContext.ts";

/**
 * Base origin checking middleware factory
 * Creates middleware that validates request origin based on provided validator function
 * Bypasses validation in development mode
 */
function createOriginMiddleware(
  name: string,
  validator: (origin: string) => boolean,
  errorMessage: string
) {
  return hasAstroContext.concat((({ context, next }) => {
        // Skip origin validation in development mode
        if (import.meta.env.DEV) {
          return next({ context });
        }

        if (!context.ctx) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: 'Missing Astro context'
          });
        }

        const origin = context.ctx.request.headers.get('origin');

        if (!origin) {
          throw new ORPCError('FORBIDDEN', {
            message: `${name}: Missing origin header`
          });
        }

        if (!validator(origin)) {
          throw new ORPCError('FORBIDDEN', {
            message: `${name}: ${errorMessage}. Origin: ${origin}`
          });
        }

        return next({ context });
      })
  );
}

/**
 * Middleware to check if request is from https://beta.jinglejam.ostof.dev
 * Only works in production mode, bypassed in development
 */
export const betaJingleJamOriginMiddleware = createOriginMiddleware(
  'Beta JingleJam Origin Check',
  (origin: string) => origin === 'https://beta.jinglejam.ostof.dev',
  'Request must be from https://beta.jinglejam.ostof.dev'
);

/**
 * Middleware to check if request is from https://jinglejam.ostof.dev
 * Only works in production mode, bypassed in development
 */
export const productionJingleJamOriginMiddleware = createOriginMiddleware(
  'Production JingleJam Origin Check',
  (origin: string) => origin === 'https://jinglejam.ostof.dev',
  'Request must be from https://jinglejam.ostof.dev'
);

/**
 * Middleware to check if request is from an origin containing https and twitch.tv
 * Only works in production mode, bypassed in development
 */
export const twitchOriginMiddleware = createOriginMiddleware(
  'Twitch Origin Check',
  (origin: string) => origin.includes('https') && origin.includes('twitch.tv'),
  'Request must be from an HTTPS Twitch.tv origin'
);
