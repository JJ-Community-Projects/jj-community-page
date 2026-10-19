import { authMiddleware } from '../../middleware/authMiddleware.ts'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { ORPCError } from '@orpc/server'
import { scheduleAccess, scheduleAccessQuery } from './access.ts'

/**
 * Middleware that ensures the authenticated user can edit a schedule.
 * Grants access to the schedule owner, an admin, or a user listed as an editor in the editors
 * table. Adds the schedule row to context.
 *
 * One statement loads the schedule, the caller's role and the editor row (`access.ts`). Role and
 * editor membership are always read from D1, never from the session copy of the user, so a
 * demoted admin or a removed editor is refused on their next call.
 */
export const scheduleOwnerOrEditorMiddleware = authMiddleware
  .concat(dbMiddleware)
  .concat(async ({ context, next }, input: { scheduleId: number }) => {
    const { db, userId } = context
    const row = await scheduleAccessQuery(db, input.scheduleId, userId).get()
    const access = scheduleAccess(row, userId)

    if (access.status === 'not_found') {
      throw new ORPCError('NOT_FOUND', { message: 'Schedule not found' })
    }
    if (access.status === 'forbidden') {
      throw new ORPCError('FORBIDDEN', {
        message: 'You do not have permission to edit this schedule',
      })
    }

    return next({ context: { ...context, schedule: access.schedule } })
  })
