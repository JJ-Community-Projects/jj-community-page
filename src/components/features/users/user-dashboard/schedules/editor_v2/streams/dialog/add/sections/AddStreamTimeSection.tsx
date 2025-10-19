import { type Component, createSignal, Show } from 'solid-js'
import { TextField } from '@kobalte/core/text-field'
import { useAddStreamDialog } from '../AddStreamDialogContext.tsx'

function toLocalDateTimeInputValue(d: Date) {
  const date = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mi = pad(date.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function clampToRange(date: Date, min: Date, max: Date) {
  const minTime = min.getTime()
  const maxTime = max.getTime()
  const t = date.getTime()
  if (t < minTime) return new Date(minTime)
  if (t > maxTime) return new Date(maxTime)
  return date
}

export const AddStreamTimeSection: Component = () => {
  const dialog = useAddStreamDialog()

  const [relativeEndDate, setRelativeEndDate] = createSignal<boolean>(true)

  const minDate = () => dialog.minDate()
  const maxDate = () => dialog.maxDate()

  const updateStart = (value: string) => {
    const next = new Date(value)
    if (isNaN(next.getTime())) return
    const clamped = clampToRange(next, minDate(), maxDate())
    // Ensure start <= end
    const currentEnd = new Date(dialog.draft.stream.end)
    const nextEnd =
      clamped.getTime() > currentEnd.getTime() ? clamped : currentEnd
    dialog.setStart(clamped)
    dialog.setEnd(nextEnd)
  }

  const updateEnd = (value: string) => {
    const next = new Date(value)
    if (isNaN(next.getTime())) return
    const clamped = clampToRange(next, minDate(), maxDate())
    // Ensure start <= end
    const currentStart = new Date(dialog.draft.stream.start)
    const nextStart =
      clamped.getTime() < currentStart.getTime() ? clamped : currentStart
    dialog.setStart(nextStart)
    dialog.setEnd(clamped)
  }

  const toAttr = (d: Date) => toLocalDateTimeInputValue(d)
  const minAttr = () => toAttr(minDate())
  const maxAttr = () => toAttr(maxDate())

  // Helpers for relative end controls
  const startDate = () => new Date(dialog.draft.stream.start)
  const endDate = () => new Date(dialog.draft.stream.end)

  const oneMinuteMs = 60 * 1000
  const minutesToMs = (m: number) => m * oneMinuteMs

  const durationMinutes = () =>
    Math.round((endDate().getTime() - startDate().getTime()) / oneMinuteMs)

  const setEndToDuration = (minutes: number) => {
    let candidate = new Date(startDate().getTime() + minutesToMs(minutes))
    candidate = clampToRange(candidate, minDate(), maxDate())
    // Ensure end strictly after start
    if (candidate.getTime() <= startDate().getTime()) {
      candidate = new Date(startDate().getTime() + oneMinuteMs)
    }
    dialog.setEnd(candidate)
  }

  const updateEndByDelta = (deltaMinutes: number) => {
    let candidate = new Date(endDate().getTime() + minutesToMs(deltaMinutes))
    candidate = clampToRange(candidate, minDate(), maxDate())
    // Ensure end strictly after start
    if (candidate.getTime() <= startDate().getTime()) {
      candidate = new Date(startDate().getTime() + oneMinuteMs)
    }
    dialog.setEnd(candidate)
  }

  const disableEndMinus15 = () => {
    const cand = new Date(endDate().getTime() - minutesToMs(15))
    return (
      cand.getTime() <= startDate().getTime() ||
      cand.getTime() < minDate().getTime()
    )
  }
  const disableEndMinus30 = () => {
    const cand = new Date(endDate().getTime() - minutesToMs(30))
    return (
      cand.getTime() <= startDate().getTime() ||
      cand.getTime() < minDate().getTime()
    )
  }
  const disableEndPlus15 = () => {
    const cand = new Date(endDate().getTime() + minutesToMs(15))
    return cand.getTime() > maxDate().getTime()
  }
  const disableEndPlus30 = () => {
    const cand = new Date(endDate().getTime() + minutesToMs(30))
    return cand.getTime() > maxDate().getTime()
  }

  return (
    <div class="space-y-3">
      <h3 class="text-sm font-semibold">Time</h3>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextField
          value={toLocalDateTimeInputValue(dialog.draft.stream.start)}
          onChange={updateStart}
        >
          <TextField.Label class="mb-1 text-xs font-medium">
            Start
          </TextField.Label>
          <TextField.Input
            type="datetime-local"
            min={minAttr()}
            max={maxAttr()}
            class="w-full rounded border px-3 py-2"
          />
        </TextField>

        <TextField
          value={toLocalDateTimeInputValue(dialog.draft.stream.end)}
          onChange={updateEnd}
        >
          <TextField.Label class="mb-1 text-xs font-medium">
            <div class={'flex flex-row gap-1 items-start'}>
              <span>End</span>
              <div class="inline-flex rounded bg-gray-200 p-0.5">
                <button
                  type="button"
                  class={`${relativeEndDate() ? 'bg-white shadow' : 'hover:bg-gray-300'} rounded-l px-2 py-1 text-xxs`}
                  onClick={() => setRelativeEndDate(true)}
                >
                  Relative
                </button>
                <button
                  type="button"
                  class={`${!relativeEndDate() ? 'bg-white shadow' : 'hover:bg-gray-300'} rounded-r px-2 py-1 text-xxs`}
                  onClick={() => setRelativeEndDate(false)}
                >
                  Absolute
                </button>
              </div>
            </div>
          </TextField.Label>
          <Show
            when={relativeEndDate()}
            fallback={
              <TextField.Input
                type="datetime-local"
                min={minAttr()}
                max={maxAttr()}
                class="w-full rounded border px-3 py-2"
              />
            }
          >
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="rounded bg-accent px-3 py-2 text-xxs text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disableEndMinus30()}
                onClick={() => updateEndByDelta(-30)}
              >
                -30m
              </button>
              <button
                type="button"
                class="rounded bg-accent px-3 py-2 text-xxs text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disableEndMinus15()}
                onClick={() => updateEndByDelta(-15)}
              >
                -15m
              </button>
              <button
                type="button"
                class="rounded bg-accent px-3 py-2 text-xxs text-white hover:bg-accent-600"
                onClick={() => setEndToDuration(180)}
              >
                3h
              </button>
              <button
                type="button"
                class="rounded bg-accent px-3 py-2 text-xxs text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disableEndPlus15()}
                onClick={() => updateEndByDelta(15)}
              >
                +15m
              </button>
              <button
                type="button"
                class="rounded bg-accent px-3 py-2 text-xxs text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disableEndPlus30()}
                onClick={() => updateEndByDelta(30)}
              >
                +30m
              </button>
            </div>
            <TextField.Description class="text-xxs text-gray-500 mt-1">
              End: {new Date(dialog.draft.stream.end).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </TextField.Description>
          </Show>
        </TextField>
      </div>
    </div>
  )
}

export default AddStreamTimeSection
