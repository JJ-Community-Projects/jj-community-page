import {createContext, createSignal, onCleanup, type ParentComponent, useContext} from "solid-js";
import type {ScheduleUI} from "../../../../lib/db/models/schedule-ui.ts";
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

  const nextDay = () => setDayIndex((i) => (i + 1) % schedule.days.length)
  const prevDay = () => setDayIndex((i) => (i - 1) % schedule.days.length)

  const day = () => schedule.days[dayIndex()]

  const days = () => schedule.days


  const nextThreeStreams = () => {
    const currentDate = date();
    // Flatten all streams from all days
    const allStreams = schedule.days.flatMap(day => day.streams);

    // Filter streams that haven't ended yet
    const upcomingStreams = allStreams.filter(stream => {
      const endDate = DateTime.fromJSDate(stream.end).setZone('utc');
      return endDate > currentDate;
    });

    // Sort by start date
    const sortedStreams = upcomingStreams.sort((a, b) => {
      const aStart = DateTime.fromJSDate(a.start).setZone('utc');
      const bStart = DateTime.fromJSDate(b.start).setZone('utc');
      return aStart.toMillis() - bStart.toMillis();
    });

    // Return the first 3 streams
    return sortedStreams.slice(0, 3);
  }

  const nextStream = () => {
    const streams = nextThreeStreams();
    return streams.length > 0 ? streams[0] : undefined;
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
    days,
    nextThreeStreams,
    nextStream,
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
