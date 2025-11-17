import type { YogsSchedule, YogsScheduleDay, YogsScheduleWeek, YogsStream, } from './contract.ts'

async function getJSON<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
export async function loadYogsSchedule(
  kv: KVNamespace,
): Promise<YogsSchedule | null> {
  const data = await getJSON<any>(kv, 'web:yogs-schedule')
  if (!data) return null
  const revivedDays: YogsScheduleDay[] = Array.isArray(data.days)
    ? data.days.map((d: any) => ({
        start: new Date(d.start),
        end: new Date(d.end),
        streams: reviveStreams(d.streams),
      }))
    : []

  // FIX: check data.weeks, not data.days
  const revivedWeeks: YogsScheduleWeek[] = Array.isArray(data.weeks)
    ? data.weeks.map((w: any) => ({
        start: new Date(w.start),
        end: new Date(w.end),
        streams: reviveStreams(w.streams),
        days: Array.isArray(w.days)
          ? w.days.map((d: any) => ({
              start: new Date(d.start),
              end: new Date(d.end),
              streams: reviveStreams(d.streams),
            }))
          : [],
      }))
    : []

  // FIX: revive times[] to Date
  const revivedTimes = Array.isArray(data.times)
    ? data.times.map((t: any) => ({
        start: new Date(t.start),
        end: new Date(t.end),
      }))
    : []
  const revived: YogsSchedule = {
    title: data.title,
    start: new Date(data.start),
    end: new Date(data.end),
    initialDayIndex: Number(data.initialDayIndex ?? 0),
    days: revivedDays,
    streams: reviveStreams(data.streams),
    weeks: revivedWeeks,
    times: revivedTimes,
    creators: Array.isArray(data.creators) ? data.creators : [],
    // FIX: only set when present to avoid Invalid Date
    ...(data.updatedAt ? { updatedAt: new Date(data.updatedAt) } : {}),
  }
  return revived
}

function reviveStreams(list: any[] | undefined): YogsStream[] {
  if (!Array.isArray(list)) return []
  return list.map((s) => reviveStreamDates(s)) as YogsStream[]
}

function reviveStreamDates<T extends { start: any; end: any }>(
  s: T,
): T & {
  start: Date
  end: Date
} {
  return {
    ...(s as any),
    start: new Date((s as any).start),
    end: new Date((s as any).end),
  }
}

export async function storeYogsSchedule(
  kv: KVNamespace,
  data: YogsSchedule,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, 'web:yogs-schedule', data, ttlSeconds)
}

async function putJSON(
  kv: KVNamespace,
  key: string,
  value: unknown,
  ttlSeconds: number = 60,
) {
  await kv.put(key, stringifyWithDates(value), { expirationTtl: ttlSeconds })
}

function stringifyWithDates(value: unknown) {
  return JSON.stringify(value, (_key, val) => {
    if (val instanceof Date) {
      return val.toISOString()
    }
    return val as any
  })
}
