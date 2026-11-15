import {type Component, Index} from "solid-js";
import {useYogsSchedule} from "./provider/YogsScheduleProvider.tsx";
import {YogsScheduleDay} from "./YogsScheduleDay.tsx";
import {createCrossfade, useSwitchTransition} from "./crossfade.ts";
import {createSlotMorph} from "./slotMorph.ts";

export const YogsScheduleWeekBody: Component = (props) => {
  const {week, setWeekTransition} = useYogsSchedule()
  let body: HTMLDivElement | undefined
  // Tiles morph; the crossfade is the fallback
  const crossfade = createCrossfade(() => body, {keep: '.day', fade: '.yogs-tile-cell, .day p, .day span'})
  useSwitchTransition(setWeekTransition, createSlotMorph(() => body, crossfade))
  return (
    <div class="relative">
      <div ref={body} class="flex flex-row">
        {/* By position: a week switch updates the columns and tiles instead of rebuilding them */}
        <Index each={week().days}>
          {day => <YogsScheduleDay day={day()}/>}
        </Index>
      </div>
    </div>
  );
}
