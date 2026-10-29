import {type Component, For, Show} from "solid-js";
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
  const name = () => toDateTime(nextJJStartDate().toJSDate()).offsetNameShort ?? ''
  // Long offsets ("GMT+10:30") don't fit the cell on one line: the offset goes below "GMT"
  const parts = () => (name().length > 6 ? name().match(/^([A-Z]+)([+-].+)$/)?.slice(1) : undefined)
  return (
    <div class="yogs-cell timezone @container">
      <p
        class={cn(
          tileSurface,
          'text-fg-muted flex size-full flex-col items-center justify-center leading-tight',
          // Two lines need a lower floor in the small cell of narrow grids
          parts() ? 'text-[length:clamp(0.5625rem,30cqi,1.25rem)]' : 'text-[length:clamp(0.75rem,30cqi,1.25rem)]',
        )}
      >
        <Show when={parts()} fallback={name()}>
          {(split) => (
            <>
              <span>{split()[0]}</span>
              <span>{split()[1]}</span>
            </>
          )}
        </Show>
      </p>
    </div>
  )
}
