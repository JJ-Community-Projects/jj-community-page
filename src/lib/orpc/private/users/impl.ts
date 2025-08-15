import { privateUsersContract } from './contract.ts';
import { implement, ORPCError } from '@orpc/server';
import { dbMiddleware } from '../../middleware/dbMiddleware.ts';
import { authMiddleware } from '../../middleware/authMiddleware.ts';
import { userDisplayView } from '../../../db/schema/views-schema.ts';
import { eq } from 'drizzle-orm';

const os = implement(privateUsersContract)
  .use(dbMiddleware);

/**
 * Get current authenticated user information
 * Returns the current user as UserDisplaySchema with role information
 */
const getCurrentUser = os.getCurrentUser
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db;
    const userId = context.userId;

    try {
      // Query the current user from userDisplayView
      const user = await db.select({
        userId: userDisplayView.userId,
        primaryLiveStream: userDisplayView.primaryLiveStream,
        role: userDisplayView.role,
        createdAt: userDisplayView.createdAt,
        username: userDisplayView.username,
        profileImage: userDisplayView.profileImage,
        twitchLogin: userDisplayView.twitchLogin,
        tiltifySlug: userDisplayView.tiltifySlug,
        tiltifyUrl: userDisplayView.tiltifyUrl,
        primaryColor: userDisplayView.primaryColor,
        accentColor: userDisplayView.accentColor,
      })
      .from(userDisplayView)
      .where(eq(userDisplayView.userId, userId))
      .get();

      if (!user) {
        throw new ORPCError('NOT_FOUND', { message: 'User not found' });
      }

      return user;
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error getting current user:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get current user' });
    }
  });

export const privateUsersRouter = {
  getCurrentUser
};
