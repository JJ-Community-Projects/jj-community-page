import { implement, ORPCError } from '@orpc/server'
import { contracts } from './contract.ts'
import { dbMiddleware } from '../../../middleware/dbMiddleware.ts'
import { and, eq } from 'drizzle-orm'
import { schedulesTable } from '../../../../db/schema/jj-schema.ts'
import { getScheduleStreams } from '../../schedules/util.ts'

const os = implement(contracts).use(dbMiddleware)

const view = os.viewContract.handler(async ({ context, input }) => {
  const db = context.db
  const byId = input.scheduleId != null
  const bySlug = input.scheduleSlug != null
  if (byId === bySlug) {
    throw new ORPCError('BAD_REQUEST', { message: 'Provide exactly one of scheduleId or scheduleSlug' })
  }

  // Load schedule by id or slug, must be visible/public
  const schedule = await db
    .select({ id: schedulesTable.id, name: schedulesTable.title, slug: schedulesTable.slug, visible: schedulesTable.visible })
    .from(schedulesTable)
    .where(
      byId
        ? and(eq(schedulesTable.id, input.scheduleId!), eq(schedulesTable.visible, true))
        : and(eq(schedulesTable.slug, input.scheduleSlug!), eq(schedulesTable.visible, true))
    )
    .get()

  if (!schedule) {
    throw new ORPCError('NOT_FOUND', { message: 'Schedule not found' })
  }

  // Streams -> overlay blocks
  const streams = await getScheduleStreams(db, schedule.id)
  // Sort by start time asc (utility likely returns unsorted)
  streams.sort((a, b) => a.start.getTime() - b.start.getTime())

  const blocks = streams.map((s) => ({
    id: s.id,
    start: s.start.toISOString(),
    end: s.end.toISOString(),
    title: s.title,
    participants: s.participants?.map((p) => p.username) ?? [],
    color: undefined,
  }))

  return {
    schedule: { id: schedule.id, name: schedule.name, slug: schedule.slug },
    blocks,
  }
})

export const overlaysScheduleRouter = {
  view,
}
