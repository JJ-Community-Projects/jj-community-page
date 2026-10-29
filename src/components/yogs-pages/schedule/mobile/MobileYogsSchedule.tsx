import { type Component, For, Show } from 'solid-js'

import { useCreatorFilter } from '../provider/CreatorFilterProvider.tsx'
import { useYogsSchedule } from '../provider/YogsScheduleProvider.tsx'
import { MobileYogsStreamTile, MOBILE_UNIT_REM } from './MobileYogsStreamTile.tsx'
import {
  MobileScheduleControls,
  MobileScheduleHeader,
} from './MobileScheduleHeader.tsx'
import { FilterDialog } from '../provider/ScheduleCreatorFilterButton.tsx'
import { CalendarDialog } from '../provider/ScheduleCalendarExportButton.tsx'
import { rangeFromData } from '../../../../lib/utils/rangeFromData.ts'
import { DateDivider } from '../../../ui/Labels'
import type { YogsScheduleDay } from '../../../../lib/orpc/private/yogs/contract.ts'

/** Gap between rows, in rem (`gap-2`) */
const ROW_GAP_REM = 0.5

/** The mobile layout: a day timeline, not a squeezed grid (below 900px, see yogs-schedule.css). */
export const MobileYogsSchedule: Component = () => {
  const { filterModalSignal, exportModalSignal } = useYogsSchedule()
  return (
    <div class={'mx-auto flex w-full max-w-2xl flex-col gap-3'}>
      <MobileScheduleHeader />
      <MobileScheduleControls />
      <MobileScheduleBody />
      <FilterDialog modalSignal={filterModalSignal} />
      <CalendarDialog modalSignal={exportModalSignal} />
    </div>
  )
}

const MobileScheduleBody: Component = () => {
  const { day, days, toDateTime } = useYogsSchedule()
  const { isEmpty, isSlotPartOfFilter } = useCreatorFilter()

  // The tallest day by summed slot sizes, reserved so the page doesn't jump between days (rows
  // with more text than their slot grow past it, so this is a floor)
  const reservedHeight = () => {
    const tallest = days().reduce(
      (best, d) => {
        const units = d.streams.reduce((sum, s) => sum + s.size, 0)
        return units > best.units ? { units, rows: d.streams.length } : best
      },
      { units: 0, rows: 0 },
    )
    return `${tallest.units * MOBILE_UNIT_REM + Math.max(tallest.rows - 1, 0) * ROW_GAP_REM}rem`
  }

  const filteredDays = () =>
    days()
      .map((d) => ({ day: d, streams: d.streams.filter(isSlotPartOfFilter) }))
      .filter((d) => d.streams.length > 0)

  const dayLabel = (d: YogsScheduleDay) =>
    toDateTime(rangeFromData(d.streams)?.start ?? d.start).toFormat('EEE d MMM')

  return (
    <Show
      when={!isEmpty()}
      fallback={
        <div class="flex flex-col gap-2" style={{ 'min-height': reservedHeight() }}>
          <For each={day().streams}>
            {(stream) => <MobileYogsStreamTile stream={stream} />}
          </For>
        </div>
      }
    >
      <div class="flex flex-col gap-2">
        <For
          each={filteredDays()}
          fallback={
            <p class="text-on-canvas-muted py-6 text-center text-sm">
              No streams match this filter.
            </p>
          }
        >
          {(group) => (
            <>
              <DateDivider tone="canvas" class="mt-2 first:mt-0">
                {dayLabel(group.day)}
              </DateDivider>
              <For each={group.streams}>
                {(stream) => <MobileYogsStreamTile stream={stream} />}
              </For>
            </>
          )}
        </For>
      </div>
    </Show>
  )
}
