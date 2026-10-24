import {type Component, For} from "solid-js";
import {useYogsSchedule} from "./provider/YogsScheduleProvider.tsx";
import {useNextJJStartDate} from "../../../lib/utils/jjDates.ts";


export const YogsScheduleTimeColumn: Component = (props) => {
  const {times, toDateTime} = useYogsSchedule()
  return (
    <div class="data-width flex flex-col text-sm">
      <Timezone/>
      <For each={times()}>
        {
          ({start, end}) => {
            return <div class="time p-1 @container">
              <div class="~text-xs/lg w-full h-full flex flex-col justify-around items-center bg-white rounded-2xl p-1">
                <p>{toDateTime(start).toFormat('HH:mm')}</p>
                <p>{toDateTime(end).toFormat('HH:mm')}</p>
              </div>
            </div>
          }
        }
      </For>
    </div>
  );
}

const Timezone: Component = () => {
  const nextJJStartDate = useNextJJStartDate()
  const {toDateTime} = useYogsSchedule()
  return (
    <div class="timezone p-1 @container">
      <p class="~text-xs/lg w-full h-full bg-white rounded-2xl flex flex-row items-center justify-center">{
        toDateTime(nextJJStartDate().toJSDate()).offsetNameShort
      }</p>
    </div>
  )
}
