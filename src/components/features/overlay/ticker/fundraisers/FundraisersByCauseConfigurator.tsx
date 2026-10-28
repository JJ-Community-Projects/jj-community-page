import { type Component, createMemo, createSignal } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import {
  buildUrl,
  ConfiguratorBody,
  type Currency,
  CurrencySelect,
  NO_CHOICE,
  PreviewDataField,
  type PreviewDataMode,
  titleCase,
} from '../../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../../overview/formats.ts'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { Checkbox } from '../../../../ui/Form'
import { Select } from '../../../../ui/Select'

type Theme = 'default' | 'red' | 'blue'

export const FundraisersByCauseConfigurator: Component = () => {
  const [theme, setTheme] = createSignal<Theme>('default')
  const [showRaised, setShowRaised] = createSignal<boolean>(true)
  const [causeId, setCauseId] = createSignal<string>('')
  const [currency, setCurrency] = createSignal<Currency>('GBP')
  const [previewData, setPreviewData] = createSignal<PreviewDataMode>('test')

  // Load causes to populate selector
  const causesQ = useQuery(() =>
    orpcPrivate.overlay.charities.queryOptions({
      input: { includeTotals: false, pageSize: 200 },
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }),
  )

  const causes = () => causesQ.data?.charities ?? []
  const causeName = (id: string) =>
    causes().find((c) => c.id === id)?.name ?? 'Choose a cause'

  const url = createMemo(() =>
    buildUrl('/overlays/cause-fundraiser', {
      cause: causeId() || undefined,
      theme: theme(),
      showraised: showRaised(),
      currency: currency(),
    }),
  )

  // Preview requests demo fixtures by default so the ticker is populated even
  // when no cause/live data is available; the OBS URL never includes `demo`.
  const previewUrl = createMemo(() =>
    buildUrl('/overlays/cause-fundraiser', {
      cause: causeId() || undefined,
      theme: theme(),
      showraised: showRaised(),
      currency: currency(),
      demo: previewData() === 'test',
    }),
  )

  return (
    <ConfiguratorBody
      description="A horizontal scrolling ticker of the fundraisers raising for one charity."
      format={OVERLAY_FORMATS['cause-fundraiser']}
      previewUrl={previewUrl()}
      linkUrl={url()}
    >
      <PreviewDataField value={previewData()} onChange={setPreviewData} />
      <Select
        label="Charity"
        showLabel
        options={[NO_CHOICE, ...causes().map((c) => c.id)]}
        value={causeId() || NO_CHOICE}
        onChange={(v) => setCauseId(v === NO_CHOICE ? '' : v)}
        format={causeName}
      />
      <Select
        label="Theme"
        showLabel
        options={['default', 'red', 'blue'] as Theme[]}
        value={theme()}
        onChange={setTheme}
        format={titleCase}
      />
      <CurrencySelect value={currency()} onChange={setCurrency} />
      <Checkbox
        label="Show raised amounts"
        checked={showRaised()}
        onChange={setShowRaised}
        class="self-end"
      />
    </ConfiguratorBody>
  )
}
