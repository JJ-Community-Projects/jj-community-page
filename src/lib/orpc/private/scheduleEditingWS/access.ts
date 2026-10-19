import { and, eq, exists } from 'drizzle-orm'
import type { JJDrizzleDatabase } from '../../../db/db.ts'
import { users } from '../../../db/schema/auth-schema.ts'
import { editorsTable, schedulesTable } from '../../../db/schema/jj-schema.ts'

/**
 * Who may edit a schedule, and read its draft: its owner, an admin, or a user with a row in
 * `editors` for it. The middleware checks it on every editing call, the editing object on every
 * subscribe and reconnect of the draft socket. Role and editor membership always come from D1,
 * never from the session copy of the user, so a demoted admin or a removed editor is refused at
 * once.
 */

/**
 * One statement: the schedule row, the user's role and whether the user is an editor of it.
 * No row when the schedule doesn't exist. Usable on its own (`.get()`) or in a `db.batch()`.
 */
export function scheduleAccessQuery(
  db: JJDrizzleDatabase,
  scheduleId: number,
  userId: number,
) {
  return db
    .select({
      schedule: schedulesTable,
      role: users.role,
      isEditor: exists(
        db
          .select({ userId: editorsTable.userId })
          .from(editorsTable)
          .where(
            and(
              eq(editorsTable.scheduleId, schedulesTable.id),
              eq(editorsTable.userId, userId),
            ),
          ),
      ).mapWith(Boolean),
    })
    .from(schedulesTable)
    .leftJoin(users, eq(users.id, userId))
    .where(eq(schedulesTable.id, scheduleId))
}

export type ScheduleAccessRow = Awaited<
  ReturnType<ReturnType<typeof scheduleAccessQuery>['get']>
>

export type ScheduleAccess =
  | {
      status: 'ok'
      schedule: NonNullable<ScheduleAccessRow>['schedule']
    }
  | { status: 'not_found' }
  | { status: 'forbidden' }

/** The decision for a row of `scheduleAccessQuery` (undefined: the schedule doesn't exist). */
export function scheduleAccess(
  row: ScheduleAccessRow | undefined,
  userId: number,
): ScheduleAccess {
  if (!row) return { status: 'not_found' }
  const { schedule, role, isEditor } = row
  if (role !== 'admin' && schedule.ownerId !== userId && !isEditor)
    return { status: 'forbidden' }
  return { status: 'ok', schedule }
}
