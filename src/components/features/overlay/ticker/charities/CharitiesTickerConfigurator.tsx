import { type Component, createMemo, createSignal } from 'solid-js'
import {
  buildUrl,
  ConfiguratorBody,
  type Currency,
  CurrencySelect,
  PreviewDataField,
  type PreviewDataMode,
  titleCase,
} from '../../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../../overview/formats.ts'
import { useUser } from '../../../users/user-dashboard/providers/UserProvider.tsx'
import { Select } from '../../../../ui/Select'

type Theme = 'default' | 'red' | 'blue'

export const CharitiesTickerConfigurator: Component = () => {
  const [theme, setTheme] = createSignal<Theme>('default')
  const [currency, setCurrency] = createSignal<Currency>('GBP')
  const [previewData, setPreviewData] = createSignal<PreviewDataMode>('test')

  const { user } = useUser()

  const charitiesUrl = createMemo(() =>
    buildUrl('/overlays/charities', {
      theme: theme(),
      currency: currency(),
      user: user?.tiltifySlug,
    }),
  )

  // Preview requests demo fixtures by default so the ticker is populated even
  // when no live data is available; the OBS URL never includes `demo`.
  const previewUrl = createMemo(() =>
    buildUrl('/overlays/charities', {
      theme: theme(),
      currency: currency(),
      user: user?.tiltifySlug,
      demo: previewData() === 'test',
    }),
  )

  return (
    <ConfiguratorBody
      description="A horizontal scrolling ticker that cycles through the charities."
      format={OVERLAY_FORMATS.charities}
      previewUrl={previewUrl()}
      linkUrl={charitiesUrl()}
    >
      <PreviewDataField value={previewData()} onChange={setPreviewData} />
      <Select
        label="Theme"
        showLabel
        options={['default', 'red', 'blue'] as Theme[]}
        value={theme()}
        onChange={setTheme}
        format={titleCase}
      />
      <CurrencySelect value={currency()} onChange={setCurrency} />
    </ConfiguratorBody>
  )
}
