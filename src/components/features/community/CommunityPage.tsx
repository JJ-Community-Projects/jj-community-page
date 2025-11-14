import { type Component, For, Show } from 'solid-js'
import type { JJCampaignType } from '../../../lib/orpc/private/jjData/contract.ts'
import { twMerge } from 'tailwind-merge'
import { createI18n, I18nProvider } from 'solid-i18n'
import { useLocale } from '@kobalte/core'
import { Countdown } from '../../common/ui/Countdown.tsx'
import { useIsBeforeJJ, useIsJJ, useJJStartCountdown, useNextJJStartDate, } from '../../../lib/utils/jjDates.ts'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { RadioGroup } from '@kobalte/core/radio-group'
import { CommunityPageProvider, useCommunityPage, } from './CommunityPageProvider.tsx'
import { FaSolidHeart } from 'solid-icons/fa'
import { UpcomingStreams } from './UpcomingStreams.tsx'
import { CommunityItem } from './CommunityItem.tsx'
import { CommunityCauseCard } from './CommunityCauseCard.tsx'
import { CommunityUsers } from './CommunityUsers.tsx'
import { CommunityTagSearch } from './CommunityTagSearch.tsx'

export const CommunityPage: Component = () => {
  const i18n = createI18n({ language: useLocale().locale() })
  return (
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider i18n={i18n}>
        <CommunityPageProvider>
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

const SortSelection: Component = () => {
  const { setSortBy, sortBy } = useCommunityPage()

  return (
    <div class={twMerge('flex items-center justify-between')}>
      <RadioGroup
        value={sortBy()}
        onChange={setSortBy}
        class={twMerge('flex flex-col items-end gap-1')}
      >
        <RadioGroup.Label
          class={twMerge(
            'text-xxs font-semibold uppercase tracking-wide text-white',
          )}
        >
          Sort by
        </RadioGroup.Label>
        <div
          class={twMerge(
            'inline-flex w-fit items-center gap-1 rounded-xl p-1 shadow-sm',
            'bg-gradient-to-b from-neutral-50 to-neutral-100 ring-1 ring-black/5',
          )}
        >
          <RadioGroup.Item
            value={'raised'}
            class={twMerge(
              'group relative inline-flex select-none items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700',
              'transition-all duration-200 hover:brightness-105 focus-visible:outline-none',
              'data-[checked]:bg-white data-[checked]:text-primary-500 data-[checked]:shadow',
            )}
          >
            <RadioGroup.ItemInput class={'sr-only'} />
            <RadioGroup.ItemLabel class={'hover:cursor-pointer'}>
              Raised
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>

          <RadioGroup.Item
            value={'live'}
            class={twMerge(
              'group relative inline-flex select-none items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700',
              'transition-all duration-200 hover:brightness-105 focus-visible:outline-none',
              'data-[checked]:bg-white data-[checked]:text-primary-500 data-[checked]:shadow',
            )}
          >
            <RadioGroup.ItemInput class={'sr-only'} />
            <RadioGroup.ItemLabel class={'hover:cursor-pointer'}>
              Live
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>

          <RadioGroup.Item
            value={'cause'}
            class={twMerge(
              'group relative inline-flex select-none items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700',
              'transition-all duration-200 hover:brightness-105 focus-visible:outline-none',
              'data-[checked]:bg-white data-[checked]:text-primary-500 data-[checked]:shadow',
            )}
          >
            <RadioGroup.ItemInput class={'sr-only'} />
            <RadioGroup.ItemLabel class={'hover:cursor-pointer'}>
              Cause
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>
        </div>
      </RadioGroup>
    </div>
  )
}

const CurrencySelection: Component = () => {
  const { currency, setCurrency } = useCommunityPage()

  return (
    <div class={twMerge('flex items-center justify-between')}>
      <RadioGroup
        value={currency()}
        onChange={setCurrency}
        class={twMerge('flex flex-col items-end gap-1')}
      >
        <RadioGroup.Label
          class={twMerge(
            'text-xxs font-semibold uppercase tracking-wide text-white',
          )}
        >
          Currency
        </RadioGroup.Label>
        <div
          class={twMerge(
            'inline-flex w-fit items-center gap-1 rounded-xl p-1 shadow-sm',
            'bg-gradient-to-b from-neutral-50 to-neutral-100 ring-1 ring-black/5',
          )}
        >
          <RadioGroup.Item
            value={'GBP'}
            class={twMerge(
              'group relative inline-flex select-none items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700',
              'transition-all duration-200 hover:brightness-105 focus-visible:outline-none',
              'data-[checked]:bg-white data-[checked]:text-primary-500 data-[checked]:shadow',
            )}
          >
            <RadioGroup.ItemInput class={'sr-only'} />
            <RadioGroup.ItemLabel class={'hover:cursor-pointer'}>
              GBP
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>

          <RadioGroup.Item
            value={'USD'}
            class={twMerge(
              'group relative inline-flex select-none items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700',
              'transition-all duration-200 hover:brightness-105 focus-visible:outline-none',
              'data-[checked]:bg-white data-[checked]:text-primary-500 data-[checked]:shadow',
            )}
          >
            <RadioGroup.ItemInput class={'sr-only'} />
            <RadioGroup.ItemLabel class={'hover:cursor-pointer'}>
              USD
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>

          <RadioGroup.Item
            value={'EUR'}
            class={twMerge(
              'group relative inline-flex select-none items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700',
              'transition-all duration-200 hover:brightness-105 focus-visible:outline-none',
              'data-[checked]:bg-white data-[checked]:text-primary-500 data-[checked]:shadow',
            )}
          >
            <RadioGroup.ItemInput class={'sr-only'} />
            <RadioGroup.ItemLabel class={'hover:cursor-pointer'}>
              EUR
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>
        </div>
      </RadioGroup>
    </div>
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
  const { sortBy } = useCommunityPage()
  const isSortByCause = () => sortBy() === 'cause'
  return (
    <div class={'flex w-full flex-col items-stretch justify-center gap-4'}>
      <Header />
      <UpcomingStreams />
      <CommunityTagSearch />
      <Show when={isSortByCause()} fallback={<CampaignGrid />}>
        <CampaignGridByCause />
      </Show>
    </div>
  )
}

const CampaignGrid: Component = () => {
  const { campaignsSorted } = useCommunityPage()

  return (
    <div class={twMerge('mx-auto flex w-full flex-col gap-4')}>
      <div
        class={twMerge(
          'mb-2 mt-6 flex w-full flex-wrap items-end justify-between gap-x-4 gap-y-2',
        )}
      >
        <div class={'flex flex-col'}>
          <h2 class={twMerge('text-lg font-semibold text-white')}>
            Fundraisers (2024)
          </h2>
          <p class={twMerge('text-white')}>
            2025 Fundraisers will be shown after the Jingle Jam has started.
          </p>
        </div>
        <div
          class={twMerge(
            'flex w-full flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:w-auto',
          )}
        >
          <SortSelection />
          <CurrencySelection />
        </div>
      </div>
      <div
        class={
          'grid w-full grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] content-center gap-2'
        }
      >
        <For each={campaignsSorted()}>
          {(campaign: JJCampaignType) => {
            return <CommunityItem campaign={campaign} />
          }}
        </For>
      </div>
      <CommunityUsers />
    </div>
  )
}

const CampaignGridByCause: Component = () => {
  const { campaignsByCause, campaignsByCauseFiltered, selectedTagIds } = useCommunityPage()
  const anyTagsSelected = () => selectedTagIds().length > 0
  const groups = () => (anyTagsSelected() ? campaignsByCauseFiltered() : campaignsByCause())

  return (
    <div class={twMerge('flex w-full flex-col gap-4')}>
      <div
        class={twMerge(
          'mb-2 mt-6 flex w-full flex-wrap items-end justify-between gap-x-4 gap-y-2',
        )}
      >
        <h2 class={twMerge('text-lg font-semibold text-white')}>Fundraisers</h2>
        <div
          class={twMerge(
            'flex w-full flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:w-auto',
          )}
        >
          <SortSelection />
          <CurrencySelection />
        </div>
      </div>
      <div class={'flex w-full flex-col items-center gap-6 text-center'}>
        <For each={groups()}>
          {(o) => {
            const { cause, campaigns } = o
            return (
              <div class={'flex w-full max-w-6xl flex-col items-center gap-8'}>
                <CommunityCauseCard cause={cause} />
                <div
                  class={
                    'grid w-full grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] content-center gap-4'
                  }
                >
                  <For each={campaigns}>
                    {(campaign) => <CommunityItem campaign={campaign} />}
                  </For>
                </div>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}
