import {implement, ORPCError} from '@orpc/server';
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {contracts} from "./contract.ts";
import {schedulesTable} from "../../../db/schema/jj-schema.ts";
import {and, eq} from "drizzle-orm";
import {getNextStreams, getScheduleStreams, organizeStreamsByTime} from "./util.ts";

const os = implement(contracts)
  .use(dbMiddleware);

const getFullScheduleBySlug = os.getFullScheduleBySlugContract
  .handler(async ({context, input}) => {
    const db = context.db

    // Find the schedule by slug
    const schedule = await db.select().from(schedulesTable)
      .where(eq(schedulesTable.slug, input.slug))
      .get()

    if (!schedule) {
      throw new ORPCError('NOT_FOUND', {message: 'Schedule not found'})
    }

    if (!schedule.visible) {
      throw new ORPCError('FORBIDDEN', {message: 'The schedule is private'})
    }

    // Get all streams for this schedule
    const streams = await getScheduleStreams(db, schedule.id)

    // Get the next 3 future streams
    const nextStreams = getNextStreams(streams)

    // Organize streams by time
    const {days, weeks} = organizeStreamsByTime(streams)

    // Get all unique participants
    const participants = Array.from(
      new Map(
        streams.flatMap(stream => stream.participants)
          .map(participant => [participant.userId, participant])
      ).values()
    )

    return {
      data: schedule,
      streams,
      nextStreams,
      days,
      weeks,
      participants,
    }
  })

const getVisiblePrimarySchedulesByYear = os.getVisiblePrimarySchedulesByYearContract
  .handler(async ({context, input}) => {
    const db = context.db

    // Find all visible primary schedules for the given year
    const schedules = await db.select().from(schedulesTable)
      .where(and(
        eq(schedulesTable.year, input.year),
        eq(schedulesTable.visible, true),
        eq(schedulesTable.primary, true)
      ))
      .all()

    return schedules
  })

export const publicSchedulesRouter = {
  getFullScheduleBySlug,
  getVisiblePrimarySchedulesByYear,
}
