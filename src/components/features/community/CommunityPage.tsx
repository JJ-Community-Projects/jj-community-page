import { type Component, Show } from 'solid-js'
import { createI18n, I18nProvider } from 'solid-i18n'
import { useLocale } from '@kobalte/core'
import { Countdown } from '../../common/ui/Countdown.tsx'
import { useIsBeforeJJ, useIsJJ, useJJStartCountdown, useNextJJStartDate, } from '../../../lib/utils/jjDates.ts'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { type CommunityInitialData, CommunityPageProvider, useCommunityPage, } from './CommunityPageProvider.tsx'
import { FaSolidHeart } from 'solid-icons/fa'
import { UpcomingStreams } from './UpcomingStreams.tsx'
import CommunityTagSearch from './CommunityTagSearch.tsx'
import { CommunityCampaignGrid } from './CommunityCampaignGrid.tsx'

export interface CommunityPageProps {
  initial?: CommunityInitialData
}

export const CommunityPage: Component<CommunityPageProps> = (props) => {
  const i18n = createI18n({ language: useLocale().locale() })
  return (
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider i18n={i18n}>
        <CommunityPageProvider initial={props.initial}>
          <_CommunityPage />
        </CommunityPageProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}

const _CommunityPage: Component = () => {
  const i18n = createI18n({ language: useLocale().locale() })

  const isJJ = useIsJJ()
  const isBefore = useIsBeforeJJ()

  const { community, cause, campaignsSorted } = useCommunityPage()

  return (
    <I18nProvider i18n={i18n}>
      <Show when={community.isSuccess}>
        <Show when={community.data!.list.length > 0}>
          <Body />
        </Show>
        <Show when={community.data!.list.length === 0}>
          <Show when={!isBefore()}>
            <p class={'text-center text-white'}>No Fundraisers found.</p>
          </Show>
          <Show when={isBefore()}>
            <p class={'text-center text-white'}>
              Check this site again once the Jingle Jam has officially started.
            </p>
          </Show>
          <Show when={!isJJ()}>
            <Countdown />
          </Show>
        </Show>
      </Show>
      <Show when={community.isLoading}>
        <p class={'text-center text-white'}>Loading…</p>
      </Show>
      <Show when={community.isError}>
        <p class={'text-center text-red-500'}>
          Failed to load community campaigns.
        </p>
      </Show>
    </I18nProvider>
  )
}

const Header: Component = () => {
  const nextJJStartDate = useNextJJStartDate()
  const jjStartCountdown = useJJStartCountdown()
  const isJJ = useIsJJ()
  return (
    <div class="rounded-xl border-2 bg-gradient-to-b from-neutral-50 to-neutral-100 p-2 shadow-md transition-all duration-300 hover:shadow-lg">
      <div class="flex w-full flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between md:p-2 lg:p-4">
        {/* Left: Title, icon, subtitle (left-aligned) */}
        <div class="flex flex-col items-center text-center md:items-start md:text-left">
          <div class="flex items-center gap-2">
            <FaSolidHeart class="h-8 w-8 text-neutral-600" />
            <h1 class="font-bold text-black ~text-2xl/4xl">Community</h1>
          </div>
          <h2 class={'font-semibold text-black'}>
            Fundraisers and upcoming streams
          </h2>
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

const Body: Component = () => {
  const { sortBy, campaignsSorted } = useCommunityPage()
  const isSortByCause = () => sortBy() === 'cause'
  return (
    <div class={'flex w-full flex-col items-stretch justify-center gap-4'}>
      <Header />
      <UpcomingStreams />
      <CommunityTagSearch />
      <CommunityCampaignGrid/>
    </div>
  )
}
/*

      <Show when={isSortByCause()} fallback={<CommunityCampaignGrid />}>
        <CommunityCampaignGridByCause />
      </Show>
* */
