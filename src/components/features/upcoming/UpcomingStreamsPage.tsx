import { type Component, createSignal, For, Show } from 'solid-js'
import {
  useIsJJ,
  useJJStartCountdown,
  useNextJJStartDate,
} from '../../../lib/utils/jjDates.ts'
import { FaSolidCalendarWeek } from 'solid-icons/fa'
import type { CharitiesStatic } from '../../../content/schema.ts'
import { createI18n, I18nProvider } from 'solid-i18n'
import { useLocale } from '@kobalte/core'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { orpcPrivate } from '../../../lib/orpc/client.ts'
import { UpcomingStreamsStreamCard } from '../schedules/common/StreamCard.tsx'
import {
  CommunityCharitiesOverview,
  CommunityCharitiesOverviewMobile,
} from '../../common/charityOverview/CommunityCharitiesOverview.tsx'
import { CharityOverviewProvider } from '../../common/charityOverview/CharityOverviewProvider.tsx'
import { CurrencyProvider } from '../../common/CurrencyProvider.tsx'

const Header: Component = () => {
  const nextJJStartDate = useNextJJStartDate()
  const jjStartCountdown = useJJStartCountdown()
  const isJJ = useIsJJ()
  return (
    <div class="rounded-xl border-2 bg-gradient-to-b from-neutral-50 to-neutral-100 p-2 shadow-md transition-all duration-300 hover:shadow-lg">
      <div class="flex w-full flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
        {/* Left: Title, icon, subtitle (left-aligned) */}
        <div class="flex flex-col items-center text-center md:items-start md:text-left">
          <div class="flex items-center gap-2">
            <FaSolidCalendarWeek class="h-8 w-8 text-neutral-600" />
            <h1 class="font-bold text-black ~text-2xl/4xl">Upcoming Streams</h1>
          </div>
        </div>

        {/* Right: Countdown (right-aligned, moves below on small screens) */}
        <Show when={!isJJ()}>
          <div class="flex flex-col items-center text-center md:items-end md:text-right">
            <p class={'text-lg font-semibold'}>
              Jingle Jam {nextJJStartDate().year} starts in
            </p>
            <p class={'font-mono text-xl tabular-nums tracking-tight'}>
              {jjStartCountdown().toFormat("dd'd' hh'h' mm'm' ss's'")}
            </p>
          </div>
        </Show>
      </div>
    </div>
  )
}

export const UpcomingStreamsPage: Component<{
  charitiesData?: CharitiesStatic
}> = (props) => {
  const i18n = createI18n({ language: useLocale().locale() })
  return (
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider i18n={i18n}>
        <CurrencyProvider>
          <CharityOverviewProvider charitiesData={props.charitiesData}>
            <Body />
          </CharityOverviewProvider>
        </CurrencyProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}
const Body: Component = () => {
  return (
    <div class={'flex w-full flex-col items-stretch justify-center gap-6'}>
      <Header />
      <div class={'flex w-full flex-row items-start justify-start gap-6'}>
        <div class={'hidden lg:block'}>
          <CommunityCharitiesOverview />
        </div>
        <div class={'flex flex-1 flex-col items-start justify-center gap-6'}>
          <UpcomingStreams />
        </div>
      </div>
      <div class={'block w-full lg:hidden'}>
        <CommunityCharitiesOverviewMobile />
      </div>
    </div>
  )
}

const UpcomingStreams: Component = () => {
  const upcomingStreams = useQuery(() =>
    orpcPrivate.jj.upcomingStreams.queryOptions({
      staleTime: 60_000 * 8,
      refetchInterval: 60_000 * 10,
    }),
  )
  const [showAll, setShowAll] = createSignal(false)

  const items = () => upcomingStreams.data?.streams ?? []
  const firstFour = () => items().slice(0, 12)
  const remainingCount = () => Math.max(items().length - 12, 0)
  const visibleItems = () => (showAll() ? items() : firstFour())

  return (
    <div class="flex w-full flex-col gap-2">
      <Show when={upcomingStreams.isLoading}>
        <p class="text-white/80">Loading upcoming streams…</p>
      </Show>
      <Show when={upcomingStreams.isError}>
        <p class="text-red-400">Failed to load upcoming streams.</p>
      </Show>
      <Show when={upcomingStreams.isSuccess && items().length > 0}>
        <div class="grid w-full grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] gap-2">
          <For each={visibleItems()}>
            {(item) => {
              const { stream, owner } = item
              return <UpcomingStreamsStreamCard stream={stream} user={owner} />
            }}
          </For>
        </div>
        <Show when={remainingCount() > 0}>
          <div class="mt-3 flex justify-center">
            <button
              class="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll() ? 'Show less' : `Show ${remainingCount()} more`}
            </button>
          </div>
        </Show>
      </Show>
    </div>
  )
}
