import {type Component, For} from "solid-js";
import {useYogsSchedule} from "./provider/YogsScheduleProvider.tsx";
import {YogsScheduleDay} from "./YogsScheduleDay.tsx";
import {useCrossfade} from "./crossfade.ts";

export const YogsScheduleWeekBody: Component = (props) => {
  const {week, setWeekCrossfade} = useYogsSchedule()
  let body: HTMLDivElement | undefined
  // Header tiles stay; their text and the slot cards crossfade
  useCrossfade(() => body, setWeekCrossfade, {keep: '.day', fade: '.yogs-tile-cell, .day p, .day span'})
  return (
    <div class="relative">
      <div ref={body} class="flex flex-row">
        <For each={week().days}>
          {day => <YogsScheduleDay day={day}/>}
        </For>
      </div>
    </div>
  );
}
