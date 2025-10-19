import { type Component, For, Show } from 'solid-js'
import { useScheduleEditor2 } from '../ScheduleEditorProvider.tsx'
import { byDay } from './utils/streamFilters.ts'
import { StreamCard } from './StreamCard.tsx'
import { useAddStreamDialog } from './dialog/add/AddStreamDialogContext.tsx'
import { addHours, latestByEndOnDay, makeDayFallback, } from './utils/initialTimes.ts'
import { FaRegularEye, FaRegularEyeSlash, FaSolidPlus } from 'solid-icons/fa'
import { twMerge } from 'tailwind-merge'
import { DateTime } from 'luxon'
import { getDayBackgroundColor } from './utils/colors.ts'

export const DayColumn: Component<{ date: Date; dayIndex: number }> = (
  props,
) => {
  const { state, updateStreams } = useScheduleEditor2()
  const dialog = useAddStreamDialog()
  const year = () => state.schedule?.year ?? props.date.getFullYear()

  const streamsToday = () => byDay(state.streams, props.date)
    .toSorted((a, b) => {
      if (a.start && b.start) {
        return a.start.getTime() - b.start.getTime()
      }
      return 0
    })

  const shouldShowSetAllVisibleButton = () => {
    return streamsToday().some((s) => !s.visible)
  }
  const shouldShowSetAllInvisibleButton = () => {
    return streamsToday().some((s) => s.visible)
  }

  const setAllVisible = () => {
    const updates = streamsToday().map((s) => ({
      id: s.id,
      patch: {
        visible: true,
      },
    }))
    updateStreams(updates)
  }

  const setAllInvisible = () => {
    const updates = streamsToday().map((s) => ({
      id: s.id,
      patch: {
        visible: false,
      },
    }))
    updateStreams(updates)
  }

  const addNew = () => {
    // Compute start as the end of the last stream on this day; fallback to 18:00
    // End defaults to start + 3 hours
    const todays = streamsToday()
    const last = latestByEndOnDay(todays, props.date)
    const start = last
      ? new Date(last.end as any)
      : makeDayFallback(year(), props.date)
    const end = addHours(start, 3)
    dialog.addNew({ title: '', start, end, visible: false })
  }

  const header = () => {
    const d = props.date
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
  }

  const getWeekDay = () => {
    return DateTime.fromJSDate(props.date).weekday - 1
  }

  return (
    <div
      class={twMerge(
        'flex flex-col gap-2 rounded-lg border p-3',
        getDayBackgroundColor(getWeekDay()),
      )}
    >
      <div class="flex items-center justify-between">
        <div class="text-sm font-semibold">{header()}</div>
        <Show when={shouldShowSetAllInvisibleButton()}>
          <button
            class="rounded bg-accent px-2 py-1 text-xs text-white hover:bg-accent-600"
            onClick={setAllInvisible}
            title="Set All Invisible"
          >
            <FaRegularEyeSlash />
          </button>
        </Show>
        <Show when={shouldShowSetAllVisibleButton()}>
          <button
            class="rounded bg-accent px-2 py-1 text-xs text-white hover:bg-accent-600"
            onClick={setAllVisible}
            title="Set All Visible"
          >
            <FaRegularEye />
          </button>
        </Show>
        <button
          class="rounded bg-accent px-2 py-1 text-xs text-white hover:bg-accent-600"
          onClick={addNew}
          title="Add New Stream"
        >
          <FaSolidPlus />
        </button>
      </div>

      <Show
        when={streamsToday().length > 0}
        fallback={<div class="text-xs text-gray-500">No streams</div>}
      >
        <div class="flex flex-col gap-2">
          <For each={streamsToday()}>
            {(stream) => <StreamCard stream={stream} />}
          </For>
        </div>
      </Show>
    </div>
  )
}

export default DayColumn
