import {authMiddleware} from '../../middleware/authMiddleware.ts';
import {dbMiddleware} from '../../middleware/dbMiddleware.ts';
import {ORPCError} from '@orpc/server';
import {editorsTable, schedulesTable} from '../../../db/schema/jj-schema.ts';
import {and, eq} from 'drizzle-orm';

/**
 * Middleware that ensures the authenticated user can edit a schedule.
 * Grants access if the user is either the schedule owner or explicitly listed
 * as an editor in the editors table. Adds the schedule row to context.
 */
export const scheduleOwnerOrEditorMiddleware = authMiddleware
  .concat(dbMiddleware)
  .concat(async ({ context, next }, input: { scheduleId: number }) => {
    const db = context.db;
    const userId = context.userId;
    const { scheduleId } = input;

    // Load schedule
    const schedule = await db.select()
      .from(schedulesTable)
      .where(eq(schedulesTable.id, scheduleId))
      .get();

    if (!schedule) {
      throw new ORPCError('NOT_FOUND', { message: 'Schedule not found' });
    }

    // Owner has access
    if (schedule.ownerId === userId) {
      return next({ context: { ...context, schedule } });
    }

    // Otherwise check editors table
    const editor = await db.select()
      .from(editorsTable)
      .where(and(eq(editorsTable.scheduleId, scheduleId), eq(editorsTable.userId, userId)))
      .get();

    if (!editor) {
      throw new ORPCError('FORBIDDEN', { message: 'You do not have permission to edit this schedule' });
    }

    return next({ context: { ...context, schedule } });
  });
