import { type Component, createMemo, createSignal, For, Show } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import {
  buildUrl,
  ConfiguratorBody,
  type Currency,
  CurrencySelect,
  PreviewDataField,
  type PreviewDataMode,
  titleCase,
} from '../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../overview/formats.ts'
import type { TransitionStyle } from './CharitiesOverlay.tsx'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { useUser } from '../../users/user-dashboard/providers/UserProvider.tsx'
import { Checkbox, fieldClass } from '../../../ui/Form'
import { Select } from '../../../ui/Select'
import { TileGroup } from '../../../ui/Tile'
import { Spinner } from '../../../ui/Status'

type Theme2 = 'default' | 'red' | 'blue' | 'carousel'
type HeaderTheme2 = 'default' | 'red' | 'blue'
type QrCode = 'none' | 'fundraiser' | 'charity'
type Interval = 'default' | 'slow'

// URL values, in display order
const headerOptions = ['Title', 'Donate', 'JJLink'] as const
const headerLabels: Record<(typeof headerOptions)[number], string> = {
  Title: 'Title',
  Donate: 'Donate command',
  JJLink: 'Jingle Jam link',
}

export const CharitiesConfigurator: Component = () => {
  const [selectedHeaders, setSelectedHeaders] = createSignal<string[]>([
    'Title',
    'JJLink',
  ])
  const [includeTotals2, setIncludeTotals2] = createSignal<boolean>(false)
  const [theme2, setTheme2] = createSignal<Theme2>('default')
  const [headerTheme2, setHeaderTheme2] = createSignal<HeaderTheme2>('default')
  const [showDesc, setShowDesc] = createSignal<boolean>(false)
  const [qrCode, setQrCode] = createSignal<QrCode>('none')
  const [currency, setCurrency] = createSignal<Currency>('GBP')
  const [showUrl, setShowUrl] = createSignal<boolean>(true)
  const [showDots, setShowDots] = createSignal<boolean>(true)
  const [transition, setTransition] = createSignal<TransitionStyle>('fade')
  const [rotation, setRotation] = createSignal<Interval>('default')
  const [selectedIds, setSelectedIds] = createSignal<string[]>([])
  const [previewData, setPreviewData] = createSignal<PreviewDataMode>('test')

  // Fetch charities list via oRPC for checkbox selection
  const q = useQuery(() =>
    orpcPrivate.overlay.charities.queryOptions({
      input: { includeTotals: includeTotals2() },
    }),
  )
  const charities = () => q.data?.charities ?? []
  const toggleOne = (id: string, checked: boolean) => {
    const set = new Set(selectedIds())
    if (checked) set.add(id)
    else set.delete(id)
    setSelectedIds(Array.from(set))
  }
  const toggleHeader = (h: string, checked: boolean) => {
    const set = new Set(selectedHeaders())
    if (checked) set.add(h)
    else set.delete(h)
    // Preserve default display order of headerOptions
    setSelectedHeaders(headerOptions.filter((x) => set.has(x)))
  }

  const causesParam = createMemo(() =>
    selectedIds().length > 0 ? selectedIds().join(',') : undefined,
  )

  const { user } = useUser()

  const params = () => ({
    header: selectedHeaders(),
    includeTotals: includeTotals2(),
    theme: theme2(),
    headerTheme: headerTheme2(),
    showDesc: showDesc(),
    qrCode: qrCode(),
    currency: currency(),
    showUrl: showUrl(),
    showDots: showDots(),
    transition: transition(),
    interval: rotation(),
    causes: causesParam(),
    user: user?.tiltifySlug,
  })
  const charities2Url = createMemo(() =>
    buildUrl('/overlays/charities2', params()),
  )
  // Preview requests demo fixtures by default so the panel is populated even
  // when no live data is available; the OBS URL never includes `demo`.
  const previewUrl = createMemo(() =>
    buildUrl('/overlays/charities2', {
      ...params(),
      demo: previewData() === 'test',
    }),
  )

  return (
    <ConfiguratorBody
      description="An info panel that cycles through the Jingle Jam charities, with optional header cards, totals, descriptions and a QR code."
      format={OVERLAY_FORMATS.charities2}
      previewUrl={previewUrl()}
      linkUrl={charities2Url()}
    >
      <PreviewDataField value={previewData()} onChange={setPreviewData} />
      <Select
        label="Theme"
        showLabel
        options={['default', 'red', 'blue', 'carousel'] as Theme2[]}
        value={theme2()}
        onChange={setTheme2}
        format={titleCase}
      />
      <Select
        label="Header theme"
        showLabel
        options={['default', 'red', 'blue'] as HeaderTheme2[]}
        value={headerTheme2()}
        onChange={setHeaderTheme2}
        format={titleCase}
      />
      <Select
        label="Transition"
        showLabel
        options={['fade', 'slide', 'flip', 'none'] as TransitionStyle[]}
        value={transition()}
        onChange={setTransition}
        format={titleCase}
      />
      <Select
        label="Interval"
        showLabel
        options={['default', 'slow'] as Interval[]}
        value={rotation()}
        onChange={setRotation}
        format={(v) => (v === 'slow' ? 'Slow (20s)' : 'Default (10s)')}
      />
      <CurrencySelect value={currency()} onChange={setCurrency} />
      <Select
        label="QR code"
        showLabel
        options={['none', 'fundraiser', 'charity'] as QrCode[]}
        value={qrCode()}
        onChange={setQrCode}
        format={(v) =>
          v === 'none' ? 'None' : v === 'fundraiser' ? 'Your fundraiser' : 'Charity website'
        }
      />
      <fieldset class="flex flex-col gap-2">
        <legend class={`${fieldClass.label} mb-1`}>Header cards</legend>
        <For each={headerOptions}>
          {(h) => (
            <Checkbox
              label={headerLabels[h]}
              checked={selectedHeaders().includes(h)}
              onChange={(checked) => toggleHeader(h, checked)}
            />
          )}
        </For>
      </fieldset>
      <fieldset class="flex flex-col gap-2">
        <legend class={`${fieldClass.label} mb-1`}>Show</legend>
        <Checkbox
          label="Totals"
          checked={includeTotals2()}
          onChange={setIncludeTotals2}
        />
        <Checkbox
          label="Description"
          checked={showDesc()}
          onChange={setShowDesc}
        />
        <Checkbox label="URL" checked={showUrl()} onChange={setShowUrl} />
        <Checkbox
          label="Position dots"
          checked={showDots()}
          onChange={setShowDots}
        />
      </fieldset>
      <fieldset class="flex flex-col gap-1 sm:col-span-2">
        <legend class={`${fieldClass.label} mb-1`}>Charities</legend>
        <TileGroup class="flex max-h-60 flex-col gap-2 overflow-y-auto">
          <Show when={!q.isLoading} fallback={<Spinner label="Loading charities…" />}>
            <For each={charities()}>
              {(c) => (
                <Checkbox
                  label={c.name}
                  checked={selectedIds().includes(c.id)}
                  onChange={(checked) => toggleOne(c.id, checked)}
                />
              )}
            </For>
          </Show>
        </TileGroup>
        <p class={fieldClass.help}>Leave all unchecked to include every charity.</p>
      </fieldset>
    </ConfiguratorBody>
  )
}
