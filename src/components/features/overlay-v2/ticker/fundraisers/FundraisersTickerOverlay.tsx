import { type Component, createMemo, For, Show } from 'solid-js'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import '../common/marquee.css'
import { FundraiserTickerChild } from '../common/FundraiserTickerChild'
import { JJLogo } from '../common/JJLogo.tsx'
import { JJLink } from '../common/JJLinkCard.tsx'

export type FundraisersOrder = 'recent' | 'top' | 'alphabetical'

type Props = {
  orderBy?: FundraisersOrder
  pageSize?: number
  currency?: 'GBP' | 'USD'
  theme?: 'default' | 'red' | 'blue'
  showRaised?: boolean
  user?: string
}

const Body: Component<Props> = (props) => {
  const pageSize = () => clamp(Math.floor(props.pageSize ?? 25), 1, 200)
  const orderBy = () => props.orderBy ?? 'recent'
  const showRaised = () => props.showRaised ?? true

  const q = useQuery(() =>
    orpcPrivate.overlay.fundraisers.queryOptions({
      input: {
        orderBy: orderBy(),
        pageSize: pageSize(),
        currency: props.currency ?? 'GBP',
        user: props.user,
      },
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }),
  )

  const items = () => q.data?.fundraisers ?? []

  const displayItems = () => {
    const gap = 4
    const result: any[] = []

    const base = items()
    const newChildren = Array.from({ length: gap * 2 }, () => base).flat()

    let hi = 0
    for (let i = 0; i < newChildren.length; i++) {
      const d = newChildren[i]
      if (i % gap === 0) {
        if (hi === 0) {
          result.push(<JJLink theme={props.theme} url={q.data?.userFundraiser?.url} />)
        } else {
          result.push(<JJLogo theme={props.theme} />)
        }
        hi = (hi + 1) % 2
      }
      result.push(
        <FundraiserTickerChild
          item={d}
          theme={props.theme}
          showRaised={showRaised()}
        />,
      )
    }
    return result
  }

  const speed = createMemo(() => displayItems().length * 4)

  return (
    <Show when={q.data}>
      <div class="relative flex overflow-x-hidden">
        <div
          style={{
            animation: `marquee ${speed()}s linear infinite`,
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
            animation: `marquee2 ${speed()}s linear infinite`,
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
    </Show>
  )
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
