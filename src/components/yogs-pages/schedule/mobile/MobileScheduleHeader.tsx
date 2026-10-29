import { type Component, Show } from 'solid-js'
import { useYogsSchedule } from '../provider/YogsScheduleProvider.tsx'
import { useCreatorFilter } from '../provider/CreatorFilterProvider.tsx'
import {
  FilterResetButton,
  FilterShareButton,
} from '../provider/ScheduleCreatorFilterButton.tsx'
import { rangeFromData } from '../../../../lib/utils/rangeFromData.ts'
import { BsPeopleFill } from 'solid-icons/bs'
import {
  FaRegularCalendar,
  FaSolidChevronLeft,
  FaSolidChevronRight,
} from 'solid-icons/fa'
import { Button, IconButton } from '../../../ui/Button'
import { cn, tileSurface } from '../../../ui/cn'
import { LiveBadge } from '../../../ui/Labels'

/**
 * Sticky header of the mobile timeline: title, then the day with prev / next (D4: arrows only).
 * While a filter is active the list shows every matching day, so the day row becomes the filter summary.
 */
export const MobileScheduleHeader: Component = () => {
  const { schedule, day, toDateTime, isToday, mounted, now } = useYogsSchedule()
  const { isEmpty } = useCreatorFilter()

  const start = () => rangeFromData(day().streams)?.start ?? day().start
  const week = () =>
    schedule.weeks.findIndex((w) => w.days.includes(day())) + 1
  // Not YogsStreamUtils.isLive: its end is off (F-91)
  const liveNow = () =>
    mounted() &&
    day().streams.some(
      (s) => s.start.getTime() < now().toMillis() && s.end.getTime() > now().toMillis(),
    )

  return (
    <div class={cn(tileSurface, 'sticky top-2 z-10 flex flex-col gap-1 px-2 py-2')}>
      <p class="font-babas text-center text-xl leading-none tracking-wider">
        {schedule.title}
        <Show when={isEmpty()}> · Week {week()}</Show>
      </p>
      <Show when={isEmpty()} fallback={<FilterSummary />}>
        <DayRow
          date={toDateTime(start()).toFormat("EEE',' MMM d")}
          today={isToday(start())}
          live={liveNow()}
        />
      </Show>
    </div>
  )
}

const DayRow: Component<{ date: string; today: boolean; live: boolean }> = (
  props,
) => {
  const { nextDay, prevDay } = useYogsSchedule()
  return (
    <div class="flex items-center justify-between gap-2">
      <IconButton variant="ghost" aria-label="Previous day" onClick={prevDay}>
        <FaSolidChevronLeft />
      </IconButton>
      <div
        class="flex flex-col items-center gap-0.5"
        aria-live="polite"
        aria-current={props.today ? 'date' : undefined}
      >
        <p class="font-babas flex items-center gap-1.5 text-2xl leading-none tracking-wider">
          {props.date}
          <Show when={props.today}>
            <span class="bg-accent size-1.5 rounded-full" aria-hidden="true" />
            <span class="sr-only">(today)</span>
          </Show>
        </p>
        <Show when={props.live}>
          <LiveBadge label="Live now" />
        </Show>
      </div>
      <IconButton variant="ghost" aria-label="Next day" onClick={nextDay}>
        <FaSolidChevronRight />
      </IconButton>
    </div>
  )
}

const FilterSummary: Component = () => {
  const { creators } = useYogsSchedule()
  const { filter, filteredStreams } = useCreatorFilter()
  const names = () =>
    creators()
      .filter((c) => filter().includes(c.id))
      .map((c) => c.name)
      .join(', ')
  const count = () => filteredStreams().length

  return (
    <div class="flex items-center gap-2 pl-1">
      <p class="min-w-0 flex-1 text-sm" aria-live="polite">
        <span class="text-fg-muted">Filtered: </span>
        <span class="font-semibold">{names()}</span>
        <span class="text-fg-muted">
          {' '}
          · {count()} {count() === 1 ? 'stream' : 'streams'}
        </span>
      </p>
      <FilterShareButton class="shrink-0" />
      <FilterResetButton class="shrink-0" />
    </div>
  )
}

/** Filter and Export under the header, always visible (the dialogs live in MobileYogsSchedule). */
export const MobileScheduleControls: Component = () => {
  const { filterModalSignal, exportModalSignal } = useYogsSchedule()
  const { isEmpty, filter } = useCreatorFilter()
  return (
    <div class="grid grid-cols-2 gap-2">
      <Button
        variant={isEmpty() ? 'canvas' : 'accent'}
        class="w-full shadow-tile"
        aria-haspopup="dialog"
        onClick={filterModalSignal.open}
      >
        <BsPeopleFill class="size-4" />
        Filter
        <Show when={!isEmpty()}>
          <span class="tabular-nums">· {filter().length}</span>
        </Show>
      </Button>
      <Button
        variant="canvas"
        class="w-full"
        aria-haspopup="dialog"
        onClick={exportModalSignal.open}
      >
        <FaRegularCalendar class="size-4" />
        Export
      </Button>
    </div>
  )
}
