import { type Component, Show } from 'solid-js'
import { useYogsSchedule } from '../provider/YogsScheduleProvider.tsx'
import { useCreatorFilter } from '../provider/CreatorFilterProvider.tsx'
import { FaSolidChevronLeft, FaSolidChevronRight } from 'solid-icons/fa'
import { BiRegularReset } from 'solid-icons/bi'

export const MobileScheduleControlButtons: Component = () => {
  const { nextDay, prevDay, filterModalSignal, exportModalSignal } =
    useYogsSchedule()
  const { isEmpty } = useCreatorFilter()
  return (
    <Show when={isEmpty()}>
      <div
        class={'h-data flex flex-row items-center justify-between gap-2 p-2'}
      >
        <button
          class={
            'ripple flex h-8 w-12 flex-col items-center justify-center rounded-2xl bg-accent-500 text-white shadow-xl'
          }
          onclick={prevDay}
        >
          <FaSolidChevronLeft />
        </button>
        <button
          class={'h-8 flex-1 rounded-2xl bg-accent-500 text-white shadow-xl'}
          onclick={filterModalSignal.open}
        >
          Filter
        </button>
        <button
          class={'h-8 flex-1 rounded-2xl bg-accent-500 text-white shadow-xl'}
          onclick={exportModalSignal.open}
        >
          Export
        </button>
        <button
          class={
            'ripple flex h-8 w-12 flex-col items-center justify-center rounded-2xl bg-accent-500 text-white shadow-xl'
          }
          onclick={nextDay}
        >
          <FaSolidChevronRight />
        </button>
      </div>
    </Show>
  )
}

export const MobileScheduleFilteredButtons: Component = () => {
  const { filterModalSignal, exportModalSignal } = useYogsSchedule()
  const { isEmpty, reset } = useCreatorFilter()

  return (
    <Show when={!isEmpty()}>
      <div
        class={
          'h-data flex flex-row items-center justify-around rounded-2xl bg-accent-500 p-2 text-white shadow-xl'
        }
      >
        <button
          onclick={reset}
          class={'flex flex-row items-center justify-center gap-2 text-center'}
        >
          <p>Reset</p>
          <BiRegularReset />
        </button>
        <button onclick={filterModalSignal.open}>Filter</button>
        <button onclick={exportModalSignal.open}>Export</button>
      </div>
    </Show>
  )
}
