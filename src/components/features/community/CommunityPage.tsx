import { type Component, For, Show } from 'solid-js'
import type { JJCampaignType, JJCauseType, } from '../../../lib/orpc/private/jjData/contract.ts'
import { twMerge } from 'tailwind-merge'
import { createI18n, I18nProvider, Numeric } from 'solid-i18n'
import { useLocale } from '@kobalte/core'
import { TiltifyIcon, TwitchIcon, YoutubeIcon, } from '../../common/icons/JJIcons.tsx'
import { Countdown } from '../../common/ui/Countdown.tsx'
import { useIsBeforeJJ, useIsJJ } from '../../../lib/utils/jjDates.ts'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { RadioGroup } from '@kobalte/core/radio-group'
import { CommunityPageProvider, useCommunityPage, } from './CommunityPageProvider.tsx'
import { FaSolidHeart } from 'solid-icons/fa'

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
        <Show when={campaignsSorted().length > 0}>
          <Body />
        </Show>
        <Show when={campaignsSorted().length === 0}>
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
        class={twMerge('flex flex-col gap-1 items-end')}
      >
        <RadioGroup.Label
          class={twMerge(
            'text-xxs font-semibold uppercase tracking-wide',
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
            'text-xxs font-semibold uppercase tracking-wide',
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

  return (
    <div
      class="bg-white rounded-xl shadow-md border-2 hover:shadow-lg transition-all duration-300 p-2"
    >
      <div class="p-4 md:p-4 lg:p-6">
        <div class="flex flex-col items-center text-center">
          <div class="flex items-center gap-2 mb-4">
            <FaSolidHeart class="w-8 h-8 text-neutral-600" />
            <h1 class="~text-2xl/4xl font-babas text-black">Fundraisers</h1>
          </div>
        </div>
      </div>
      <div class={'flex w-full items-center justify-end flex-wrap gap-x-4 gap-y-2'}>
        <SortSelection />
        <CurrencySelection />
      </div>

    </div>
  )
}

const Body: Component = () => {
  const { sortBy } = useCommunityPage()
  const isSortByCause = () => sortBy() === 'cause'
  return (
    <>
      <Header/>
      <Show when={isSortByCause()} fallback={<CampaignGrid />}>
        <CampaignGridByCause />
      </Show>
    </>
  )
}

const CampaignGrid: Component = () => {
  const { campaignsSorted } = useCommunityPage()

  return (
    <div
      class={
        'grid w-full grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] content-center gap-4'
      }
    >
      <For each={campaignsSorted()}>
        {(campaign: JJCampaignType) => {
          return <Child campaign={campaign} />
        }}
      </For>
    </div>
  )
}

const CauseCard: Component<{ cause: JJCauseType }> = (props) => {
  const { cause } = props
  const { currency } = useCommunityPage()
  const title = () => cause.name
  const img = () => cause.logo
  const raised = () => {
    if (currency() === 'USD') {
      return cause.raised.total.usd
    }
    if (currency() === 'EUR') {
      return cause.raised.total.euro
    }
    return cause.raised.total.gbp
  }
  return (
    <div
      class={twMerge(
        'w-full max-w-[520px] mx-auto rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md',
        'hover:scale-101 hover:brightness-105',
        'bg-gradient-to-b from-neutral-50 to-neutral-100 ring-1 ring-black/5',
      )}
    >
      <div class={'flex h-full w-full flex-col gap-2 p-2.5'}>
        <div class={'flex flex-col items-center gap-2'}>
          <img
            class={'size-14 rounded-lg ring-1 ring-black/10'}
            alt={title()}
            src={img()}
            loading={'lazy'}
          />
          <div class={'min-w-0 w-full'}>
            <div class={'flex flex-col items-center gap-1'}>
              <p class={'text-sm font-semibold text-center'}>
                {title()}
              </p>
            </div>
            <Show when={cause.description}>
              {(d) => <p class={'line-clamp-2 text-xxs opacity-90 text-center'}>{d()}</p>}
            </Show>
          </div>
          <div
            class={'flex flex-col items-center text-xs font-bold text-primary-600'}
          >
            <p>Raised</p>
            <Numeric
              value={raised()}
              numberStyle="currency"
              currency={currency()}
            />
          </div>
        </div>
        <div class={'flex-1'} />
        <div class={'flex gap-2'}>
          <a
            target={'_blank'}
            href={cause.donateUrl}
            class={twMerge(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-1.5',
              'bg-primary-500 text-white',
              'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
            )}
          >
            <span class={'text-xxs'}>Donate</span>
          </a>
          <a
            target={'_blank'}
            href={cause.url}
            class={twMerge(
              'inline-flex items-center justify-center gap-1 rounded-xl px-3 py-1.5',
              'bg-neutral-800 text-white',
              'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
            )}
          >
            <span class={'text-xxs'}>Learn more</span>
          </a>
        </div>
      </div>
    </div>
  )
}

const CampaignGridByCause: Component = () => {
  const { campaignsByCause } = useCommunityPage()

  return (
    <div class={'flex w-full flex-col items-center gap-6 text-center'}>
      <For each={campaignsByCause()}>
        {(o) => {
          const { cause, campaigns } = o
          return (
            <div class={'flex w-full max-w-6xl flex-col items-center gap-8'}>
              <CauseCard cause={cause} />
              <div
                class={
                  'grid w-full grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] content-center gap-4'
                }
              >
                <For each={campaigns}>
                  {(campaign) => <Child campaign={campaign} />}
                </For>
              </div>
            </div>
          )
        }}
      </For>
    </div>
  )
}

const Child: Component<{
  campaign: JJCampaignType
}> = (props) => {
  const { currency } = useCommunityPage()
  const campaign = props.campaign

  const title = () => campaign.tiltifyName

  const img = () => campaign.avatar

  const twitchUrl = () => {
    return campaign.twitch
  }

  const youtubeUrl = () => {
    return campaign.youtube
  }

  const raised = () => {
    if (currency() === 'USD') {
      return campaign.raised.usd
    }
    if (currency() === 'EUR') {
      return campaign.raised.euro
    }
    return campaign.raised.gbp
  }

  return (
    <div
      class={twMerge(
        'w-full rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md',
        'hover:scale-101 hover:brightness-105',
        'bg-gradient-to-b from-neutral-50 to-neutral-100 ring-1 ring-black/5',
      )}
    >
      <div class={'flex h-full w-full flex-col gap-2 p-2.5'}>
        <div class={'flex items-start gap-2'}>
          <img
            class={'size-8 rounded-lg ring-1 ring-black/10'}
            alt={title()}
            src={img()}
            loading={'lazy'}
          />
          <div class={'min-w-0 flex-1'}>
            <div class={'flex flex-row items-center gap-1'}>
              <Show when={campaign.isTwitchLive}>
                <Live />
              </Show>
              <p class={'truncate text-ellipsis text-sm font-semibold'}>
                {title()}
              </p>
            </div>
            <Show when={campaign.tiltifyName}>
              {(d) => (
                <p class={'truncate text-ellipsis text-[11px] opacity-80'}>
                  {d()}
                </p>
              )}
            </Show>
          </div>
          <div
            class={'flex flex-col items-end text-xs font-bold text-primary-600'}
          >
            <p>Raised</p>
            <Numeric
              value={raised()}
              numberStyle="currency"
              currency={currency()}
            />
          </div>
        </div>

        <Show when={campaign.tiltifyDescription}>
          {(d) => <p class={'line-clamp-2 text-xxs opacity-90'}>{d()}</p>}
        </Show>
        <div class={'flex-1'} />

        <div class={'flex gap-2'}>
          <a
            target={'_blank'}
            href={campaign.tiltifyUrl}
            class={twMerge(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-1.5',
              'bg-primary-500 text-white',
              'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
            )}
          >
            <span class={'text-xxs'}>Donate</span>
            <TiltifyIcon class={'size-3'} />
          </a>
          <Show when={twitchUrl()}>
            <a
              target={'_blank'}
              href={twitchUrl()!}
              class={twMerge(
                'inline-flex items-center justify-center gap-1 rounded-xl px-3 py-1.5',
                'bg-twitch-500 text-white',
                'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
              )}
            >
              <span class={'text-xxs'}>Twitch</span>
              <TwitchIcon />
            </a>
          </Show>
          <Show when={youtubeUrl()}>
            <a
              target={'_blank'}
              href={youtubeUrl()!}
              class={twMerge(
                'inline-flex items-center justify-center gap-1 rounded-xl px-3 py-1.5',
                'bg-youtube text-white',
                'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
              )}
            >
              <span class={'text-xxs'}>Youtube</span>
              <YoutubeIcon />
            </a>
          </Show>
        </div>
      </div>
    </div>
  )
}

const Live = () => {
  return (
    <>
      <div
        class={
          'relative hidden h-3 items-center justify-center group-hover/live:flex'
        }
      >
        <p class={'rounded bg-twitch-500 p-0.5 text-[6px] text-white'}>LIVE</p>
      </div>
      <span class="relative flex h-3 w-3 items-center justify-center group-hover/live:hidden">
        <span
          class={
            'absolute inline-flex h-full w-full animate-ping rounded-full bg-twitch-400 opacity-75'
          }
        />
        <span
          class={
            'relative inline-flex h-full w-full rounded-full bg-twitch-500'
          }
        />
      </span>
    </>
  )
}
