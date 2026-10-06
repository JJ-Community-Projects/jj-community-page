import { type Component, createMemo, createSignal, For } from 'solid-js'
import {
  buildUrl,
  FieldRow,
  LinkPreview,
  PreviewDataField,
  type PreviewDataMode,
  PreviewFrame,
} from '../overview/Common.tsx'
import { BG_PRESETS, BG_PRESET_ORDER, type BgPreset } from './presets.ts'

export const DonationMatchesConfigurator: Component<{ visible?: boolean }> = (
  props,
) => {
  const [bg, setBg] = createSignal<BgPreset>('red')
  const [previewData, setPreviewData] = createSignal<PreviewDataMode>('test')

  const url = createMemo(() =>
    buildUrl('/overlays/donation-matches', { bg: bg() }),
  )

  // Preview requests Example fixtures by default so the list is populated even
  // when no donation match is live; the OBS URL never includes `demo`.
  const previewUrl = createMemo(() =>
    buildUrl('/overlays/donation-matches', {
      bg: bg(),
      demo: previewData() === 'test',
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <p class="mb-2 rounded border border-white/10 bg-white/5 p-2 text-sm text-white/80">
        A list of the 5 most recent active donation matches.
      </p>
      <PreviewDataField value={previewData()} onChange={setPreviewData} />
      <FieldRow label="Background">
        <select
          class="rounded bg-black/40 px-2 py-1"
          value={bg()}
          onChange={(e) => setBg(e.currentTarget.value as BgPreset)}
        >
          <For each={BG_PRESET_ORDER}>
            {(preset) => (
              <option value={preset}>{BG_PRESETS[preset].label}</option>
            )}
          </For>
        </select>
      </FieldRow>
      <LinkPreview url={url()} />
      <div class={'max-w-[480px]'}>
        <PreviewFrame url={previewUrl()} visible={props.visible} />
      </div>
    </div>
  )
}
