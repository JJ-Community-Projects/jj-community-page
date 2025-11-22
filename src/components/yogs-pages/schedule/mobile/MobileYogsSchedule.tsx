import { type Component, For, Show } from 'solid-js'

import { useCreatorFilter } from '../provider/CreatorFilterProvider.tsx'
import { useYogsSchedule } from '../provider/YogsScheduleProvider.tsx'
import { MobileYogsStreamTile } from './MobileYogsStreamTile.tsx'
import { MobileScheduleHeader } from './MobileScheduleHeader.tsx'
import {
  MobileScheduleControlButtons,
  MobileScheduleFilteredButtons,
} from './MobileScheduleButtons.tsx'
import { FilterDialog } from '../provider/ScheduleCreatorFilterButton.tsx'
import { CalendarDialog } from '../provider/ScheduleCalendarExportButton.tsx'

export const MobileYogsSchedule: Component = () => {
  const { filterModalSignal, exportModalSignal } = useYogsSchedule()
  const { isEmpty } = useCreatorFilter()
  return (
    <div class={'flex w-full flex-col gap-2 font-babas tracking-wider'}>
      <MobileScheduleHeader />
      <MobileScheduleFilteredButtons />
      <MobileScheduleBody />
      <MobileScheduleControlButtons />
      <FilterDialog modalSignal={filterModalSignal} />
      <CalendarDialog modalSignal={exportModalSignal} />
    </div>
  )
}

const MobileScheduleBody: Component = () => {
  const { day, streams, longestDayLength } = useYogsSchedule()
  const { isEmpty, isSlotPartOfFilter } = useCreatorFilter()
  const slots = () => day().streams
  const filteredSlots = () => {
    return streams().filter(isSlotPartOfFilter)
  }
  const height = () => {
    return `${longestDayLength() * 96 + (longestDayLength() - 1) * 8}px`
  }

  return (
    <>
      <Show when={isEmpty()}>
        <div
          class={'flex w-full flex-col gap-2'}
          style={{
            'min-height': height(),
          }}
        >
          <For each={slots()}>
            {(slot) => <MobileYogsStreamTile stream={slot} />}
          </For>
        </div>
      </Show>
      <Show when={!isEmpty()}>
        <div class={'flex w-full flex-col gap-2'}>
          <For each={filteredSlots()}>
            {(slot) => <MobileYogsStreamTile stream={slot} />}
          </For>
        </div>
      </Show>
    </>
  )
}
