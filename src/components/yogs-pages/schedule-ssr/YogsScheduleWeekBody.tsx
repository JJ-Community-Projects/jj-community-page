import {type Component, For} from "solid-js";
import {useYogsSchedule} from "./provider/YogsScheduleProvider.tsx";
import {YogsScheduleDay} from "./YogsScheduleDay.tsx";

export const YogsScheduleWeekBody: Component = (props) => {
  const {week} = useYogsSchedule()
  return (
    <div class="flex flex-row">
      <For each={week().days}>
        {day => <YogsScheduleDay day={day}/>}
      </For>
    </div>
  );
}
