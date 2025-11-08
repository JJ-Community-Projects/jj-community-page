import { oc } from '@orpc/contract'
import { z } from 'zod/v4'

export const ConfigSchema = z.object({
  showSchedule: z.boolean(),
})

export const CreatorLink = z.object({
  type: z.string(),
  name: z.string(),
  url: z.string(),
})

export const CreatorSchema = z.object({
  type: z.string().default('yogs'),
  id: z.string(),
  name: z.string(),
  url: z.string(),
  imageUrl: z.string().optional(),
  color: z.string(),
  links: z.array(CreatorLink).optional(),
})

export const VOD = z.object({
  label: z.string().optional(),
  type: z.string(),
  link: z.string(),
})

export const StreamSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  markdownDescription: z.string().optional(),
  start: z.date(),
  end: z.date(),
  creators: z.array(CreatorSchema).optional(),
  size: z.number().default(1),
  vods: z.array(VOD).optional(),
  color: z.string(),
})

export const ScheduleDaySchema = z.object({
  /**
   * The date of the first stream in the day.
   */
  start: z.date(),
  /**
   * The date of the last stream in the day.
   */
  end: z.date(),
  streams: z.array(StreamSchema),
})

export const ScheduleWeekSchema = z.object({
  /**
   * The date of the first stream in the day.
   */
  start: z.date(),
  /**
   * The date of the last stream in the day.
   */
  end: z.date(),
  days: z.array(ScheduleDaySchema),
  streams: z.array(StreamSchema),
})

export const YogsScheduleSchema = z.object({
  title: z.string(),
  /**
   * The date of the earliest stream in the schedule.
   */
  start: z.date(),
  /**
   * The date of the latest stream in the schedule.
   */
  end: z.date(),
  /**
   * The index of the day in the schedule that should be shown first.
   * The index is 0-based, so the first day is day 0.
   * This is used to determine the initial day when the user first visits the extension.
   */
  initialDayIndex: z.number(),
  days: z.array(ScheduleDaySchema),
  weeks: z.array(ScheduleWeekSchema),
  streams: z.array(StreamSchema),
  times: z.array(
    z.object({
      start: z.date(),
      end: z.date(),
    }),
  ),

  creators: z.array(CreatorSchema),
})

export type YogsConfig = z.infer<typeof ConfigSchema>

export type YogsCreator = z.infer<typeof CreatorSchema>
export type YogsVOD = z.infer<typeof VOD>
export type YogsStream = z.infer<typeof StreamSchema>
export type YogsScheduleDay = z.infer<typeof ScheduleDaySchema>
export type YogsScheduleWeek = z.infer<typeof ScheduleWeekSchema>
export type YogsSchedule = z.infer<typeof YogsScheduleSchema>

const config = oc.output(ConfigSchema)

const schedule = oc.output(YogsScheduleSchema)

export const contracts = {
  config,
  schedule,
}
