import { type Component, createMemo, createSignal, For } from 'solid-js'
import { buildUrl, FieldRow, LinkPreview, PreviewFrame, } from '../../overview/Common.tsx'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { useQuery } from '@tanstack/solid-query'

export const FundraisersByCauseConfigurator: Component<{
  visible?: boolean
}> = (p) => {
  const [theme, setTheme] = createSignal<'default' | 'red' | 'blue'>('default')
  const [showRaised, setShowRaised] = createSignal<boolean>(true)
  const [causeId, setCauseId] = createSignal<number | ''>('')
  const [currency, setCurrency] = createSignal<'GBP' | 'USD'>('GBP')

  // Load causes to populate selector
  const causesQ = useQuery(() =>
    orpcPrivate.overlay.charities.queryOptions({
      input: { includeTotals: false, pageSize: 200 },
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }),
  )

  const causes = () => causesQ.data?.charities ?? []

  const url = createMemo(() =>
    buildUrl('/overlays/cause-fundraiser', {
      cause: causeId() || undefined,
      theme: theme(),
      showraised: showRaised(),
      currency: currency(),
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <FieldRow label="Cause">
        <select
          class="w-80 rounded bg-black/40 px-2 py-1"
          value={String(causeId())}
          onChange={(e) => {
            const v = e.currentTarget.value
            setCauseId(v ? Number(v) : '')
          }}
        >
          <option value="">Select a causes</option>
          <For each={causes()}>
            {(c: any) => <option value={c.id}>{c.name}</option>}
          </For>
        </select>
      </FieldRow>
      <FieldRow label="Theme">
        <select
          value={theme()}
          onChange={(e) => setTheme(e.currentTarget.value as any)}
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
      <FieldRow label="Show Raised">
        <input
          type="checkbox"
          checked={showRaised()}
          onChange={(e) => setShowRaised(e.currentTarget.checked)}
        />
      </FieldRow>
      <LinkPreview url={url()} />
      <PreviewFrame url={url()} visible={p.visible} />
    </div>
  )
}
