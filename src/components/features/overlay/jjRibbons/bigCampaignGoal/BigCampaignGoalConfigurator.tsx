import { type Component, createMemo, createSignal } from 'solid-js'
import {
  buildUrl,
  ConfiguratorBody,
  type Currency,
  CurrencySelect,
  titleCase,
} from '../../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../../overview/formats.ts'
import { useUser } from '../../../users/user-dashboard/providers/UserProvider.tsx'
import { Checkbox } from '../../../../ui/Form'
import { Select } from '../../../../ui/Select'
import { Alert } from '../../../../ui/Status'

type Style = 'red' | 'blue' | 'black'
type Alignment = 'top' | 'bottom'

export const BigCampaignGoalConfigurator: Component = () => {
  const { user } = useUser()
  const [theme, setTheme] = createSignal<Style>('red')
  const [currency, setCurrency] = createSignal<Currency>('GBP')
  const [alignment, setAlignment] = createSignal<Alignment>('bottom')
  const [showChangeLabel, setShowChangeLabel] = createSignal<boolean>(true)

  const params = () => ({
    user: user?.tiltifySlug,
    theme: theme(),
    currency: currency(),
    alignment: alignment(),
    showChangeLabel: showChangeLabel(),
  })
  const url = createMemo(() =>
    buildUrl('/overlays/big-campaign-goal', params()),
  )
  const previewUrl = createMemo(() =>
    buildUrl('/overlays/big-campaign-goal', { debug: true, ...params() }),
  )

  return (
    <ConfiguratorBody
      description="Your campaign total and goal on large ribbons, with the progress bar above or below them; it updates about every 30 seconds. The preview has controls to try amounts."
      format={OVERLAY_FORMATS['big-campaign-goal']}
      previewUrl={previewUrl()}
      linkUrl={user?.tiltifySlug ? url() : undefined}
      noLink={
        <Alert tone="info">
          The link needs your Tiltify fundraiser; your account has none.
        </Alert>
      }
    >
      <Select
        label="Theme"
        showLabel
        options={['red', 'blue', 'black'] as Style[]}
        value={theme()}
        onChange={setTheme}
        format={titleCase}
      />
      <CurrencySelect value={currency()} onChange={setCurrency} />
      <Select
        label="Progress bar"
        showLabel
        options={['top', 'bottom'] as Alignment[]}
        value={alignment()}
        onChange={setAlignment}
        format={(v) => (v === 'top' ? 'Above' : 'Below')}
      />
      <Checkbox
        label="Show raised change"
        checked={showChangeLabel()}
        onChange={setShowChangeLabel}
        class="self-end"
      />
    </ConfiguratorBody>
  )
}
