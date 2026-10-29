import {type Component, For} from "solid-js";
import {useYogsSchedule} from "./provider/YogsScheduleProvider.tsx";
import {useNextJJStartDate} from "../../../lib/utils/jjDates.ts";
import {cn, tileSurface} from "../../ui/cn";

export const YogsScheduleTimeColumn: Component = () => {
  const {times, toDateTime} = useYogsSchedule()
  return (
    <div class="data-width flex flex-col">
      <Timezone/>
      <For each={times()}>
        {({start, end}) => (
          <div class="yogs-cell time @container">
            <div class={cn(tileSurface, 'flex size-full flex-col items-center justify-between py-2 text-[length:clamp(0.75rem,30cqi,1.25rem)] leading-none')}>
              <p>{toDateTime(start).toFormat('HH:mm')}</p>
              <p class="text-fg-muted">{toDateTime(end).toFormat('HH:mm')}</p>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

const Timezone: Component = () => {
  const nextJJStartDate = useNextJJStartDate()
  const {toDateTime} = useYogsSchedule()
  return (
    <div class="yogs-cell timezone @container">
      <p class={cn(tileSurface, 'text-fg-muted flex size-full items-center justify-center text-[length:clamp(0.625rem,24cqi,1rem)]')}>
        {toDateTime(nextJJStartDate().toJSDate()).offsetNameShort}
      </p>
    </div>
  )
}
