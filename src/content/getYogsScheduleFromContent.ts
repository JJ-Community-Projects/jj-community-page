import { getEntry, type ReferenceDataEntry } from 'astro:content'
import type {
  YogsCreator,
  YogsSchedule,
  YogsScheduleDay,
  YogsScheduleWeek,
  YogsStream,
} from '../lib/orpc/private/yogs/contract.ts'
import { getStreamColors } from '../functions/jjDatesToColors.ts'
import { DateTime } from 'luxon'
import { rangeFromData } from '../lib/utils/rangeFromData.ts'

export async function getYogsScheduleFromContent(
  year: number,
): Promise<YogsSchedule> {
  return getScheduleFromContent(
    `${year}`,
    `Yogscast Jingle Jam ${year ?? 2024}`,
  )
}

export async function getScheduleFromContent(
  id: string,
  title: string = 'Schedule',
): Promise<YogsSchedule> {
  const schedule = await getEntry('schedules', id)
  if (!schedule) {
    const now = new Date()
    return {
      title: title,
      start: now,
      end: now,
      initialDayIndex: 0,
      days: [],
      streams: [],
      weeks: [],
      times: [],
      creators: [],
    }
  }
  const creatorsMap: Map<string, YogsCreator> = new Map()
  const outStreams: Array<YogsStream> = []

  const days: Array<YogsScheduleDay> = []

  const weeks: Array<YogsScheduleWeek> = []

  // Traverse weeks -> days -> streams, resolving referenced entries via getEntry
  for (const week of schedule.data.weeks ?? []) {
    const weekDays: Array<{
      start: Date
      end: Date
      streams: typeof outStreams
    }> = []
    const weekOutStreams: typeof outStreams = []
    for (const dayRef of week.days ?? []) {
      const dayEntry = await getEntry(dayRef)
      if (!dayEntry) continue
      const dayStreams = dayEntry.data.streams ?? []
      const dayOutStreams: typeof outStreams = []
      for (const s of dayStreams) {
        // Resolve creators referenced by the stream (if any)
        let creators: Array<YogsCreator> | undefined
        if (Array.isArray(s.creators) && s.creators.length > 0) {
          const list: Array<YogsCreator> = []
          for (const cRef of s.creators) {
            const creator = await getCreatorFromRef(cRef)
            if (!creator) continue
            list.push(creator)
            if (!creatorsMap.has(creator.id)) {
              creatorsMap.set(creator.id, creator)
            }
          }
          creators = list
        }

        // Map VODs if present
        const vods = Array.isArray(s.vods)
          ? s.vods.map((v) => ({
              label: v?.label,
              link: v?.link,
              type: v?.type,
            }))
          : undefined

        // Choose a representative color for the stream from its background style (fallback to black)
        const colorMap = getStreamColors(DateTime.fromJSDate(s.start))

        const owner = await getCreatorFromRef(s.owner)

        const mapped: YogsStream = {
          title: s.title,
          subtitle: s.subtitle,
          description: s.description,
          markdownDescription: s.markdownDescription,
          start: s.start,
          end: s.end,
          creators,
          vods,
          color: colorMap[500],
          size: s.style.tileSize,
          owner,
        }

        dayOutStreams.push(mapped)
        outStreams.push(mapped)
        weekOutStreams.push(mapped)
      }
      const range = rangeFromData(dayOutStreams) || {
        start: dayOutStreams[0]?.start ?? new Date(),
        end: dayOutStreams[dayOutStreams.length - 1]?.end ?? new Date(),
      }
      days.push({
        start: range.start,
        end: range.end,
        streams: dayOutStreams,
      })
      weekDays.push({
        start: range.start,
        end: range.end,
        streams: dayOutStreams,
      })
    }

    const range = rangeFromData(weekOutStreams) || {
      start: weekOutStreams[0]?.start ?? new Date(),
      end: weekOutStreams[weekOutStreams.length - 1]?.end ?? new Date(),
    }
    weeks.push({
      start: range.start,
      end: range.end,
      days: weekDays,
      streams: weekOutStreams,
    })
  }

  const range = rangeFromData(outStreams) || {
    start: new Date(),
    end: new Date(),
  }

  // Determine initialDayIndex: first day that hasn't fully ended yet; fallback to last day or 0
  const now = new Date()
  let initialDayIndex = days.findIndex((d) => now <= d.end)
  if (initialDayIndex === -1) {
    initialDayIndex = Math.max(0, days.length - 1)
  }

  const times = schedule.data.times

  return {
    title: title,
    updatedAt: schedule.data.updatedAt,
    start: range.start,
    end: range.end,
    initialDayIndex,
    weeks,
    days,
    streams: outStreams,
    times,
    creators: Array.from(creatorsMap.values()),
  }
}

export async function getScheduleFromContentForCreator(
  id: string,
  creatorId: string,
  title: string = 'Schedule',
): Promise<YogsSchedule> {
  const schedule = await getEntry('schedules', id)
  if (!schedule) {
    const now = new Date()
    return {
      title: title,
      start: now,
      end: now,
      initialDayIndex: 0,
      days: [],
      streams: [],
      weeks: [],
      times: [],
      creators: [],
    }
  }
  const creatorsMap: Map<string, YogsCreator> = new Map()
  const outStreams: Array<YogsStream> = []

  const days: Array<YogsScheduleDay> = []

  const weeks: Array<YogsScheduleWeek> = []

  // Traverse weeks -> days -> streams, resolving referenced entries via getEntry
  for (const week of schedule.data.weeks ?? []) {
    const weekDays: Array<{
      start: Date
      end: Date
      streams: typeof outStreams
    }> = []
    const weekOutStreams: typeof outStreams = []
    for (const dayRef of week.days ?? []) {
      const dayEntry = await getEntry(dayRef)
      if (!dayEntry) continue
      const dayStreams = dayEntry.data.streams ?? []
      const dayOutStreams: typeof outStreams = []
      for (const s of dayStreams) {
        let addStream = true
        // Resolve creators referenced by the stream (if any)
        let creators: Array<YogsCreator> | undefined
        if (Array.isArray(s.creators) && s.creators.length > 0) {
          const list: Array<YogsCreator> = []
          const creatorIds = s.creators.map((c) => c.id)
          if (!creatorIds.includes(creatorId)) {
            addStream = false
            continue
          }
          for (const cRef of s.creators) {
            const creator = await getCreatorFromRef(cRef)
            if (!creator) continue
            list.push(creator)
            if (!creatorsMap.has(creator.id)) {
              creatorsMap.set(creator.id, creator)
            }
          }
          creators = list
        }

        // Map VODs if present
        const vods = Array.isArray(s.vods)
          ? s.vods.map((v) => ({
              label: v?.label,
              link: v?.link,
              type: v?.type,
            }))
          : undefined

        // Choose a representative color for the stream from its background style (fallback to black)
        const colorMap = getStreamColors(DateTime.fromJSDate(s.start))

        const owner = await getCreatorFromRef(s.owner)
        const mapped: YogsStream = {
          title: s.title,
          subtitle: s.subtitle,
          description: s.description,
          markdownDescription: s.markdownDescription,
          start: s.start,
          end: s.end,
          creators,
          vods,
          color: colorMap[500],
          size: s.style.tileSize,
          owner,
        }
        if (!addStream) continue
        dayOutStreams.push(mapped)
        outStreams.push(mapped)
        weekOutStreams.push(mapped)
      }
      const range = rangeFromData(dayOutStreams) || {
        start: dayOutStreams[0]?.start ?? new Date(),
        end: dayOutStreams[dayOutStreams.length - 1]?.end ?? new Date(),
      }
      days.push({
        start: range.start,
        end: range.end,
        streams: dayOutStreams,
      })
      weekDays.push({
        start: range.start,
        end: range.end,
        streams: dayOutStreams,
      })
    }

    const range = rangeFromData(weekOutStreams) || {
      start: weekOutStreams[0]?.start ?? new Date(),
      end: weekOutStreams[weekOutStreams.length - 1]?.end ?? new Date(),
    }
    weeks.push({
      start: range.start,
      end: range.end,
      days: weekDays,
      streams: weekOutStreams,
    })
  }

  const range = rangeFromData(outStreams) || {
    start: new Date(),
    end: new Date(),
  }

  // Determine initialDayIndex: first day that hasn't fully ended yet; fallback to last day or 0
  const now = new Date()
  let initialDayIndex = days.findIndex((d) => now <= d.end)
  if (initialDayIndex === -1) {
    initialDayIndex = Math.max(0, days.length - 1)
  }

  const times = schedule.data.times

  return {
    title: title,
    updatedAt: schedule.data.updatedAt,
    start: range.start,
    end: range.end,
    initialDayIndex,
    weeks,
    days,
    streams: outStreams,
    times,
    creators: Array.from(creatorsMap.values()),
  }
}

async function getCreatorFromRef(
  cRef?: ReferenceDataEntry<'creators', string>,
) {
  if (!cRef) return undefined
  const cEntry = await getEntry(cRef)
  if (!cEntry) return undefined
  const cd = cEntry.data
  const imageUrl: string | undefined =
    cd?.profileImage?.medium ||
    cd?.profileImage?.large ||
    cd?.profileImage?.small
  const links = cd.links?.filter((c) => c.type === 'twitch').at(0)
  const url: string = links?.url ?? '' // cd?.link || (Array.isArray(cd?.links) && cd.links[0]?.url) || ''
  const color: string = cd?.style?.primaryColor || '#E30E50'
  const creator: YogsCreator = {
    type: cEntry.data.type,
    id: cEntry.id,
    name: cd?.name ?? '',
    url,
    imageUrl,
    color,
    links: cd.links?.map((link) => {
      return {
        type: link.type ?? 'none',
        name: link.name,
        url: link.url,
      }
    }),
  }
  return creator
}


export async function getUpcomingStreamsFromSchedule(scheduleId: string): Promise<YogsStream[]> {
  const schedule = await getScheduleFromContent(scheduleId)
  const now = new Date()
  return schedule.streams.filter(s => s.start > now)
}
