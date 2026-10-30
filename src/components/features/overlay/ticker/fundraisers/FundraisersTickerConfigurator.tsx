import { type Component, createMemo, createSignal } from 'solid-js'
import {
  buildUrl,
  ConfiguratorBody,
  type Currency,
  CurrencySelect,
  PreviewDataField,
  type PreviewDataMode,
} from '../../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../../overview/formats.ts'
import { useUser } from '../../../users/user-dashboard/providers/UserProvider.tsx'
import { Select } from '../../../../ui/Select'

type OrderBy = 'recent' | 'top' | 'alphabetical'

const orderLabels: Record<OrderBy, string> = {
  recent: 'Most recent',
  top: 'Top raised',
  alphabetical: 'A to Z',
}

export const FundraisersTickerConfigurator: Component = () => {
  const [orderBy, setOrderBy] = createSignal<OrderBy>('recent')
  const [currency, setCurrency] = createSignal<Currency>('GBP')
  const [previewData, setPreviewData] = createSignal<PreviewDataMode>('test')

  const { user } = useUser()

  const fundraisersUrl = createMemo(() =>
    buildUrl('/overlays/fundraisers', {
      orderBy: orderBy(),
      currency: currency(),
      user: user?.tiltifySlug,
    }),
  )

  // Preview requests demo fixtures by default so the ticker is populated even
  // when no live data is available; the OBS URL never includes `demo`.
  const previewUrl = createMemo(() =>
    buildUrl('/overlays/fundraisers', {
      orderBy: orderBy(),
      currency: currency(),
      user: user?.tiltifySlug,
      demo: previewData() === 'test',
    }),
  )

  return (
    <ConfiguratorBody
      description="A horizontal scrolling ticker of the community fundraisers."
      format={OVERLAY_FORMATS.fundraisers}
      previewUrl={previewUrl()}
      linkUrl={fundraisersUrl()}
    >
      <PreviewDataField value={previewData()} onChange={setPreviewData} />
      <Select
        label="Order"
        showLabel
        options={['recent', 'top', 'alphabetical'] as OrderBy[]}
        value={orderBy()}
        onChange={setOrderBy}
        format={(v) => orderLabels[v]}
      />
      <CurrencySelect value={currency()} onChange={setCurrency} />
    </ConfiguratorBody>
  )
}
