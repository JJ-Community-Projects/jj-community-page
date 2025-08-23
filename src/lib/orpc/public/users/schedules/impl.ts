import {
  findUserBySlug,
  getNextStreams,
  getPrimaryScheduleByUserSlugAndYear,
  getScheduleStreams,
  organizeStreamsByTime
} from "../../schedules/util.ts";
import {schedulesTable} from "../../../../db/schema/jj-schema.ts";
import {and, eq} from "drizzle-orm";
import {implement, ORPCError} from "@orpc/server";
import {dbMiddleware} from "../../../middleware/dbMiddleware.ts";
import {usersSchedulesContracts} from "./contract.ts";

const os = implement(usersSchedulesContracts)
  .use(dbMiddleware);

const getPrimaryScheduleInfoByUserSlug = os.getPrimaryScheduleInfoByUserSlugContract
  .handler(async ({context, input}) => {
    const db = context.db
    const user = await findUserBySlug(db, input.slug)
    const currentYear = new Date().getFullYear()

    // Find the primary schedule for this user in the current year
    const primarySchedule = await getPrimaryScheduleByUserSlugAndYear(db, user.userId, currentYear)

    if (!primarySchedule) {
      throw new ORPCError('NOT_FOUND', {message: 'Primary schedule not found'})
    }

    return primarySchedule
  })

const getPrimaryFullScheduleByUserSlug = os.getPrimaryFullScheduleByUserSlugContract
  .handler(async ({context, input}) => {
    const db = context.db
    const user = await findUserBySlug(db, input.slug)
    const currentYear = new Date().getFullYear()

    // Find the primary schedule for this user in the current year
    const primarySchedule = await getPrimaryScheduleByUserSlugAndYear(db, user.userId, currentYear)

    if (!primarySchedule) {
      throw new ORPCError('NOT_FOUND', {message: 'Primary schedule not found'})
    }

    // Get all streams for this schedule
    const streams = await getScheduleStreams(db, primarySchedule.id)

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
      data: primarySchedule,
      streams,
      nextStreams,
      days,
      weeks,
      participants,
    }
  })

const getScheduleInfoByUserSlug = os.getScheduleInfoByUserSlugContract
  .handler(async ({context, input}) => {
    const db = context.db
    const user = await findUserBySlug(db, input.slug)

    // Get all visible schedules for this user
    const schedules = await db.select().from(schedulesTable)
      .where(and(
        eq(schedulesTable.ownerId, user.userId),
        eq(schedulesTable.visible, true)
      ))
      .all()

    return schedules
  })

const getFullScheduleByUserSlug = os.getFullScheduleByUserSlugContract
  .handler(async ({context, input}) => {
    const db = context.db
    const user = await findUserBySlug(db, input.slug)

    // Get all visible schedules for this user
    const schedules = await db.select().from(schedulesTable)
      .where(and(
        eq(schedulesTable.ownerId, user.userId),
        eq(schedulesTable.visible, true)
      ))
      .all()

    // Build full schedule data for each schedule
    const fullSchedules = await Promise.all(
      schedules.map(async (schedule) => {
        const streams = await getScheduleStreams(db, schedule.id)
        const nextStreams = getNextStreams(streams)
        const {days, weeks} = organizeStreamsByTime(streams)

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
    )

    return fullSchedules
  })


export const userSchedulesRouter = {
  getPrimaryScheduleInfoByUserSlug,
  getPrimaryFullScheduleByUserSlug,
  getScheduleInfoByUserSlug,
  getFullScheduleByUserSlug,
}
