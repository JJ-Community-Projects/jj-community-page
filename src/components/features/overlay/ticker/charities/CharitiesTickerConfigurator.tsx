import { type Component, createMemo, createSignal } from 'solid-js'
import {
  buildUrl,
  FieldRow,
  LinkPreview,
  PreviewFrame,
} from '../../overview/Common.tsx'
import { useUser } from '../../../users/user-dashboard/providers/UserProvider.tsx'

export const CharitiesTickerConfigurator: Component<{ visible?: boolean }> = (
  p,
) => {
  const [theme, setTheme] = createSignal<string>('default')
  const [currency, setCurrency] = createSignal<'GBP' | 'USD'>('GBP')

  const { user } = useUser()

  const charitiesUrl = createMemo(() =>
    buildUrl('/overlays-v2/charities', {
      theme: theme(),
      currency: currency(),
      user: user.tiltifyName,
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <FieldRow label="Theme">
        <select
          value={theme()}
          onChange={(e) => setTheme(e.currentTarget.value)}
          class="w-40 rounded bg-black/40 px-2 py-1"
        >
          <option value="default">Default</option>
          <option value="red">Red</option>
          <option value="blue">Blue</option>
        </select>
      </FieldRow>
      <FieldRow label="Currency">
        <select
          value={currency()}
          onChange={(e) => setCurrency(e.currentTarget.value as 'GBP' | 'USD')}
          class="w-40 rounded bg-black/40 px-2 py-1"
        >
          <option value="GBP">GBP</option>
          <option value="USD">USD</option>
        </select>
      </FieldRow>
      <LinkPreview url={charitiesUrl()} />
      <PreviewFrame url={charitiesUrl()} visible={p.visible} />
    </div>
  )
}
