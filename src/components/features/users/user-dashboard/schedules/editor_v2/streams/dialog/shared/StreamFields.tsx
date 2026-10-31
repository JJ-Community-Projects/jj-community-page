import { type Component, createSignal, For, type JSX, Show } from 'solid-js'
import { TextField as KTextField } from '@kobalte/core/text-field'
import { FaSolidCheck, FaSolidPlus, FaSolidXmark } from 'solid-icons/fa'
import { useTagSearch } from '../../../../../../../../../lib/useTagSearch.ts'
import { TAGS_PER_STREAM } from '../../../../../../../../../lib/streamTagLimit.ts'
import type { DraftTag, LocalDraftStream } from '../types/uiDraftTypes.ts'
import { Checkbox, fieldClass, Segmented, TextField } from '../../../../../../../../ui/Form'
import { Button } from '../../../../../../../../ui/Button'
import { cn, focusRing } from '../../../../../../../../ui/cn'

/** What the Add and the Edit dialog contexts both offer for the fields below. */
export type StreamDraftApi = {
  draft: { stream: LocalDraftStream; tags: DraftTag[] }
  setTitle: (value: string) => void
  setVisible: (value: boolean) => void
  setSubtitle: (value: string | null) => void
  setDescription: (value: string | null) => void
  setYoutubeVodUrl: (value: string | null) => void
  setTwitchVodUrl: (value: string | null) => void
  setStart: (value: Date) => void
  setEnd: (value: Date) => void
  addTagLocal: (tag: DraftTag) => void
  removeTagLocal: (tagId: number) => void
}

/** One titled block of a stream dialog. */
export const FieldGroup: Component<{ title: string; children: JSX.Element }> = (props) => (
  <section class="flex flex-col gap-3">
    <h3 class="text-fg-muted text-xs font-semibold tracking-wide uppercase">{props.title}</h3>
    {props.children}
  </section>
)

export const StreamDetailsFields: Component<{ api: StreamDraftApi }> = (props) => (
  <FieldGroup title="Details">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
      <TextField
        class="flex-1"
        label="Title"
        value={props.api.draft.stream.title}
        onChange={(v) => props.api.setTitle(v || '')}
        placeholder="Stream title"
      />
      <Checkbox
        class="sm:mb-2.5"
        label="Visible"
        checked={props.api.draft.stream.visible}
        onChange={(checked) => props.api.setVisible(checked)}
      />
    </div>
    <TextField
      label="Subtitle (optional)"
      value={props.api.draft.stream.subtitle ?? ''}
      onChange={(v) => props.api.setSubtitle(v || null)}
      placeholder="Optional subtitle"
    />
    <TextField
      label="Description"
      multiline
      value={props.api.draft.stream.description ?? ''}
      onChange={(v) => props.api.setDescription(v || null)}
      placeholder="Longer description..."
    />
  </FieldGroup>
)

function toLocalDateTimeInputValue(d: Date | string) {
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

const oneMinuteMs = 60 * 1000
const minutesToMs = (m: number) => m * oneMinuteMs

/** Start, and an end set either relative to it (quick steps) or as a date. Both stay inside min/max. */
export const StreamTimeFields: Component<{ api: StreamDraftApi; minDate: Date; maxDate: Date }> = (props) => {
  const [relativeEndDate, setRelativeEndDate] = createSignal<boolean>(true)

  const startDate = () => new Date(props.api.draft.stream.start)
  const endDate = () => new Date(props.api.draft.stream.end)

  const updateStart = (value: string) => {
    const next = new Date(value)
    if (isNaN(next.getTime())) return
    const clamped = clampToRange(next, props.minDate, props.maxDate)
    // Ensure start <= end
    const currentEnd = endDate()
    const nextEnd = clamped.getTime() > currentEnd.getTime() ? clamped : currentEnd
    props.api.setStart(clamped)
    props.api.setEnd(nextEnd)
  }

  const updateEnd = (value: string) => {
    const next = new Date(value)
    if (isNaN(next.getTime())) return
    const clamped = clampToRange(next, props.minDate, props.maxDate)
    // Ensure start <= end
    const currentStart = startDate()
    const nextStart = clamped.getTime() < currentStart.getTime() ? clamped : currentStart
    props.api.setStart(nextStart)
    props.api.setEnd(clamped)
  }

  // End strictly after start, inside the range
  const setEndTo = (candidate: Date) => {
    let end = clampToRange(candidate, props.minDate, props.maxDate)
    if (end.getTime() <= startDate().getTime()) {
      end = new Date(startDate().getTime() + oneMinuteMs)
    }
    props.api.setEnd(end)
  }
  const setEndToDuration = (minutes: number) =>
    setEndTo(new Date(startDate().getTime() + minutesToMs(minutes)))
  const updateEndByDelta = (deltaMinutes: number) =>
    setEndTo(new Date(endDate().getTime() + minutesToMs(deltaMinutes)))

  const canMoveEnd = (deltaMinutes: number) => {
    const cand = endDate().getTime() + minutesToMs(deltaMinutes)
    return deltaMinutes < 0
      ? cand > startDate().getTime() && cand >= props.minDate.getTime()
      : cand <= props.maxDate.getTime()
  }

  const minAttr = () => toLocalDateTimeInputValue(props.minDate)
  const maxAttr = () => toLocalDateTimeInputValue(props.maxDate)
  const dateInputClass = cn(fieldClass.input, 'h-10')

  const steps = [
    { label: '-30m', delta: -30 },
    { label: '-15m', delta: -15 },
    { label: '3h', duration: 180 },
    { label: '+15m', delta: 15 },
    { label: '+30m', delta: 30 },
  ]

  return (
    <FieldGroup title="Time">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <KTextField
          value={toLocalDateTimeInputValue(props.api.draft.stream.start)}
          onChange={updateStart}
          class="flex flex-col gap-1"
        >
          <KTextField.Label class={fieldClass.label}>Start</KTextField.Label>
          <KTextField.Input type="datetime-local" min={minAttr()} max={maxAttr()} class={dateInputClass} />
        </KTextField>

        <KTextField
          value={toLocalDateTimeInputValue(props.api.draft.stream.end)}
          onChange={updateEnd}
          class="flex flex-col gap-1"
        >
          <div class="flex items-center justify-between gap-2">
            <KTextField.Label class={fieldClass.label}>End</KTextField.Label>
            <Segmented
              label="How to set the end"
              size="sm"
              options={[
                { value: 'relative', label: 'Relative' },
                { value: 'absolute', label: 'Absolute' },
              ]}
              value={relativeEndDate() ? 'relative' : 'absolute'}
              onChange={(v) => setRelativeEndDate(v === 'relative')}
            />
          </div>
          <Show
            when={relativeEndDate()}
            fallback={
              <KTextField.Input type="datetime-local" min={minAttr()} max={maxAttr()} class={dateInputClass} />
            }
          >
            <div class="flex flex-wrap items-center gap-1.5">
              <For each={steps}>
                {(step) => (
                  <Button
                    size="sm"
                    disabled={step.delta !== undefined && !canMoveEnd(step.delta)}
                    onClick={() =>
                      step.delta !== undefined ? updateEndByDelta(step.delta) : setEndToDuration(step.duration!)
                    }
                  >
                    {step.label}
                  </Button>
                )}
              </For>
            </div>
            <KTextField.Description class={fieldClass.help}>
              Ends {endDate().toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </KTextField.Description>
          </Show>
        </KTextField>
      </div>
    </FieldGroup>
  )
}

export const StreamLinksFields: Component<{ api: StreamDraftApi }> = (props) => (
  <FieldGroup title="VOD Links">
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <TextField
        type="url"
        label="Twitch VOD URL"
        value={props.api.draft.stream.twitchVodUrl ?? ''}
        onChange={(v) => props.api.setTwitchVodUrl(v || null)}
        placeholder="https://www.twitch.tv/videos/..."
      />
      <TextField
        type="url"
        label="YouTube VOD URL"
        value={props.api.draft.stream.youtubeVodUrl ?? ''}
        onChange={(v) => props.api.setYoutubeVodUrl(v || null)}
        placeholder="https://youtu.be/..."
      />
    </div>
  </FieldGroup>
)

// Minimal suggestion shape returned by useTagSearch queries
type TagSuggestion = {
  id: number
  name: string
  slug: string
}

const tagButton =
  'inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-colors'

/** Catalog tags only (the stream is saved with their ids), picked from the search suggestions. */
export const StreamTagsField: Component<{ api: StreamDraftApi }> = (props) => {
  const tagSearch = useTagSearch()

  // Dialog-local draft tags for immediate UI feedback and local-only editing
  const tags = () => props.api.draft.tags ?? []
  const isAdded = (t: TagSuggestion) =>
    tags().some((et) => (t.id != null && et.id === t.id) || (t.slug && et.slug === t.slug) || (t.name && et.name === t.name))
  // The server refuses a save over the cap (F-87), so the picker stops there too
  const full = () => tags().length >= TAGS_PER_STREAM

  const onAddSuggestion = (t: TagSuggestion) => {
    if (isAdded(t) || full()) return
    props.api.addTagLocal({ id: t.id, slug: t.slug, name: t.name })
    tagSearch.handleSearchInput('')
  }

  return (
    <FieldGroup title={`Tags (${tags().length}/${TAGS_PER_STREAM})`}>
      <Show when={tags().length > 0}>
        <div class="flex flex-wrap gap-1.5">
          <For each={tags()}>
            {(t) => (
              <span class="bg-accent-soft text-accent-800 dark:text-accent-text ring-accent-soft-line inline-flex items-center gap-1 rounded-full py-0.5 pr-0.5 pl-2.5 text-xs font-semibold ring-1">
                {t.slug || t.name}
                <button
                  type="button"
                  class={cn('hover:bg-accent-soft-hover flex size-5 cursor-pointer items-center justify-center rounded-full', focusRing)}
                  onClick={() => props.api.removeTagLocal(t.id)}
                  aria-label={`Remove tag ${t.slug || t.name}`}
                >
                  <FaSolidXmark class="size-3" aria-hidden="true" />
                </button>
              </span>
            )}
          </For>
        </div>
      </Show>

      <TextField
        label="Add tag"
        value={tagSearch.searchInput?.() ?? ''}
        onChange={tagSearch.handleSearchInput}
        placeholder="Search tag"
      />

      <Show when={full()}>
        <p class={fieldClass.help}>A stream can have up to {TAGS_PER_STREAM} tags. Remove one to add another.</p>
      </Show>
      <Show when={tagSearch.isLoadingTags?.()}>
        <p class={fieldClass.help}>Loading tags…</p>
      </Show>
      <Show when={!tagSearch.isLoadingTags?.() && tagSearch.hasTagsError?.()}>
        <p class={fieldClass.error}>{tagSearch.availableTagsError?.()}</p>
      </Show>
      <Show when={!tagSearch.isLoadingTags?.() && (tagSearch.availableTags?.() ?? []).length > 0}>
        <div class="flex flex-wrap gap-1.5">
          <For each={tagSearch.availableTags!()}>
            {(t: TagSuggestion) => {
              const label = String(t.slug ?? t.name ?? '')
              return (
                <button
                  type="button"
                  class={cn(
                    tagButton,
                    focusRing,
                    'bg-surface-strong text-fg ring-line-strong hover:bg-surface disabled:text-fg-muted disabled:cursor-default disabled:opacity-60 disabled:hover:bg-surface-strong',
                  )}
                  disabled={isAdded(t) || full()}
                  onClick={() => onAddSuggestion(t)}
                  aria-label={`Add tag ${label}`}
                >
                  {label}
                  <Show when={isAdded(t)} fallback={<FaSolidPlus class="size-2.5" aria-hidden="true" />}>
                    <FaSolidCheck class="size-2.5" aria-hidden="true" />
                  </Show>
                </button>
              )
            }}
          </For>
        </div>
      </Show>
    </FieldGroup>
  )
}
