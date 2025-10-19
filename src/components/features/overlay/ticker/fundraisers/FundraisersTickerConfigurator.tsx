import { type Component, createMemo, createSignal } from 'solid-js'
import { buildUrl, FieldRow, LinkPreview, PreviewFrame, } from '../../overview/Common.tsx'
import { useUser } from '../../../users/user-dashboard/providers/UserProvider.tsx'

type OrderBy = 'recent' | 'top' | 'alphabetical'

export const FundraisersTickerConfigurator: Component<{
  visible?: boolean
}> = (p) => {
  const [orderBy, setOrderBy] = createSignal<OrderBy>('recent')
  const [currency, setCurrency] = createSignal<'GBP' | 'USD'>('GBP')

  const { user } = useUser()

  const fundraisersUrl = createMemo(() =>
    buildUrl('/overlays/fundraisers', {
      orderBy: orderBy(),
      currency: currency(),
      user: user.tiltifyName,
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <div class="mb-2 rounded border border-white/10 bg-white/5 p-2 text-sm text-white/80">
        A horizontal scrolling ticker of community fundraisers. Sort by recent, top, or alphabetical and pick a currency. Set your OBS Browser Source to 1920x80 px.
      </div>
      <FieldRow label="Order By">
        <select
          class="rounded bg-black/40 px-2 py-1"
          value={orderBy()}
          onChange={(e) => setOrderBy(e.currentTarget.value as OrderBy)}
        >
          <option value="recent">recent</option>
          <option value="top">top</option>
          <option value="alphabetical">alphabetical</option>
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
      <LinkPreview url={fundraisersUrl()} />
      <PreviewFrame url={fundraisersUrl()} visible={p.visible} />
    </div>
  )
}
