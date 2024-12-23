import {
  type Accessor,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  type ParentComponent,
  useContext
} from 'solid-js'
import { DateTime } from 'luxon'

interface ScheduleOverlayDateProviderProps {
  date?: DateTime
  debug: boolean
}
const ScheduleOverlayDateProviderContext = createContext<Accessor<DateTime>>()

export const ScheduleOverlayDateProviderProvider: ParentComponent<ScheduleOverlayDateProviderProps> = props => {
  const [date, setDate] = createSignal(props.debug ? props.date! : DateTime.now())
  const timer = setInterval(() => {
    if (props.debug) {
      setDate(d => d.plus({ second: 1 }))
    } else {
      setDate(DateTime.now())
    }
  }, 1000)
  onCleanup(() => clearInterval(timer))
  createEffect(() => {
    console.log('props.debug', props.debug)
    if (props.debug && props.date) {
      setDate(props.date)
    } else {
      setDate(DateTime.now())
    }
  })
  return (
    <ScheduleOverlayDateProviderContext.Provider value={date}>
      {props.children}
    </ScheduleOverlayDateProviderContext.Provider>
  )
}
export const useScheduleOverlayDateProvider = () => {
  return useContext(ScheduleOverlayDateProviderContext)!
}
