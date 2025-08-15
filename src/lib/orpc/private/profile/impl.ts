import {profileContract} from './contract.ts';
import {implement, ORPCError} from '@orpc/server'
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import {eq} from "drizzle-orm";
import {users, userStyles} from "../../../db/schema/auth-schema.ts";

const os = implement(profileContract)
  .use(dbMiddleware)

/**
 * Update user's primary color preference
 * Uses upsert pattern to insert or update the userStyles record
 */
const updatePrimaryColor = os.style.updatePrimaryColorContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;

    try {
      await db.insert(userStyles)
        .values({
          userId: userId,
          primaryColor: input.primaryColor
        })
        .onConflictDoUpdate({
          target: userStyles.userId,
          set: {
            primaryColor: input.primaryColor
          }
        });

      return {success: true};
    } catch (error) {
      console.error('Error updating primary color:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to update primary color'
      });
    }
  })


const updateStyle = os.style.updateStyleContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;

    try {
      const [result] = await db.insert(userStyles)
        .values({
          userId: userId,
          primaryColor: input.primaryColor,
          accentColor: input.accentColor,
        })
        .onConflictDoUpdate({
          target: userStyles.userId,
          set: {
            primaryColor: input.primaryColor,
            accentColor: input.accentColor,
          }
        }).returning();
      return {
        primaryColor: result.primaryColor,
        accentColor: result.accentColor
      }
    } catch (error) {
      console.error('Error updating primary color:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to update primary color'
      });
    }
  })

/**
 * Update user's accent color preference
 * Uses upsert pattern to insert or update the userStyles record
 */
const updateAccentColor = os.style.updateAccentColorContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;

    try {
      await db.insert(userStyles)
        .values({
          userId: userId,
          accentColor: input.accentColor
        })
        .onConflictDoUpdate({
          target: userStyles.userId,
          set: {
            accentColor: input.accentColor
          }
        });

      return {success: true};
    } catch (error) {
      console.error('Error updating accent color:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to update accent color'
      });
    }
  })

/**
 * Update user's primary live streaming platform
 * Updates the primaryLiveStream field in the users table
 */
const updatePrimaryLiveStream = os.streaming.updatePrimaryLiveStreamContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const userId = context.userId;

    try {
      await db.update(users)
        .set({
          primaryLiveStream: input.platform
        })
        .where(eq(users.id, userId));

      return {success: true};
    } catch (error) {
      console.error('Error updating primary live stream platform:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to update primary live stream platform'
      });
    }
  })

/**
 * Get user's style preferences (primary and accent colors)
 * Uses authMiddleware to access user ID from context
 */
const getStyle = os.style.getStyleContract
  .use(authMiddleware)
  .handler(async ({context}) => {
    const db = context.db;
    const userId = context.userId;

    try {
      const userStyle = await db.select()
        .from(userStyles)
        .where(eq(userStyles.userId, userId))
        .get();

      return {
        primaryColor: userStyle?.primaryColor || null,
        accentColor: userStyle?.accentColor || null
      };
    } catch (error) {
      console.error('Error getting user style preferences:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get style preferences'
      });
    }
  })

/**
 * Get user's primary live streaming platform
 * Uses authMiddleware to access user ID from context
 */
const getPrimaryLiveStream = os.streaming.getPrimaryLiveStreamContract
  .use(authMiddleware)
  .handler(async ({context}) => {
    const db = context.db;
    const userId = context.userId;

    try {
      const user = await db.select({
        primaryLiveStream: users.primaryLiveStream
      })
        .from(users)
        .where(eq(users.id, userId))
        .get();

      return user?.primaryLiveStream || null;
    } catch (error) {
      console.error('Error getting user primary live stream platform:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get primary live stream platform'
      });
    }
  })


export const profileRouter = {
  updatePrimaryColor,
  updateAccentColor,
  updateStyle,
  getStyle,
  updatePrimaryLiveStream,
  getPrimaryLiveStream,
}
