import {createContext, createSignal, onCleanup, type ParentComponent, useContext} from "solid-js";
import type {ScheduleUI} from "../../../../lib/db/models/schedule-ui.ts";
import {createStore} from "solid-js/store";
import {DateTime} from "luxon";

const useScheduleHook = (initSchedule: ScheduleUI) => {
  const [schedule, setSchedule] = createStore<ScheduleUI>(initSchedule)
  const [date, setDate] = createSignal<Date>(new Date())
  const [updatedDate, setUpdatedDate] = createSignal<boolean>(false)

  const interval = setInterval(() => {
    if (!updatedDate()) {
      setDate(new Date())
    }
  }, 1000)


  onCleanup(() => clearInterval(interval))

  const updateDate = (date: Date) => {
    setUpdatedDate(true)
    setDate(date)
  }

  const resetDate = () => {
    setDate(new Date())
    setUpdatedDate(false)
  }

  const findCurrentDayIndex = () => {
    const days = schedule.days
    if (days.length === 0) {
      return 0;
    }
    const currentDate = date()
    // Get current date in local timezone
    const currentLocalDate = DateTime.fromJSDate(currentDate).toLocal()
    const currentDateStr = currentLocalDate.toISODate(); // Get YYYY-MM-DD

    // Find the day that matches the current date
    return days.findIndex(day => {
      // Convert day date from UTC to local timezone
      const dayLocalDate = DateTime.fromJSDate(day.date, { zone: 'utc' }).toLocal()
      // Get YYYY-MM-DD from the day's date in local timezone
      const dayDateStr = dayLocalDate.toISODate();
      return dayDateStr === currentDateStr;
    })
  }

  const findCurrentWeekIndex = () => {
    const currentDate = date()
    // Get current date in local timezone
    const currentLocalDate = DateTime.fromJSDate(currentDate).toLocal()
    const currentYear = currentLocalDate.year

    // Define the date ranges for weeks in local timezone
    const dec1 = DateTime.fromObject({ year: currentYear, month: 12, day: 1 }, { zone: 'local' }).startOf('day')
    const dec8 = DateTime.fromObject({ year: currentYear, month: 12, day: 8 }, { zone: 'local' }).startOf('day')
    const dec15 = DateTime.fromObject({ year: currentYear, month: 12, day: 15 }, { zone: 'local' }).startOf('day')

    // Determine which week the current date falls into
    if (currentLocalDate < dec1) {
      return 0 // beforeJJ
    } else if (currentLocalDate < dec8) {
      return 1 // week1
    } else if (currentLocalDate < dec15) {
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
      // Convert end time from UTC to local time for comparison
      const endDateTime = DateTime.fromJSDate(stream.end, { zone: 'utc' }).toLocal();
      return endDateTime.toJSDate().getTime() > currentDate.getTime();
    });

    // Sort by start date
    const sortedStreams = upcomingStreams.sort((a, b) => {
      // Convert start times from UTC to local time for sorting
      const aStartDateTime = DateTime.fromJSDate(a.start, { zone: 'utc' }).toLocal();
      const bStartDateTime = DateTime.fromJSDate(b.start, { zone: 'utc' }).toLocal();
      return aStartDateTime.toJSDate().getTime() - bStartDateTime.toJSDate().getTime();
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
    dayIndex
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
