import { type Component, createMemo, createSignal } from 'solid-js'
import { FieldRow, LinkPreview, PreviewFrame, buildUrl } from './Common'

export const ScheduleSimpleSection: Component<{ visible?: boolean }> = (p) => {
  const [simpleSlug, setSimpleSlug] = createSignal<string>('')
  const [includePast, setIncludePast] = createSignal<boolean>(false)
  const [windowSize, setWindowSize] = createSignal<number>(3)

  const simpleUrl = createMemo(() =>
    buildUrl('/overlays-v2/schedule-simple', {
      scheduleSlug: simpleSlug() || undefined,
      includePast: includePast(),
      windowSize: windowSize(),
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <FieldRow label="Schedule Slug">
        <input
          value={simpleSlug()}
          onInput={(e) => setSimpleSlug(e.currentTarget.value)}
          class="w-64 rounded bg-black/40 px-2 py-1"
          placeholder="e.g. jinglejam-2024"
        />
      </FieldRow>
      <FieldRow label="Include Past">
        <input
          type="checkbox"
          checked={includePast()}
          onChange={(e) => setIncludePast(e.currentTarget.checked)}
        />
      </FieldRow>
      <FieldRow label="Window Size">
        <input
          type="number"
          min="1"
          max="10"
          value={windowSize()}
          onInput={(e) => setWindowSize(Number(e.currentTarget.value))}
          class="w-24 rounded bg-black/40 px-2 py-1"
        />
      </FieldRow>
      <LinkPreview url={simpleUrl()} />
      <PreviewFrame url={simpleUrl()} visible={p.visible} />
    </div>
  )
}

export default ScheduleSimpleSection
