import { defineAction, ActionError } from "astro:actions";
import { TiltifyMetadataRepo } from "../lib/db/repos/TiltifyMetadataRepo";
import { z } from "zod";

/**
 * Actions for accessing Tiltify metadata
 */
export const tiltifyMetadata = {
  /**
   * Get Tiltify metadata for the current user
   */
  getCurrentUserMetadata: defineAction({
    handler: async (_, ctx) => {
      const { user, session } = ctx.locals;
      if (!user || !session) {
        throw new ActionError({ code: 'UNAUTHORIZED' });
      }

      const repo = TiltifyMetadataRepo.action(ctx);
      const metadata = await repo.getByUserId(user.id);

      if (!metadata) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'No Tiltify metadata found for this user'
        });
      }

      return metadata;
    }
  }),

  /**
   * Get Tiltify metadata for a specific user by ID
   */
  getUserMetadataById: defineAction({
    input: z.object({
      userId: z.number()
    }),
    handler: async ({ userId }, ctx) => {
      const { user, session } = ctx.locals;
      if (!user || !session) {
        throw new ActionError({ code: 'UNAUTHORIZED' });
      }

      const repo = TiltifyMetadataRepo.action(ctx);
      const metadata = await repo.getByUserId(userId);

      if (!metadata) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'No Tiltify metadata found for this user'
        });
      }

      return metadata;
    }
  }),

  /**
   * Get Tiltify metadata for a user by username
   */
  getUserMetadataByUsername: defineAction({
    input: z.object({
      username: z.string()
    }),
    handler: async ({ username }, ctx) => {
      const repo = TiltifyMetadataRepo.action(ctx);
      const metadata = await repo.getByUsername(username);

      if (!metadata) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: `No Tiltify metadata found for username: ${username}`
        });
      }

      return metadata;
    }
  })
};
