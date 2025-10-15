import { type Component, For, Show } from 'solid-js'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import '../../../overlay/marquee.css'

// Props for the Team Fundraiser overlay
// - teamSlug: optional selected team to scope/label the list (future backend filtering)
// - theme: color theme (default | pink | red | blue)
// - speed: marquee speed multiplier (default 8)
// - showRaised: show amount raised (default true)
export type TeamFundraiserProps = {
  teamSlug?: string
  theme?: 'default'  | 'red' | 'blue'
  speed?: number
  showRaised?: boolean
}

// Internal item shape (re-using private overlay fundraisers output)
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

const nameColorByTheme = (theme: string | undefined) => {
  switch (theme) {

    case 'red':
    case 'blue':
      return 'text-white'
    default:
      return 'text-accent'
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

const Child: Component<{ item: FundraiserItem; theme?: string; showRaised: boolean }> = (p) => {
  return (
    <div class={`h-full w-full rounded-2xl ${bgByTheme(p.theme)} p-2 shadow-2xl`}>
      <div class={'flex h-full w-full flex-row items-center justify-start'}>
        <Show when={p.item.imageUrl}>
          {(url) => (
            <img class={'h-12 w-12 rounded-lg'} alt={''} src={url()} loading={'eager'} />
          )}
        </Show>
        <div class={'flex h-full flex-1 flex-col items-start justify-center overflow-hidden truncate pl-2 '}>
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
    return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(n)
  } catch {
    return String(n)
  }
}

const Body: Component<TeamFundraiserProps> = (props) => {
  const speed = () => Math.max(1, Math.floor(props.speed ?? 8))
  const showRaised = () => props.showRaised ?? true

  const teamSlug = () => (props.teamSlug ?? '').trim()

  // When a team is selected, fetch team-specific fundraisers via new oRPC endpoint
  const teamQ = useQuery(() =>
    orpcPrivate.overlay.teamFundraisers.queryOptions({
      input: { teamSlug: teamSlug() },
      staleTime: 30_000,
      refetchInterval: 30_000,
      refetchOnWindowFocus: false,
      enabled: Boolean(teamSlug()),
      placeholderData: (prev) => prev,
    }),
  )

  // Fallback: fetch global fundraisers when no team selected
  const allQ = useQuery(() =>
    orpcPrivate.overlay.fundraisers.queryOptions({
      input: { orderBy: 'top', pageSize: 200 },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      enabled: !Boolean(teamSlug()),
      placeholderData: (prev) => prev,
    }),
  )

  const items = () => (teamSlug() ? (teamQ.data ?? []) : (allQ.data ?? [])) as FundraiserItem[]

  return (
    <div class="relative flex overflow-x-hidden">
      <Show when={teamSlug() ? teamQ.isLoading : allQ.isLoading}>
        <p class="px-2 opacity-70">Loading team campaigns…</p>
      </Show>
      <div
        style={{
          animation: `marquee ${speed() * Math.max(1, items().length * 2)}s linear infinite`,
        }}
        class="flex flex-row whitespace-nowrap"
      >
        <For each={items()}>
          {(d) => (
            <div class="inline-block h-[80px] w-[256px] items-center justify-center px-2 py-1">
              <Child item={d} theme={props.theme} showRaised={showRaised()} />
            </div>
          )}
        </For>
      </div>
      <div
        style={{
          animation: `marquee2 ${speed() * Math.max(1, items().length * 2)}s linear infinite`,
        }}
        class="absolute top-0 flex flex-row whitespace-nowrap"
      >
        <For each={items()}>
          {(d) => (
            <div class="inline-block h-[80px] w-[256px] items-center justify-center px-2 py-1">
              <Child item={d} theme={props.theme} showRaised={showRaised()} />
            </div>
          )}
        </For>
      </div>
    </div>
  )
}

export const FundraisersByTeamOverlay: Component<TeamFundraiserProps> = (props) => (
  <QueryClientProvider client={new QueryClient()}>
    <Body {...props} />
  </QueryClientProvider>
)
