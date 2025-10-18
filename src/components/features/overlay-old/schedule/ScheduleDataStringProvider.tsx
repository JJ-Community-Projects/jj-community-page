import { type Accessor, createContext, createSignal, type ParentComponent, type Setter, useContext } from 'solid-js'
import {YOGS_DEMO} from "./demoSchedules.ts";

interface ScheduleDataStringContextProps {
  schedule: Accessor<string>
  setSchedule: Setter<string>
  timezone: Accessor<string>
  setTimezone: Setter<string>
}

const ScheduleDataStringContext = createContext<ScheduleDataStringContextProps>()

export const ScheduleDataStringProvider: ParentComponent = props => {
  const [schedule, setSchedule] = createSignal(YOGS_DEMO)
  const [timezone, setTimezone] = createSignal('Europe/London')

  return (
    <ScheduleDataStringContext.Provider value={{ schedule, setSchedule, timezone, setTimezone }}>
      {props.children}
    </ScheduleDataStringContext.Provider>
  )
}
export const useScheduleDataString = () => useContext(ScheduleDataStringContext)!
