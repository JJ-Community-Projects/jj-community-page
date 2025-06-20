import {createContext, createSignal, onCleanup, type ParentComponent, useContext} from "solid-js";
import type {ScheduleUI} from "../../../lib/db/repos/ScheduleModel.ts";
import {createStore} from "solid-js/store";
import {DateTime} from "luxon";

const useScheduleHook = (initSchedule: ScheduleUI) => {
  const [schedule, setSchedule] = createStore<ScheduleUI>(initSchedule)
  const [date, setDate] = createSignal<DateTime>(DateTime.now().setZone('utc'))
  const [updatedDate, setUpdatedDate] = createSignal<boolean>(false)

  const interval = setInterval(() => {
    if (!updatedDate()) {
      setDate(DateTime.now().setZone('utc'))
    }
  }, 1000)


  onCleanup(() => clearInterval(interval))

  const updateDate = (date: Date) => {
    setUpdatedDate(true)
    setDate(DateTime.fromJSDate(date).setZone('utc'))
  }

  const resetDate = () => {
    setDate(DateTime.now().setZone('utc'))
    setUpdatedDate(false)
  }

  const findCurrentDayIndex = () => {
    const days = schedule.days
    const currentDate = date()

    // Find the day that matches the current date
    return days.findIndex(day => {
      // day.date is already a DateTime object now
      return day.date.hasSame(currentDate, 'day')
    })
  }

  const findCurrentWeekIndex = () => {
    const currentDate = date()
    const currentYear = currentDate.year

    // Define the date ranges for weeks (same as in ScheduleUIRepo)
    const dec1 = DateTime.fromObject({
      year: currentYear,
      month: 12,
      day: 1
    }, { zone: 'utc' })
    const dec8 = DateTime.fromObject({
      year: currentYear,
      month: 12,
      day: 8
    }, { zone: 'utc' })
    const dec15 = DateTime.fromObject({
      year: currentYear,
      month: 12,
      day: 15
    }, { zone: 'utc' })

    // Determine which week the current date falls into
    if (currentDate < dec1) {
      return 0 // beforeJJ
    } else if (currentDate < dec8) {
      return 1 // week1
    } else if (currentDate < dec15) {
      return 2 // week2
    } else {
      return 3 // afterJJ
    }
  }

  const [dayIndex, setDayIndex] = createSignal<number>(findCurrentDayIndex())
  const [weekIndex, setWeekIndex] = createSignal<number>(findCurrentWeekIndex())

  const nextDay = () => setDayIndex((i) => (i + 1) % schedule.days.length)
  const prevDay = () => setDayIndex((i) => (i - 1) % schedule.days.length)

  const nextWeek = () => setWeekIndex((i) => (i + 1) % 2)
  const prevWeek = () => setWeekIndex((i) => (i - 1) % 2)

  const day = () => schedule.days[dayIndex()]

  const week = () => {
    if (weekIndex() === 2) {
      return schedule.weeks.week2
    } else {
      return schedule.weeks.week1
    }
  }


  return {
    schedule,
    date,
    updateDate,
    resetDate,
    findCurrentDayIndex,
    findCurrentWeekIndex,
    nextDay,
    prevDay,
  }
}

interface ScheduleTestProps {
  schedule: ScheduleUI
}

const ScheduleTestContext = createContext<ReturnType<typeof useScheduleHook>>();

export const ScheduleProvider: ParentComponent<ScheduleTestProps> = (props) => {
  const hook = useScheduleHook(props.schedule)
  return (
    <ScheduleTestContext.Provider value={hook}>
      {props.children}
    </ScheduleTestContext.Provider>
  );
}
export const useScheduleTest = () => useContext(ScheduleTestContext)!
