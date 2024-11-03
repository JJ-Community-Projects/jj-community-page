import type {
  ContentStreamBackground,
  ContentVod,
  FullCreator,
  FullDay,
  FullSchedule,
  FullStream,
  FullWeek
} from "./ContentTypes.ts";
import {DateTime} from "luxon";


export function yogsScheduleFirestoreToFullSchedule(schedule: YogsScheduleFirestore, creators: FullCreator[]): FullSchedule {

  const creatorsMap: { [key: string]: FullCreator } = {}

  for (const creator of creators) {
    creatorsMap[creator.id] = creator
  }

  const weeks: FullWeek[] = schedule.weeks.map((week) => weekToFullWeek(week, creatorsMap))

  const streams = weeks.flatMap(week => week.days.flatMap(day => day.streams))

  return {
    title: schedule.title,
    timezone: schedule.timezone,
    times: schedule.times.map(time => ({
      start: DateTime.fromISO(time.start).toJSDate(),
      end: DateTime.fromISO(time.end).toJSDate()
    })),
    weeks: weeks,
    streams: streams,
    visible: true,
    // creators: creators
  }
}

function weekToFullWeek(week: Week, creatorsMap: { [key: string]: FullCreator }): FullWeek {
  const days = week.days.map((day) => dayToFullDay(day, creatorsMap))
  const streams = days.flatMap(day => day.streams)
  return {
    week: week.week,
    days: days,
    streams: streams,
  }
}

function dayToFullDay(day: Day, creatorsMap: { [key: string]: FullCreator }): FullDay {
  return {
    ...day,
    date: DateTime.fromISO(day.date).toJSDate(),
    streams: day.streams.map(stream => streamToFullStream(stream, creatorsMap))
  }
}

function streamToFullStream(stream: Stream, creatorsMap: { [key: string]: FullCreator }): FullStream {
  return {
    ...stream,
    id: DateTime.fromISO(stream.start).toFormat('yyyyMMddHHmm'),
    start: DateTime.fromISO(stream.start).toJSDate(),
    end: DateTime.fromISO(stream.end).toJSDate(),
    creators: stream.creators.map(id => creatorsMap[id])
  }
}

export type YogsScheduleFirestore = {
  weeks: Week[]
  timezone: string
  times: Time[]
  title: string
}

type Week = {
  week: number
  days: Day[]
}

type Day = {
  streams: Stream[]
  date: string
}

type Stream = {
  creators: string[]
  vods: ContentVod[]
  duration_hours: number
  style: Style
  subtitle: string
  start: string
  title: string
  end: string
}


type Style = {
  background: ContentStreamBackground
  tileSize: number
}


type Time = {
  end: string
  start: string
}
