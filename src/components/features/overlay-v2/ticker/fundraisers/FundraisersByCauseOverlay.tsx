import { type Component, For, Match, Show, Switch } from 'solid-js'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import '../../../overlay/marquee.css'

export type CauseFundraiserProps = {
  causeId?: number
  theme?: 'default' | 'red' | 'blue'
  speed?: number
  showRaised?: boolean
}

type FundraiserItem = {
  id: string
  title: string
  creatorName: string
  amountRaised: number
  goal?: number
  currency?: string
  imageUrl?: string
  urlSlug?: string
}

const bgByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
      return 'bg-primary'
    case 'blue':
      return 'bg-accent'
    default:
      return 'bg-white'
  }
}
const causeBgByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
      return 'bg-white'
    case 'blue':
      return 'bg-white'
    default:
      return 'bg-primary'
  }
}

const nameColorByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
    case 'blue':
      return 'text-white'
    default:
      return 'text-accent'
  }
}

const causeNameColorByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
    case 'blue':
      return 'text-accent'
    default:
      return 'text-white'
  }
}

const raisedColorByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
    case 'blue':
      return 'text-white'
    default:
      return 'text-primary'
  }
}
const causeRaisedColorByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
    case 'blue':
      return 'text-primary'
    default:
      return 'text-white'
  }
}

const Child: Component<{
  item: FundraiserItem
  theme?: string
  showRaised: boolean
}> = (p) => {
  return (
    <div
      class={`h-full w-full rounded-2xl ${bgByTheme(p.theme)} p-2 shadow-2xl`}
    >
      <div class={'flex h-full w-full flex-row items-center justify-start'}>
        <Show when={p.item.imageUrl}>
          {(url) => (
            <img
              class={'h-12 w-12 rounded-lg'}
              alt={''}
              src={url()}
              loading={'eager'}
            />
          )}
        </Show>
        <div
          class={
            'flex h-full flex-1 flex-col items-start justify-center overflow-hidden truncate pl-2'
          }
        >
          <p class={`${nameColorByTheme(p.theme)} font-bold`}>{p.item.title}</p>
          <Show when={p.showRaised}>
            <p class={`${raisedColorByTheme(p.theme)} font-bold`}>
              Raised £{formatAmount(p.item.amountRaised)}
            </p>
          </Show>
        </div>
      </div>
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

type CauseItem = {
  id: number
  name: string
  description?: string
  logoUrl?: string
  websiteUrl?: string
  amountRaised?: number
  currency?: string
}

const CauseCard: Component<{
  cause: CauseItem
  theme?: string
  showRaised: boolean
}> = (p) => {
  const value = () => p.cause.amountRaised ?? 0
  return (
    <div
      class={`h-full w-full rounded-2xl ${causeBgByTheme(p.theme)} p-2 shadow-2xl`}
    >
      <div class={'flex h-full w-full flex-row items-center justify-start'}>
        <Show when={p.cause.logoUrl}>
          {(url) => (
            <img
              class={'h-12 w-12 rounded-lg'}
              alt={''}
              src={url()}
              loading={'eager'}
            />
          )}
        </Show>
        <div
          class={
            'flex h-full flex-1 flex-col items-start justify-center overflow-hidden truncate pl-2'
          }
        >
          <p class={`${causeNameColorByTheme(p.theme)} font-bold`}>
            {p.cause.name}
          </p>
          <Show when={p.showRaised && p.cause.amountRaised != null}>
            <p class={`${causeRaisedColorByTheme(p.theme)} font-bold`}>
              Raised £{formatAmount(value())}
            </p>
          </Show>
        </div>
      </div>
    </div>
  )
}

const Body: Component<CauseFundraiserProps> = (props) => {
  const speed = () => Math.max(1, Math.floor(props.speed ?? 8))
  const showRaised = () => props.showRaised ?? true

  const causeId = () => (props.causeId ?? 0) | 0

  const causeQ = useQuery(() =>
    orpcPrivate.overlay.causeFundraisers.queryOptions({
      input: { causeId: causeId() },
      staleTime: 30_000,
      refetchInterval: 30_000,
      refetchOnWindowFocus: false,
      enabled: Boolean(causeId()),
      placeholderData: (prev) => prev,
    }),
  )

  // Load cause info for header card
  const causeInfoQ = useQuery(() =>
    orpcPrivate.overlay.causeById.queryOptions({
      input: { causeId: causeId(), includeTotals: showRaised() },
      staleTime: 60_000,
      refetchInterval: 60_000,
      refetchOnWindowFocus: false,
      enabled: Boolean(causeId()),
      placeholderData: (prev) => prev,
    }),
  )

  // Fallback: fetch global fundraisers when no cause selected
  const allQ = useQuery(() =>
    orpcPrivate.overlay.fundraisers.queryOptions({
      input: { orderBy: 'top', pageSize: 200 },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      enabled: !Boolean(causeId()),
      placeholderData: (prev) => prev,
    }),
  )

  const items = () =>
    (causeId() ? (causeQ.data ?? []) : (allQ.data ?? [])) as FundraiserItem[]

  // Build interwoven marquee items similar to CharitiesOverlay: return bare nodes, wrapper is applied in the marquee render
  const displayItems = () => {
    const base = items()
    const result: any[] = []
    const cause = causeInfoQ.data
    for (let i = 0; i < base.length; i++) {
      const d = base[i]
      // After every 3 fundraisers, interleave the CauseCard if available
      if (i % 3 === 0 && cause) {
        result.push(
          <CauseCard
            cause={cause}
            theme={props.theme}
            showRaised={showRaised()}
          />,
        )
      }
      result.push(
        <Child item={d} theme={props.theme} showRaised={showRaised()} />,
      )
    }
    return result
  }

  return (
    <Switch>
      <Match when={causeQ.data}>
        <p>{}</p>
        <div class="relative flex overflow-x-hidden">
          <div
            style={{
              animation: `marquee ${(props.speed ?? 4) * (items().length * 2)}s linear infinite`,
            }}
            class="flex flex-row whitespace-nowrap"
          >
            <For each={displayItems()}>
              {(d) => (
                <div class="inline-block h-[80px] w-[256px] items-center justify-center px-2 py-1">
                  {d}
                </div>
              )}
            </For>
          </div>
          <div
            style={{
              animation: `marquee2 ${(props.speed ?? 4) * (items().length * 2)}s linear infinite`,
            }}
            class="absolute top-0 flex flex-row whitespace-nowrap"
          >
            <For each={displayItems()}>
              {(d) => (
                <div class="inline-block h-[80px] w-[256px] items-center justify-center px-2 py-1">
                  {d}
                </div>
              )}
            </For>
          </div>
        </div>
      </Match>
    </Switch>
  )
}

export const FundraisersByCauseOverlay: Component<CauseFundraiserProps> = (
  props,
) => (
  <QueryClientProvider client={new QueryClient()}>
    <Body {...props} />
  </QueryClientProvider>
)
