import { type Component, Show } from 'solid-js'
import { DateTime } from 'luxon'
import { useYogsSchedule } from '../provider/YogsScheduleProvider.tsx'
import { rangeFromData } from '../../../../lib/utils/rangeFromData.ts'
import { createModalSignal } from '../../../../lib/createModalSignal.ts'
import { useCreatorFilter } from '../provider/CreatorFilterProvider.tsx'
import { FaSolidChevronLeft, FaSolidChevronRight } from 'solid-icons/fa'
import { BiRegularReset } from 'solid-icons/bi'
import { CalendarDialog } from '../provider/ScheduleCalendarExportButton.tsx'
import { FilterDialog } from '../provider/ScheduleCreatorFilterButton.tsx'

interface MobileScheduleHeaderProps {}

export const MobileScheduleHeader: Component<MobileScheduleHeaderProps> = (
  props,
) => {
  return (
    <div class={'schedule-header flex flex-col gap-2'}>
      <MobileTitle />
      <ScheduleButtons />
    </div>
  )
}
const MobileTitle: Component = () => {
  const { schedule, day } = useYogsSchedule()

  const start = () => {
    const d = day()
    const range = rangeFromData(d.streams)
    if (range) {
      return range.start
    }
    return d.start
  }

  return (
    <div class={'p-schedule'}>
      <div
        class={
          'flex flex-col items-center justify-center rounded-2xl bg-white shadow-xl'
        }
      >
        <h3 class={'text-2xl'}>{schedule.title}</h3>
        <p class={'text-day-header flex-1 text-center text-base'}>
          {DateTime.fromJSDate(start()).toFormat("EEE',' MMM d")}
        </p>
      </div>
    </div>
  )
}

const ScheduleButtons: Component = () => {
  const { schedule, day, nextDay, prevDay } = useYogsSchedule()
  const filterModalSignal = createModalSignal()
  const exportModalSignal = createModalSignal()
  const { isEmpty, reset } = useCreatorFilter()

  return (
    <>
      <div class={'h-data'}>
        <Show when={isEmpty()}>
          <div class={'flex flex-row items-center justify-between gap-4 px-2'}>
            <button
              class={
                'ripple flex h-8 w-8 flex-col items-center justify-center rounded-2xl bg-accent-500 text-white shadow-xl'
              }
              onclick={prevDay}
            >
              <FaSolidChevronLeft />
            </button>
            <button
              class={
                'h-8 flex-1 rounded-2xl bg-accent-500 text-white shadow-xl'
              }
              onclick={filterModalSignal.open}
            >
              Filter
            </button>
            <button
              class={
                'h-8 flex-1 rounded-2xl bg-accent-500 text-white shadow-xl'
              }
              onclick={exportModalSignal.open}
            >
              Export
            </button>
            <button
              class={
                'ripple flex h-8 w-8 flex-col items-center justify-center rounded-2xl bg-accent-500 text-white shadow-xl'
              }
              onclick={nextDay}
            >
              <FaSolidChevronRight />
            </button>
          </div>
        </Show>
        <Show when={!isEmpty()}>
          <div
            class={
              'flex flex-row items-center justify-around rounded-2xl bg-accent-500 text-white shadow-xl'
            }
          >
            <button onclick={reset}>
              <BiRegularReset />
            </button>
            <button onclick={filterModalSignal.open}>Filter</button>
            <button onclick={exportModalSignal.open}>Export</button>
          </div>
        </Show>
      </div>
      <FilterDialog modalSignal={filterModalSignal} />
      <CalendarDialog modalSignal={exportModalSignal} />
    </>
  )
}
