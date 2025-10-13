import { type Component, createMemo, createSignal } from 'solid-js'
import ScheduleSelector from '../ScheduleSelector'
import { FieldRow, LinkPreview, PreviewFrame, buildUrl } from './Common'

export const ScheduleSection: Component<{ visible?: boolean }> = (p) => {
  const [scheduleId, setScheduleId] = createSignal<string>('')
  const [scheduleSlug, setScheduleSlug] = createSignal<string>('')

  const scheduleUrl = createMemo(() =>
    buildUrl('/overlays-v2/schedule', {
      scheduleId: scheduleId() ? Number(scheduleId()) : undefined,
      scheduleSlug: scheduleSlug() || undefined,
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <FieldRow label="Schedule ID">
        <input
          type="number"
          value={scheduleId()}
          onInput={(e) => setScheduleId(e.currentTarget.value)}
          class="w-40 rounded bg-black/40 px-2 py-1"
          placeholder="e.g. 1"
        />
      </FieldRow>
      <FieldRow label="Schedule Slug">
        <input
          value={scheduleSlug()}
          onInput={(e) => setScheduleSlug(e.currentTarget.value)}
          class="w-64 rounded bg-black/40 px-2 py-1"
          placeholder="e.g. jinglejam-2024"
        />
      </FieldRow>
      <p class="text-xs opacity-80">Provide exactly one: scheduleId or scheduleSlug</p>
      <div class="mt-2">
        <ScheduleSelector />
      </div>
      <LinkPreview url={scheduleUrl()} />
      <PreviewFrame url={scheduleUrl()} visible={p.visible} />
    </div>
  )
}

export default ScheduleSection
