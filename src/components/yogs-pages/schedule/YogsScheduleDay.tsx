import { type Component, For, Show } from 'solid-js'
import { YogsStreamTile } from './YogsStreamTile.tsx'
import type { YogsScheduleDay as Day } from '../../../lib/orpc/private/yogs/contract.ts'
import { rangeFromData } from '../../../lib/utils/rangeFromData.ts'
import { useYogsSchedule } from './provider/YogsScheduleProvider.tsx'
import { cn, tileSurface } from '../../ui/cn'

interface YogsScheduleDayProps {
  day: Day
}

export const YogsScheduleDay: Component<YogsScheduleDayProps> = (props) => {
  return (
    <div class="day-container flex flex-col">
      <ScheduleDayHeader day={props.day} />
      <For each={props.day.streams}>
        {(stream) => <YogsStreamTile stream={stream} />}
      </For>
    </div>
  )
}

interface ScheduleDayHeaderProps {
  day: Day
}

const ScheduleDayHeader: Component<ScheduleDayHeaderProps> = (props) => {
  const { toDateTime, isToday } = useYogsSchedule()

  const start = () => rangeFromData(props.day.streams)?.start ?? props.day.start
  const today = () => isToday(start())

  return (
    <div class="yogs-cell day @container">
      <div
        class={cn(
          tileSurface,
          'flex size-full items-center justify-center gap-[calc(var(--yogs-rem)*0.375)]',
          today() && 'ring-accent ring-[length:calc(var(--yogs-rem)*0.125)]',
        )}
        aria-current={today() ? 'date' : undefined}
      >
        <p class="text-[length:clamp(1rem,13cqi,var(--yogs-rem)*1.625)] leading-none tracking-wider">
          {toDateTime(start()).toFormat("EEE',' MMM d")}
        </p>
        <Show when={today()}>
          <span class="bg-accent size-[calc(var(--yogs-rem)*0.375)] shrink-0 rounded-full" aria-hidden="true" />
          <span class="sr-only">(today)</span>
        </Show>
      </div>
    </div>
  )
}
