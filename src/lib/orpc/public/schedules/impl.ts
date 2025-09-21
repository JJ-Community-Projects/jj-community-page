import {implement, ORPCError} from '@orpc/server';
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {contracts} from "./contract.ts";
import {schedulesTable} from "../../../db/schema/jj-schema.ts";
import {and, eq} from "drizzle-orm";
import {getNextStreams as getNextStreamsFromList, getScheduleStreams, organizeStreamsByTime, getNextStreamsAcrossPublicPrimarySchedules} from "./util.ts";
import {userDisplayView} from "../../../db/schema/views-schema.ts";

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



    const owner = await db.select({
      userId: userDisplayView.userId,
      primaryLiveStream: userDisplayView.primaryLiveStream,
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
      .where(eq(userDisplayView.userId, schedule.ownerId))
      .get()

    if (!owner) {
      throw new ORPCError('NOT_FOUND', {message: 'Schedule owner not found'})
    }

    // Get all streams for this schedule
    const streams = await getScheduleStreams(db, schedule.id)

    // Get the next 3 future streams
    const nextStreams = getNextStreamsFromList(streams)

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
      owner: owner,
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

const getNextStreamsAcrossSchedules = os.getNextStreamsContract
  .handler(async ({context, input}) => {
    const db = context.db
    const nowSec = Math.floor(Date.now() / 1000)
    const year = input.year ?? new Date().getUTCFullYear()
    const limit = input.limit ?? 10
    const uniqueBySchedule = input.uniqueBySchedule ?? false
    try {
      return await getNextStreamsAcrossPublicPrimarySchedules(db, {year, limit, uniqueBySchedule, nowSec})
    } catch (_err) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to load next streams'})
    }
  })

export const publicSchedulesRouter = {
  getFullScheduleBySlug,
  getVisiblePrimarySchedulesByYear,
  getNextStreams: getNextStreamsAcrossSchedules,
}
