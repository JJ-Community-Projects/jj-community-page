import { type Component, createMemo, For, Show } from 'solid-js'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import '../common/marquee.css'
import { FundraiserTickerChild } from '../common/FundraiserTickerChild'
import { JJLogo } from '../common/JJLogo.tsx'
import { TickerHeader } from '../common/TickerHeader.tsx'
import { JJLink } from '../common/JJLinkCard.tsx'
import { DEMO_TEAM_FUNDRAISERS } from '../../demoData.ts'

export type TeamFundraiserProps = {
  teamSlug?: string
  theme?: 'default' | 'red' | 'blue'
  showRaised?: boolean
  currency?: 'GBP' | 'USD' | 'EUR'
  user?: string
  demo?: boolean
}

const Body: Component<TeamFundraiserProps> = (props) => {
  const showRaised = () => props.showRaised ?? true

  const teamSlug = () => (props.teamSlug ?? '').trim()

  // When a team is selected, fetch team-specific fundraisers via new oRPC endpoint
  const teamQ = useQuery(() =>
    orpcPrivate.overlay.teamFundraisers.queryOptions({
      input: {
        teamSlug: teamSlug(),
        currency: props.currency ?? 'GBP',
        user: props.user,
      },
      staleTime: 60_000,
      refetchInterval: 60_000,
      refetchOnWindowFocus: false,
      enabled: Boolean(teamSlug()) && !props.demo,
      placeholderData: (prev) => prev,
    }),
  )

  // `demo` swaps the live query for static fixtures so the editor preview is
  // always populated (also covers the "All teams" empty-slug case).
  const data = () => (props.demo ? DEMO_TEAM_FUNDRAISERS : teamQ.data)

  const displayItems = () => {
    const gap = 4
    const result: any[] = []

    const d0 = data()
    const base = d0?.fundraisers ?? []
    const newChildren = Array.from({ length: gap * 3 }, () => base).flat()

    let hi = 0
    for (let i = 0; i < newChildren.length; i++) {
      const d = newChildren[i]
      if (d0) {
        if (i % gap === 0) {
          if (hi === 0) {
            result.push(
              <TickerHeader theme={props.theme} title={d0.teamName} />,
            )
          } else if (hi === 1) {
            result.push(
              <JJLink
                theme={props.theme}
                url={d0.userFundraiser?.url}
              />,
            )
          } else {
            result.push(<JJLogo theme={props.theme} />)
          }
          hi = (hi + 1) % 3
        }
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
    <Show when={data()}>
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

export const FundraisersByTeamOverlay: Component<TeamFundraiserProps> = (
  props,
) => (
  <QueryClientProvider client={new QueryClient()}>
    <Body {...props} />
  </QueryClientProvider>
)
