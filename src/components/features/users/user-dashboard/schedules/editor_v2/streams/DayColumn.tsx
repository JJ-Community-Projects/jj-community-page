import { type Component, createSignal, For, Show } from 'solid-js'
import { useScheduleEditor2 } from '../ScheduleEditorProvider.tsx'
import { byDay } from './utils/streamFilters.ts'
import { StreamCard } from './StreamCard.tsx'
import { useAddStreamDialog } from './dialog/add/AddStreamDialogContext.tsx'
import {
  addHours,
  latestByEndOnDay,
  makeDayFallback,
} from './utils/initialTimes.ts'
import { FaRegularEye, FaRegularEyeSlash, FaSolidPlus } from 'solid-icons/fa'
import { getDayColor } from './utils/colors.ts'
import { IconButton } from '../../../../../../ui/Button'
import { Alert } from '../../../../../../ui/Status'

export const DayColumn: Component<{ date: Date; dayIndex: number }> = (
  props,
) => {
  const { state, updateStreams } = useScheduleEditor2()
  const dialog = useAddStreamDialog()
  const year = () => state.schedule?.year ?? props.date.getFullYear()

  const streamsToday = () =>
    byDay(state.streams, props.date).toSorted((a, b) => {
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

  // The server's message when it refused showing / hiding the day's streams; the cards revert (F-66)
  const [error, setError] = createSignal<string | null>(null)

  const setAllVisibility = (visible: boolean) => {
    const updates = streamsToday().map((s) => ({
      id: s.id,
      patch: {
        visible,
      },
    }))
    setError(null)
    updateStreams(updates).catch((e: unknown) =>
      setError(e instanceof Error ? e.message : String(e)),
    )
  }

  const setAllVisible = () => setAllVisibility(true)
  const setAllInvisible = () => setAllVisibility(false)

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

  // The browser tests find a column from its header text: keep the text two levels below the column
  return (
    <div
      class="rounded-group ring-line flex min-w-0 flex-col gap-2 bg-(--day)/10 p-2 ring-1"
      style={{ '--day': getDayColor(props.date) }}
    >
      <div class="flex flex-wrap items-center gap-1">
        <h3 class="flex flex-1 items-center gap-1.5 text-sm font-semibold whitespace-nowrap">
          <span
            class="size-2.5 shrink-0 rounded-full bg-(--day) ring-1 ring-black/10"
            aria-hidden="true"
          />
          {header()}
        </h3>
        <div class="ml-auto flex items-center gap-0.5">
          <Show when={shouldShowSetAllInvisibleButton()}>
            <IconButton
              variant="ghost"
              size="sm"
              class="size-7"
              onClick={setAllInvisible}
              aria-label="Set All Invisible"
              title="Set All Invisible"
            >
              <FaRegularEyeSlash aria-hidden="true" />
            </IconButton>
          </Show>
          <Show when={shouldShowSetAllVisibleButton()}>
            <IconButton
              variant="ghost"
              size="sm"
              class="size-7"
              onClick={setAllVisible}
              aria-label="Set All Visible"
              title="Set All Visible"
            >
              <FaRegularEye aria-hidden="true" />
            </IconButton>
          </Show>
          <IconButton
            variant="accent"
            size="sm"
            class="size-7"
            onClick={addNew}
            aria-label="Add New Stream"
            title="Add New Stream"
          >
            <FaSolidPlus aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      <Show when={error()}>
        {(message) => (
          <Alert tone="danger" class="p-2 text-xs">
            {message()}
          </Alert>
        )}
      </Show>

      <Show
        when={streamsToday().length > 0}
        fallback={<p class="text-fg-muted px-1 text-xs">No streams</p>}
      >
        <div class="flex flex-col gap-1.5">
          <For each={streamsToday()}>
            {(stream) => <StreamCard stream={stream} />}
          </For>
        </div>
      </Show>
    </div>
  )
}

export default DayColumn
