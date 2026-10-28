import { type Component, createMemo, createSignal } from 'solid-js'
import {
  buildUrl,
  ConfiguratorBody,
  PreviewDataField,
  type PreviewDataMode,
} from '../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../overview/formats.ts'
import { BG_PRESETS, BG_PRESET_ORDER, type BgPreset } from './presets.ts'
import { Select } from '../../../ui/Select'

export const DonationMatchesConfigurator: Component = () => {
  const [bg, setBg] = createSignal<BgPreset>('red')
  const [previewData, setPreviewData] = createSignal<PreviewDataMode>('test')

  const url = createMemo(() =>
    buildUrl('/overlays/donation-matches', { theme: bg() }),
  )

  // Preview requests Example fixtures by default so the list is populated even
  // when no donation match is live; the OBS URL never includes `demo`.
  const previewUrl = createMemo(() =>
    buildUrl('/overlays/donation-matches', {
      theme: bg(),
      demo: previewData() === 'test',
    }),
  )

  return (
    <ConfiguratorBody
      description="A list of the 5 most recent active donation matches."
      format={OVERLAY_FORMATS['donation-matches']}
      previewUrl={previewUrl()}
      linkUrl={url()}
    >
      <PreviewDataField value={previewData()} onChange={setPreviewData} />
      <Select
        label="Theme"
        showLabel
        options={BG_PRESET_ORDER}
        value={bg()}
        onChange={setBg}
        format={(preset) => BG_PRESETS[preset].label}
      />
    </ConfiguratorBody>
  )
}
