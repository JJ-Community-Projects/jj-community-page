import {z} from 'zod';

/**
 * Public teams contracts for retrieving team information without authentication.
 * These endpoints handle read-only operations for visible teams and their members.
 */
export const TeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  visible: z.boolean(),
  ownerId: z.number()
});
