import { type Component, createSignal, For, Show } from 'solid-js'
import type { JJCampaignType } from '../../../lib/orpc/private/jjData/contract.ts'
import { twMerge } from 'tailwind-merge'
import { createI18n, I18nProvider, Numeric } from 'solid-i18n'
import { useLocale } from '@kobalte/core'
import { TiltifyIcon, TwitchIcon, YoutubeIcon, } from '../../common/icons/JJIcons.tsx'
import { Countdown } from '../../common/ui/Countdown.tsx'
import { useIsBeforeJJ, useIsJJ } from '../../../lib/utils/jjDates.ts'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client.ts'
import { QueryClient } from '@tanstack/query-core'
import { RadioGroup } from '@kobalte/core/radio-group'
import { CommunityPageProvider } from './CommunityPageProvider.tsx'

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

  const communityQuery = useQuery(() =>
    orpcPrivate.jj.campaigns.queryOptions({}),
  )

  const causeQuery = useQuery(() =>
    orpcPrivate.jj.causes.queryOptions({}),
  )

  const isJJ = useIsJJ()
  const isBefore = useIsBeforeJJ()
  const list = () => communityQuery.data?.list ?? []

  return (
    <I18nProvider i18n={i18n}>
      <Show when={communityQuery.isSuccess}>
        <Show when={list().length > 0}>
          <Body fundraisers={list()} />
        </Show>
        <Show when={list().length === 0}>
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
      <Show when={communityQuery.isLoading}>
        <p class={'text-center text-white'}>Loading…</p>
      </Show>
      <Show when={communityQuery.isError}>
        <p class={'text-center text-red-500'}>
          Failed to load community campaigns.
        </p>
      </Show>
    </I18nProvider>
  )
}

interface BodyProps {
  fundraisers: JJCampaignType[]
}

const Body: Component<BodyProps> = (props) => {

  const [sortBy, setSortBy] = createSignal<('raised'|'live'|'cause')>('raised')
  
  const fundraiser = () =>{

    if (sortBy() === 'live') {
      return props.fundraisers
        .toSorted((a,b) => {
          if (a.isTwitchLive) {
            return -1
          } else if(b.isTwitchLive) {
            return 1
          }
          return 0
        })
    }

    return   props.fundraisers.toSorted((a, b) => b.raised.gbp - a.raised.gbp)
  }

  return (
    <>
      <div>
        <p>{sortBy()}</p>
        <RadioGroup value={sortBy()} onChange={setSortBy}>
          <RadioGroup.Label>Sort by</RadioGroup.Label>
          <RadioGroup.Item value={'raised'} >
            <RadioGroup.ItemInput  />
            <RadioGroup.ItemControl >
              <RadioGroup.ItemIndicator  />
            </RadioGroup.ItemControl>
            <RadioGroup.ItemLabel>Raised amount</RadioGroup.ItemLabel>
          </RadioGroup.Item>
          <RadioGroup.Item value={'live'} >
            <RadioGroup.ItemInput  />
            <RadioGroup.ItemControl >
              <RadioGroup.ItemIndicator  />
            </RadioGroup.ItemControl>
            <RadioGroup.ItemLabel>Live on Twitch</RadioGroup.ItemLabel>
          </RadioGroup.Item>
          <RadioGroup.Item value={'cause'} >
            <RadioGroup.ItemInput  />
            <RadioGroup.ItemControl >
              <RadioGroup.ItemIndicator  />
            </RadioGroup.ItemControl>
            <RadioGroup.ItemLabel>Cause</RadioGroup.ItemLabel>
          </RadioGroup.Item>
        </RadioGroup>
      </div>
      <div
        class={
          'grid grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] content-center gap-4'
        }
      >
        <For each={fundraiser()}>
          {(campaign: JJCampaignType) => {
            return <Child campaign={campaign} />
          }}
        </For>
      </div>
      <div class={'flex w-full flex-col items-center gap-4 sm:hidden'}>
        <For each={fundraiser()}>
          {(campaign: JJCampaignType) => {
            return <Child campaign={campaign} />
          }}
        </For>
      </div>
    </>
  )
}

const Child: Component<{
  campaign: JJCampaignType
}> = (props) => {
  const campaign = props.campaign

  const title = () => campaign.tiltifyName

  const img = () => campaign.avatar

  const twitchUrl = () => {
    return campaign.twitch
  }

  const youtubeUrl = () => {
    return campaign.youtube
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
              value={campaign.raised.gbp}
              numberStyle="currency"
              currency={'GBP'}
            />
          </div>
        </div>

        <Show when={campaign.tiltifyDescription}>
          {(d) => <p class={'line-clamp-2 text-xxs opacity-90'}>{d()}</p>}
        </Show>
        <div class={'flex-1'}/>

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
