import {type CollectionEntry, getEntries, getEntry} from 'astro:content';
import {loadCreatorsFromContent} from "./loadCreatorsFromContent.ts";
import type {
  ContentSchedule,
  ContentScheduleWeek,
  ContentStream,
  FullDay,
  FullSchedule,
  FullStream,
  FullWeek
} from "../lib/model/ContentTypes.ts";
import {DateTime} from "luxon";
import {rangeFromData} from '#lib/utils/rangeFromData.ts';

export async function loadScheduleFromContent(year: string) {
  const scheduleEntry = await getEntry('schedules', year);
  if (!scheduleEntry) {
    return undefined
  }
  return contentScheduleToJs(scheduleEntry.data)
}

export async function contentScheduleToJs(schedule: ContentSchedule): Promise<FullSchedule> {
  const weeks = await Promise.all(schedule.weeks.map(loadFullWeek))
  const streams = weeks.flatMap(week => week.streams)

  return {
    ...schedule,
    times: schedule.times.map(({start, end}) => ({
      start: (start),
      end: (end)
    })),
    weeks: weeks,
    streams: streams,
    ...rangeFromData(streams),
    updatedAt: DateTime.now()
  }
}


async function loadFullStream(stream: ContentStream): Promise<FullStream> {
  const creatorRefs: CollectionEntry<'creators'>[] = await getEntries(stream.creators ?? [])
  const creators = await loadCreatorsFromContent(creatorRefs)
  return {
    id: DateTime.fromJSDate(stream.start).toFormat('yyyyMMddHHmm'),
    title: stream.title,
    subtitle: stream.subtitle,
    start: (stream.start),
    end: (stream.end),
    creators: creators,
    vods: stream.vods,
    style: stream.style
  }
}

async function loadFullDay(dayEntry: CollectionEntry<'scheduleDays'>): Promise<FullDay> {
  const dayData = dayEntry.data
  const streams = await Promise.all(dayData.streams.map(loadFullStream))
  return {
    date: dayData.date,
    streams: streams,
    ...rangeFromData(streams)
  }
}

async function loadFullWeek(week: ContentScheduleWeek): Promise<FullWeek & {
  streams: FullStream[]
}> {
  const days = await Promise.all(week.days.map(async (day) => {
    const dayEntry = await getEntry(day)
    return loadFullDay(dayEntry)
  }))
  const streams = days.flatMap(day => day.streams)
  return {
    week: week.week,
    days: days,
    streams: streams,
    ...rangeFromData(streams)
  }
}
