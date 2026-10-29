import { createContext, createSignal, onMount, type ParentComponent, useContext, } from 'solid-js'
import type { YogsCreator, YogsSchedule, } from '../../../../lib/orpc/private/yogs/contract.ts'
import { DateTime } from 'luxon'
import { useNextJJEndDate } from '../../../../lib/utils/jjDates.ts'
import { createModalSignal } from '../../../../lib/createModalSignal.ts'
import { useNow } from '../../../../lib/utils/useNow.ts'

const useYogsScheduleHook = (
  schedule: YogsSchedule,
  _creators: YogsCreator[],
) => {
  const [weekIndex, setWeekIndex] = createSignal<number>(0)
  const [dayIndex, setDayIndex] = createSignal<number>(0)
  const end = useNextJJEndDate()
  const week = () => schedule.weeks[weekIndex()]
  const days = () => schedule.weeks.map((week) => week.days).flat()
  const day = () => days()[dayIndex()]
  const numberOfWeeks = () => schedule.weeks.length
  const numberOfDays = () =>
    schedule.weeks.reduce((acc, week) => acc + week.days.length, 0)
  const nextWeek = () => setWeekIndex((prev) => (prev + 1) % numberOfWeeks())
  const prevWeek = () =>
    setWeekIndex((prev) => (prev - 1 + numberOfWeeks()) % numberOfWeeks())
  const nextDay = () => setDayIndex((prev) => (prev + 1) % numberOfDays())
  const prevDay = () =>
    setDayIndex((prev) => (prev - 1 + numberOfDays()) % numberOfDays())

  const firstDay = DateTime.fromJSDate(days()[0].start, {
    zone: 'Europe/London',
  })
  const lastDay = end()
  const now = DateTime.now().setZone('Europe/London')

  const isNowBetween = now >= firstDay && now <= lastDay

  const jjEnd = useNextJJEndDate()

  onMount(() => {
    if (!isNowBetween) {
      return
    }

    const now = DateTime.now().setZone('Europe/London')
    const startWeek2 = DateTime.fromISO(now.year + '-12-08T01:00:00.000Z')
    const end = jjEnd()

    if (now >= startWeek2 && now <= end) {
      setWeekIndex(1)
    }

    for (let i = 0; i < numberOfDays(); i++) {
      const day = days()[i]
      const date = DateTime.fromJSDate(day.start)
      if (date.hasSame(now, 'day')) {
        setDayIndex(i)
        break
      }
    }
  })

  const times = () => {
    return schedule.times
  }

  const streams = () => schedule.streams

  const creators = (): YogsCreator[] => {
    const map: { [key: string]: YogsCreator } = {}
    for (const stream of streams()) {
      if (stream.creators) {
        for (const creator of stream.creators) {
          if (!map[creator.id]) {
            map[creator.id] = creator
          }
        }
      }
    }
    return Object.values(map)
  }

  const getCreatorStreams = (id: string) => {
    return streams().filter((stream) =>
      stream.creators?.some((creator) => creator.id === id),
    )
  }

  // The server render and the first client render (hydration) must produce the same markup, so
  // times are shown in London time with a fixed locale and nothing depends on the clock until the
  // island is mounted; then dates switch to the viewer's timezone and countdowns / live state start.
  const [mounted, setMounted] = createSignal(false)
  onMount(() => setMounted(true))
  const toDateTime = (date: Date) =>
    mounted()
      ? DateTime.fromJSDate(date)
      : DateTime.fromJSDate(date, { zone: 'Europe/London' }).setLocale('en-US')

  // One clock for the grid; the states below stay false until mounted, like everything clock-based
  const clock = useNow()
  const scheduleStart = Math.min(...schedule.streams.map((s) => s.start.getTime()))
  const scheduleEnd = Math.max(...schedule.streams.map((s) => s.end.getTime()))
  /** Between the schedule's first start and last end (so never on archive pages). */
  const isRunning = () =>
    mounted() &&
    clock().toMillis() >= scheduleStart &&
    clock().toMillis() <= scheduleEnd
  /** The date is today in the viewer's timezone, while the schedule is running. */
  const isToday = (date: Date) =>
    isRunning() && DateTime.fromJSDate(date).hasSame(clock(), 'day')

  const filterModalSignal = createModalSignal()
  const exportModalSignal = createModalSignal()
  return {
    mounted,
    toDateTime,
    now: clock,
    isRunning,
    isToday,
    schedule,
    streams,
    creators,
    week,
    day,
    days,
    nextWeek,
    prevWeek,
    weekIndex,
    numberOfWeeks,
    nextDay,
    prevDay,
    times,
    getCreatorStreams,
    filterModalSignal,
    exportModalSignal
  }
}

interface YogsScheduleProps {
  schedule: YogsSchedule
  creators: YogsCreator[]
}

const YogsScheduleContext =
  createContext<ReturnType<typeof useYogsScheduleHook>>()

export const YogsScheduleProvider: ParentComponent<YogsScheduleProps> = (
  props,
) => {
  const hook = useYogsScheduleHook(props.schedule, props.creators)
  return (
    <YogsScheduleContext.Provider value={hook}>
      {props.children}
    </YogsScheduleContext.Provider>
  )
}
export const useYogsSchedule = () => useContext(YogsScheduleContext)!
