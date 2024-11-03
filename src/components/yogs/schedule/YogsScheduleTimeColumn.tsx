import {type Component, For} from "solid-js";
import {useYogsSchedule} from "./provider/YogsScheduleProvider.tsx";
import {useNextJJStartDate} from "../../../lib/utils/jjDates.ts";
import {DateTime} from "luxon";


export const YogsScheduleTimeColumn: Component = (props) => {
  const {times} = useYogsSchedule()
  return (
    <div class="data-width flex flex-col text-sm">
      <Timezone/>
      <For each={times()}>
        {
          ({start, end}) => {
            const s = DateTime.fromJSDate(start)
            const e = DateTime.fromJSDate(end)
            return <div class="time p-1">
              <div class="w-full h-full flex flex-col justify-around items-center bg-white rounded-2xl p-1">
                <p>{s.toFormat('HH:mm')}</p>
                <p>{e.toFormat('HH:mm')}</p>
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
  return (
    <div class="timezone p-1">
      <p class="w-full h-full bg-white rounded-2xl flex flex-row items-center justify-center">{
        nextJJStartDate().toLocal().offsetNameShort
      }</p>
    </div>
  )
}
