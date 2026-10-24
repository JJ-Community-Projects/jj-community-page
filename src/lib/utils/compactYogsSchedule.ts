import type {
  YogsCreator,
  YogsSchedule,
  YogsScheduleDay,
  YogsStream,
} from '../orpc/private/yogs/contract.ts'

/**
 * Island props for a Yogscast schedule. A YogsSchedule holds every stream four times (days, weeks,
 * week streams, streams) and every creator once per stream; Astro serializes props by value, so the
 * full object is ~1.5 MB per island. This form keeps each stream and creator once, refers to
 * creators by index and stores dates as epoch milliseconds.
 */
export interface CompactYogsSchedule {
  title: string
  start: number
  end: number
  updatedAt?: number
  initialDayIndex: number
  times: [number, number][]
  /** Every creator referenced by a stream; the first `creatorCount` are the schedule's `creators`. */
  creators: YogsCreator[]
  creatorCount: number
  weeks: CompactWeek[]
}

interface CompactWeek {
  start: number
  end: number
  days: CompactDay[]
}

interface CompactDay {
  start: number
  end: number
  streams: CompactStream[]
}

interface CompactStream {
  title: string
  subtitle?: string
  description?: string
  markdownDescription?: string
  start: number
  end: number
  /** Indexes into `creators`. */
  creators?: number[]
  vods?: YogsStream['vods']
  color: string
  size: number
  owner?: number
}

export function compactYogsSchedule(
  schedule: YogsSchedule,
): CompactYogsSchedule {
  const creators: YogsCreator[] = [...schedule.creators]
  const indexById = new Map(
    creators.map((creator, index) => [creator.id, index]),
  )
  const creatorIndex = (creator: YogsCreator) => {
    let index = indexById.get(creator.id)
    if (index === undefined) {
      index = creators.push(creator) - 1
      indexById.set(creator.id, index)
    }
    return index
  }

  const compactStream = (stream: YogsStream): CompactStream => ({
    title: stream.title,
    subtitle: stream.subtitle,
    description: stream.description,
    markdownDescription: stream.markdownDescription,
    start: stream.start.getTime(),
    end: stream.end.getTime(),
    creators: stream.creators?.map(creatorIndex),
    vods: stream.vods,
    color: stream.color,
    size: stream.size,
    owner: stream.owner ? creatorIndex(stream.owner) : undefined,
  })

  const compactDay = (day: YogsScheduleDay): CompactDay => ({
    start: day.start.getTime(),
    end: day.end.getTime(),
    streams: day.streams.map(compactStream),
  })

  return withoutUndefined({
    title: schedule.title,
    start: schedule.start.getTime(),
    end: schedule.end.getTime(),
    updatedAt: schedule.updatedAt?.getTime(),
    initialDayIndex: schedule.initialDayIndex,
    times: schedule.times.map((time) => [
      time.start.getTime(),
      time.end.getTime(),
    ]),
    creatorCount: schedule.creators.length,
    weeks: schedule.weeks.map((week) => ({
      start: week.start.getTime(),
      end: week.end.getTime(),
      days: week.days.map(compactDay),
    })),
    creators,
  })
}

/**
 * Astro serializes an `undefined` prop value as `null`, so the island would see other values than
 * the server render did (and every missing field costs bytes). Drop them instead.
 */
function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutUndefined) as T
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, withoutUndefined(entry)]),
    ) as T
  }
  return value
}

/** Rebuilds the YogsSchedule; days, weeks and the flat stream list share the same stream objects. */
export function expandYogsSchedule(compact: CompactYogsSchedule): YogsSchedule {
  const streams: YogsStream[] = []
  const days: YogsScheduleDay[] = []

  const weeks = compact.weeks.map((week) => {
    const weekStreams: YogsStream[] = []
    const weekDays = week.days.map((day) => {
      const dayStreams = day.streams.map((stream): YogsStream => {
        const creators = stream.creators?.map(
          (index) => compact.creators[index],
        )
        return {
          title: stream.title,
          subtitle: stream.subtitle,
          description: stream.description,
          markdownDescription: stream.markdownDescription,
          start: new Date(stream.start),
          end: new Date(stream.end),
          creators,
          vods: stream.vods,
          color: stream.color,
          size: stream.size,
          owner:
            stream.owner === undefined
              ? undefined
              : compact.creators[stream.owner],
        }
      })
      weekStreams.push(...dayStreams)
      const expanded = {
        start: new Date(day.start),
        end: new Date(day.end),
        streams: dayStreams,
      }
      days.push(expanded)
      return expanded
    })
    streams.push(...weekStreams)
    return {
      start: new Date(week.start),
      end: new Date(week.end),
      days: weekDays,
      streams: weekStreams,
    }
  })

  return {
    title: compact.title,
    start: new Date(compact.start),
    end: new Date(compact.end),
    updatedAt:
      compact.updatedAt === undefined ? undefined : new Date(compact.updatedAt),
    initialDayIndex: compact.initialDayIndex,
    weeks,
    days,
    streams,
    times: compact.times.map(([start, end]) => ({
      start: new Date(start),
      end: new Date(end),
    })),
    creators: compact.creators.slice(0, compact.creatorCount),
  }
}
