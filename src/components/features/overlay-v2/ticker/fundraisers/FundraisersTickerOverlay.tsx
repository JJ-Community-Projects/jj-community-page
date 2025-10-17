import { type Component, For, Show } from 'solid-js'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'

export type FundraisersOrder = 'recent' | 'top' | 'alphabetical'

type Props = {
  orderBy?: FundraisersOrder
  pageSize?: number
  currency?: 'GBP' | 'USD'
}


const Body: Component<Props> = (props) => {
  const pageSize = () => clamp(Math.floor(props.pageSize ?? 25), 1, 200)
  const orderBy = () => props.orderBy ?? 'recent'

  const q = useQuery(() =>
    orpcPrivate.overlay.fundraisers.queryOptions({
      input: { orderBy: orderBy(), pageSize: pageSize(), currency: props.currency ?? 'GBP' },
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }),
  )

  const items = () => q.data ?? []

  return (
    <div class="p-2">
      <Show when={q.isLoading}>
        <p class="opacity-80">Loading campaigns…</p>
      </Show>
      <Show when={q.error}>
        <p class="text-red-400">
          {q.error?.message ?? 'Failed to load campaigns'}
        </p>
      </Show>
      <Show when={items().length === 0 && !q.isLoading}>
        <p class="opacity-70">No fundraisers found.</p>
      </Show>
      {/* NOTE: For consistency with marquee tickers, individual list cards could reuse
          FundraiserTickerChild from src/components/features/overlay-v2/ticker/common/FundraiserTickerChild.tsx.
          This overlay is a vertical list (not marquee), so you could either use the child inside an <li> or
          adapt it into a non-marquee card. */}
      <ul class="flex flex-col gap-2 overflow-hidden">
        <For each={items()}>
          {(f) => (
            <li class="rounded bg-black/30 px-3 py-2">
              <div class="flex items-center gap-3">
                <Show when={f.imageUrl}>
                  {(url) => (
                    <img
                      src={url()}
                      alt="avatar"
                      class="h-8 w-8 rounded"
                      loading="lazy"
                    />
                  )}
                </Show>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold">{f.title}</p>
                  <p class="truncate text-xs opacity-80">by {f.creatorName}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold">£{formatAmount(f.amountRaised)}</p>
                  <Show when={f.goal}>
                    {(g) => (
                      <p class="text-xs opacity-80">of £{formatAmount(g())}</p>
                    )}
                  </Show>
                </div>
              </div>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}

function formatAmount(n: number) {
  try {
    return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(
      n,
    )
  } catch {
    return String(n)
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export const FundraisersTickerOverlay: Component<Props> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Body {...props} />
    </QueryClientProvider>
  )
}
