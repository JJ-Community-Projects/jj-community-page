import {implement, ORPCError} from '@orpc/server';
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {contracts} from "./contract.ts";
import {schedulesTable} from "../../../db/schema/jj-schema.ts";
import {and, eq} from "drizzle-orm";
import {findUserBySlug, getScheduleStreams, organizeStreamsByTime, getNextStreams} from "./util.ts";

const os = implement(contracts)
  .use(dbMiddleware);

const getPrimaryScheduleInfoByUserSlug = os.getPrimaryScheduleInfoByUserSlugContract
  .handler(async ({context, input: userSlug}) => {
    const db = context.db
    const user = await findUserBySlug(db, userSlug)
    const currentYear = new Date().getFullYear()

    // Find the primary schedule for this user in the current year
    const primarySchedule = await db.select().from(schedulesTable)
      .where(and(
        eq(schedulesTable.ownerId, user.userId),
        eq(schedulesTable.year, currentYear),
        eq(schedulesTable.primary, true),
        eq(schedulesTable.visible, true)
      )).get()

    if (!primarySchedule) {
      throw new ORPCError('NOT_FOUND', {message: 'Primary schedule not found'})
    }

    return primarySchedule
  })

const getPrimaryFullScheduleByUserSlug = os.getPrimaryFullScheduleByUserSlugContract
  .handler(async ({context, input: userSlug}) => {
    const db = context.db
    const user = await findUserBySlug(db, userSlug)
    const currentYear = new Date().getFullYear()

    // Find the primary schedule for this user in the current year
    const primarySchedule = await db.select().from(schedulesTable)
      .where(and(
        eq(schedulesTable.ownerId, user.userId),
        eq(schedulesTable.year, currentYear),
        eq(schedulesTable.primary, true),
        eq(schedulesTable.visible, true)
      )).get()

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
  .handler(async ({context, input: userSlug}) => {
    const db = context.db
    const user = await findUserBySlug(db, userSlug)

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
  .handler(async ({context, input: userSlug}) => {
    const db = context.db
    const user = await findUserBySlug(db, userSlug)

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

const getPrimaryScheduleInfoByUserSlugAndYear = os.getPrimaryScheduleInfoByUserSlugAndYearContract
  .handler(async ({context, input: {userSlug, year}}) => {
    const db = context.db
    const user = await findUserBySlug(db, userSlug)

    // Find the primary schedule for this user in the specified year
    const primarySchedule = await db.select().from(schedulesTable)
      .where(and(
        eq(schedulesTable.ownerId, user.userId),
        eq(schedulesTable.year, year),
        eq(schedulesTable.primary, true),
        eq(schedulesTable.visible, true)
      )).get()

    if (!primarySchedule) {
      throw new ORPCError('NOT_FOUND', {message: 'Primary schedule not found for the specified year'})
    }

    return primarySchedule
  })

const getPrimaryFullScheduleByUserSlugAndYear = os.getPrimaryFullScheduleByUserSlugAndYearContract
  .handler(async ({context, input: {userSlug, year}}) => {
    const db = context.db
    const user = await findUserBySlug(db, userSlug)

    // Find the primary schedule for this user in the specified year
    const primarySchedule = await db.select().from(schedulesTable)
      .where(and(
        eq(schedulesTable.ownerId, user.userId),
        eq(schedulesTable.year, year),
        eq(schedulesTable.primary, true),
        eq(schedulesTable.visible, true)
      )).get()

    if (!primarySchedule) {
      throw new ORPCError('NOT_FOUND', {message: 'Primary schedule not found for the specified year'})
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

const getScheduleInfoByUserSlugAndYear = os.getScheduleInfoByUserSlugAndYearContract
  .handler(async ({context, input: {userSlug, year}}) => {
    const db = context.db
    const user = await findUserBySlug(db, userSlug)

    // Get all visible schedules for this user in the specified year
    const schedules = await db.select().from(schedulesTable)
      .where(and(
        eq(schedulesTable.ownerId, user.userId),
        eq(schedulesTable.year, year),
        eq(schedulesTable.visible, true)
      ))
      .all()

    return schedules
  })

const getFullScheduleByUserSlugAndYear = os.getFullScheduleByUserSlugAndYearContract
  .handler(async ({context, input: {userSlug, year}}) => {
    const db = context.db
    const user = await findUserBySlug(db, userSlug)

    // Get all visible schedules for this user in the specified year
    const schedules = await db.select().from(schedulesTable)
      .where(and(
        eq(schedulesTable.ownerId, user.userId),
        eq(schedulesTable.year, year),
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

export const schedulesRouter = {
  getPrimaryScheduleInfoByUserSlug,
  getPrimaryFullScheduleByUserSlug,
  getScheduleInfoByUserSlug,
  getFullScheduleByUserSlug,
  getPrimaryScheduleInfoByUserSlugAndYear,
  getPrimaryFullScheduleByUserSlugAndYear,
  getScheduleInfoByUserSlugAndYear,
  getFullScheduleByUserSlugAndYear,
}
