import {createContext, createSignal, onMount, type ParentComponent, useContext} from "solid-js";
import type {FullCreator, FullSchedule} from "../../../../lib/model/ContentTypes.ts";
import {DateTime} from "luxon";
import {useNextJJEndDate} from "../../../../lib/utils/jjDates.ts";

const useYogsScheduleHook = (schedule: FullSchedule, _creators: FullCreator[]) => {

  const [weekIndex, setWeekIndex] = createSignal<number>(0)
  const [dayIndex, setDayIndex] = createSignal<number>(0)
  const end = useNextJJEndDate()
  const week = () => schedule.weeks[weekIndex()]
  const days = () => schedule.weeks.map(week => week.days).flat()
  const day = () => days()[dayIndex()]
  const numberOfWeeks = () => schedule.weeks.length
  const numberOfDays = () => schedule.weeks.reduce((acc, week) => acc + week.days.length, 0)
  const nextWeek = () => setWeekIndex((prev) => (prev + 1) % numberOfWeeks())
  const prevWeek = () => setWeekIndex((prev) => (prev - 1 + numberOfWeeks()) % numberOfWeeks())
  const nextDay = () => setDayIndex((prev) => (prev + 1) % numberOfDays())
  const prevDay = () => setDayIndex((prev) => (prev - 1 + numberOfDays()) % numberOfDays())

  const firstDay = DateTime.fromJSDate(days()[0].date, {
    zone: 'Europe/London'
  })
  const lastDay = end()
  const now = DateTime.now().setZone('Europe/London')

  console.log('numberOfDays', numberOfDays())
  console.log('date', days()[numberOfDays() - 1].date)
  console.log('firstDay', firstDay)
  console.log('lastDay', lastDay)
  console.log('now', now)
  const isNowBetween = now >= firstDay && now <= lastDay

  const jjEnd = useNextJJEndDate()

  onMount(() => {
    if (!isNowBetween) {
      return
    }

    const now = DateTime.now().setZone('Europe/London')
    const startWeek2 = DateTime.fromISO(now.year + '-12-08T01:00:00.000Z')
    const end = jjEnd()
    console.log('dates', now, startWeek2, end)
    console.log('now >= startWeek2', now >= startWeek2)
    console.log('now <= end', now <= end)

    if (now >= startWeek2 && now <= end) {
      setWeekIndex(1)
    }

    for (let i = 0; i < numberOfDays(); i++) {
      const day = days()[i]
      const date = DateTime.fromJSDate(day.date)
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

  const creators = (): FullCreator[] => {
    const map: { [key: string]: FullCreator } = {}
    for (const stream of streams()) {
      for (const creator of stream.creators) {
        if (!map[creator.id]) {
          map[creator.id] = creator
        }
      }
    }
    return Object.values(map)
  }

  const getCreatorStreams = (id: string) => {
    return streams().filter(stream => stream.creators.some(creator => creator.id === id))
  }

  return {
    schedule,
    streams,
    creators,
    week,
    day,
    days,
    nextWeek,
    prevWeek,
    weekIndex,
    nextDay,
    prevDay,
    times,
    getCreatorStreams
  }
}

interface YogsScheduleProps {
  schedule: FullSchedule
  creators: FullCreator[]
}

const YogsScheduleContext = createContext<ReturnType<typeof useYogsScheduleHook>>();

export const YogsScheduleProvider: ParentComponent<YogsScheduleProps> = (props) => {
  const hook = useYogsScheduleHook(props.schedule, props.creators)
  return (
    <YogsScheduleContext.Provider value={hook}>
      {props.children}
    </YogsScheduleContext.Provider>
  );
}
export const useYogsSchedule = () => useContext(YogsScheduleContext)!;
