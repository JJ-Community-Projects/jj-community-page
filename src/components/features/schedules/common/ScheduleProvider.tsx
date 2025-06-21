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
    const currentDateStr = currentDate.toISOString().split('T')[0]; // Get YYYY-MM-DD

    // Find the day that matches the current date
    return days.findIndex(day => {
      // Get YYYY-MM-DD from the day's date
      const dayDateStr = day.date.toISOString().split('T')[0];
      return dayDateStr === currentDateStr;
    })
  }

  const findCurrentWeekIndex = () => {
    const currentDate = date()
    const currentYear = currentDate.getUTCFullYear()

    // Define the date ranges for weeks (same as in ScheduleUIRepo)
    const dec1 = new Date(Date.UTC(currentYear, 11, 1)); // Month is 0-based, so 11 is December
    const dec8 = new Date(Date.UTC(currentYear, 11, 8));
    const dec15 = new Date(Date.UTC(currentYear, 11, 15));

    // Determine which week the current date falls into
    const currentTime = currentDate.getTime();
    if (currentTime < dec1.getTime()) {
      return 0 // beforeJJ
    } else if (currentTime < dec8.getTime()) {
      return 1 // week1
    } else if (currentTime < dec15.getTime()) {
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
      return stream.end.getTime() > currentDate.getTime();
    });

    // Sort by start date
    const sortedStreams = upcomingStreams.sort((a, b) => {
      return a.start.getTime() - b.start.getTime();
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
