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
type Alignment = 'left' | 'right'

export const CampaignGoalConfigurator: Component = () => {
  const { user } = useUser()
  const [theme, setTheme] = createSignal<Style>('red')
  const [currency, setCurrency] = createSignal<Currency>('GBP')
  const [alignment, setAlignment] = createSignal<Alignment>('right')
  const [showChangeLabel, setShowChangeLabel] = createSignal<boolean>(true)

  const params = () => ({
    user: user?.tiltifySlug,
    theme: theme(),
    currency: currency(),
    alignment: alignment(),
    showChangeLabel: showChangeLabel(),
  })
  const url = createMemo(() => buildUrl('/overlays/campaign-goal', params()))
  const previewUrl = createMemo(() =>
    buildUrl('/overlays/campaign-goal', { debug: true, ...params() }),
  )

  return (
    <ConfiguratorBody
      description="Your campaign total and goal with a compact progress bar; it updates about every 30 seconds. Try different widths. The preview has controls to try amounts."
      format={OVERLAY_FORMATS['campaign-goal']}
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
        label="Alignment"
        showLabel
        options={['left', 'right'] as Alignment[]}
        value={alignment()}
        onChange={setAlignment}
        format={titleCase}
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
