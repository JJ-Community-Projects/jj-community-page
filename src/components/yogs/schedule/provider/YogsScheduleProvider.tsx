import {createContext, createSignal, type ParentComponent, useContext} from "solid-js";
import type {FullCreator, FullSchedule} from "../../../../lib/model/ContentTypes.ts";

const useYogsScheduleHook = (schedule: FullSchedule, _creators: FullCreator[]) => {

  const [weekIndex, setWeekIndex] = createSignal<number>(0)
  const [dayIndex, setDayIndex] = createSignal<number>(0)
  const week = () => schedule.weeks[weekIndex()]
  const days = () => schedule.weeks.map(week => week.days).flat()
  const day = () => days()[dayIndex()]
  const numberOfWeeks = () => schedule.weeks.length
  const numberOfDays = () => schedule.weeks.reduce((acc, week) => acc + week.days.length, 0)
  const nextWeek = () => setWeekIndex((prev) => (prev + 1) % numberOfWeeks())
  const prevWeek = () => setWeekIndex((prev) => (prev - 1 + numberOfWeeks()) % numberOfWeeks())
  const nextDay = () => setDayIndex((prev) => (prev + 1) % numberOfDays())
  const prevDay = () => setDayIndex((prev) => (prev - 1 + numberOfDays()) % numberOfDays())

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

  return {
    schedule,
    streams,
    creators,
    week,
    day,
    days,
    nextWeek,
    prevWeek,
    nextDay,
    prevDay,
    times
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
