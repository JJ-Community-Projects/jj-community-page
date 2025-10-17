import { type Component, For, Show } from 'solid-js'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import '../../../overlay/marquee.css'
import { FundraiserTickerChild } from '../common/FundraiserTickerChild'
import { CauseHeader } from '../common/TickerHeaderVariants'

export type CauseFundraiserProps = {
  causeId?: number
  theme?: 'default' | 'red' | 'blue'
  speed?: number
  showRaised?: boolean
  currency?: 'GBP' | 'USD'
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

const Body: Component<CauseFundraiserProps> = (props) => {
  const showRaised = () => props.showRaised ?? true

  const causeId = () => (props.causeId ?? 0) | 0

  const causeQ = useQuery(() =>
    orpcPrivate.overlay.causeFundraisers.queryOptions({
      input: { causeId: causeId(), currency: props.currency ?? 'GBP' },
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

  const items = () => (causeId() ? (causeQ.data ?? []) : [])

  const displayItems = () => {
    const gap = 4
    const base = items()
    const newChildren = Array.from({ length: gap }, () => base).flat()

    const result: any[] = []
    const cause = causeInfoQ.data
    for (let i = 0; i < newChildren.length; i++) {
      const d = newChildren[i]
      if (i % gap === 0 && cause) {
        result.push(
          <CauseHeader
            theme={props.theme}
            logoUrl={cause.logoUrl}
            name={cause.name}
            raisedText={
              showRaised() && cause.raised != null
                ? `Raised £${cause.raisedFormatted}`
                : undefined
            }
          />,
        )
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

  return (
    <>
      <Show when={causeQ.data && causeInfoQ.data}>
        <div class="relative flex overflow-x-hidden">
          <div
            style={{
              animation: `marquee ${displayItems().length * 4}s linear infinite`,
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
              animation: `marquee2 ${displayItems().length * 4}s linear infinite`,
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
    </>
  )
}

export const FundraisersByCauseOverlay: Component<CauseFundraiserProps> = (
  props,
) => (
  <QueryClientProvider client={new QueryClient()}>
    <Body {...props} />
  </QueryClientProvider>
)

/*

    <Show when={causeQ.data && causeInfoQ.data}>
      <Ticker
        items={items().map((d) => (
          <FundraiserTickerChild
            item={d}
            theme={props.theme}
            showRaised={showRaised()}
          />
        ))}
        header={[
          <CauseHeader
            theme={props.theme}
            logoUrl={causeInfoQ.data!.logoUrl}
            name={causeInfoQ.data!.name}
            raisedText={
              showRaised() && causeInfoQ.data!.amountRaised != null
                ? `Raised £${formatAmount(causeInfoQ.data!.amountRaised)}`
                : undefined
            }
          />,
        ]}
      />
    </Show>
 */

/*

    <Switch>
      <Match when={causeQ.data}>
        <p class="text-black">
          duration:{duration()}, items:{items().length}, displayItems:{' '}
          {displayItems().length}
        </p>
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
 */
