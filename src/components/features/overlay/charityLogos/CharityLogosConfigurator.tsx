import { type Component, createMemo, createSignal } from 'solid-js'
import {
  buildUrl,
  ConfiguratorBody,
  PreviewDataField,
  type PreviewDataMode,
} from '../overview/Common.tsx'
import { OVERLAY_FORMATS, type OverlaySize } from '../overview/formats.ts'
import {
  BG_PRESETS,
  BG_PRESET_ORDER,
  type BgPreset,
} from '../donationMatches/presets.ts'
import { Checkbox, fieldClass, Segmented } from '../../../ui/Form'
import { Select } from '../../../ui/Select'

type PreviewShape = 'row' | 'square' | 'column'

// The overlay fits any browser source size; these show how the grid adapts
const PREVIEW_SHAPES: Record<PreviewShape, { label: string; size: OverlaySize }> = {
  row: { label: 'Wide', size: { width: 1200, height: 160 } },
  square: { label: 'Square', size: { width: 450, height: 450 } },
  column: { label: 'Tall', size: { width: 160, height: 800 } },
}

export const CharityLogosConfigurator: Component = () => {
  const [theme, setTheme] = createSignal<BgPreset>('transparent')
  const [logoBg, setLogoBg] = createSignal(true)
  const [names, setNames] = createSignal(false)
  const [previewData, setPreviewData] = createSignal<PreviewDataMode>('test')
  const [shape, setShape] = createSignal<PreviewShape>('square')

  const params = () => ({
    theme: theme(),
    logoBg: logoBg(),
    names: names(),
  })
  const linkUrl = createMemo(() => buildUrl('/overlays/charity-logos', params()))
  // The OBS link never includes `demo`
  const previewUrl = createMemo(() =>
    buildUrl('/overlays/charity-logos', {
      ...params(),
      demo: previewData() === 'test',
    }),
  )

  return (
    <ConfiguratorBody
      description="All Jingle Jam charity logos in a grid that fits the browser source: a wide, low source shows them in one row, a tall, narrow one in one column."
      format={{
        ...OVERLAY_FORMATS['charity-logos'],
        preview: PREVIEW_SHAPES[shape()].size,
      }}
      previewUrl={previewUrl()}
      linkUrl={linkUrl()}
    >
      <PreviewDataField
        value={previewData()}
        onChange={setPreviewData}
        help={
          <>
            Example data is sample charities, shown only in this preview. Your
            copied OBS link always shows the live charities.
          </>
        }
      />
      <div class="flex flex-col items-start gap-1 sm:col-span-2">
        <span class={fieldClass.label} aria-hidden="true">
          Preview shape
        </span>
        <Segmented
          label="Preview shape"
          size="sm"
          options={(Object.keys(PREVIEW_SHAPES) as PreviewShape[]).map((s) => ({
            value: s,
            label: PREVIEW_SHAPES[s].label,
          }))}
          value={shape()}
          onChange={(v) => setShape(v as PreviewShape)}
        />
        <p class={fieldClass.help}>
          Only changes the preview. In OBS, the grid follows the size you give
          the browser source.
        </p>
      </div>
      <Select
        label="Background"
        showLabel
        options={BG_PRESET_ORDER}
        value={theme()}
        onChange={setTheme}
        format={(preset) => BG_PRESETS[preset].label}
      />
      <Checkbox
        label="White box behind each logo"
        checked={logoBg()}
        onChange={setLogoBg}
      />
      <Checkbox
        label="Charity name under each logo"
        checked={names()}
        onChange={setNames}
      />
    </ConfiguratorBody>
  )
}
