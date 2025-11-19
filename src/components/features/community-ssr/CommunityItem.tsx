import { type Component, createEffect, createSignal, For, on, onMount, Show, } from 'solid-js'
import type { JJCampaignType } from '../../../lib/orpc/private/jjData/contract.ts'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import { twMerge } from 'tailwind-merge'
import { TiltifyIcon, TwitchIcon, YoutubeIcon, } from '../../common/icons/JJIcons.tsx'
import { FaSolidCalendarWeek } from 'solid-icons/fa'
import { useLocale } from '@kobalte/core'

export const CommunityItem: Component<{
  campaign: JJCampaignType
}> = (props) => {
  const { currency } = useCommunityPage()
  const campaign = props.campaign

  const title = () => campaign.tiltifyName

  const img = () => campaign.avatar

  const twitchUrl = () => {
    return campaign.twitch
  }
  const scheduleUrl = () => {
    return campaign.scheduleUrl
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

  const [formatedRaised, setFormatedRaised] = createSignal<string>(
    Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency(),
    }).format(raised())
  )
  const [isClient, setIsClient] = createSignal<boolean>(false)


  onMount(() => {
    const s = Intl.NumberFormat(useLocale().locale(), {
      style: 'currency',
      currency: currency(),
    }).format(raised())
    setFormatedRaised(s)
    setIsClient(true)
  })

  createEffect(
    on(currency, (c) => {
      if (!isClient()) return
      const s = Intl.NumberFormat(useLocale().locale(), {
        style: 'currency',
        currency: c,
      }).format(raised())
      setFormatedRaised(s)
    }),
  )

  return (
    <div
      class={twMerge(
        'w-full rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md',
        'hover:scale-101 hover:brightness-105',
        'bg-gradient-to-b from-neutral-50 to-neutral-100 ring-1 ring-black/5',
      )}
    >
      <div class={'flex h-full w-full flex-col gap-2 p-2'}>
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
            <p>{formatedRaised()}</p>
          </div>
        </div>

        <Show when={campaign.tiltifyDescription}>
          {(d) => <p class={'line-clamp-2 text-xxs opacity-90'}>{d()}</p>}
        </Show>
        <Show when={campaign.tags.length > 0}>
          <div class={'flex flex-wrap gap-1'}>
            <For each={campaign.tags.slice(0, 3)}>
              {(tag) => (
                <span
                  class={
                    'inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-medium'
                  }
                  style={{
                    border: `1px solid ${tag.color}`,
                    color: tag.color,
                    background: 'white',
                  }}
                  title={tag.slug}
                >
                  {tag.name}
                </span>
              )}
            </For>
          </div>
        </Show>
        <div class={'flex-1'} />
        <div class={'flex gap-1'}>
          <a
            target={'_blank'}
            href={campaign.tiltifyUrl}
            class={twMerge(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-1',
              'bg-primary-500 text-white',
              'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
            )}
          >
            <span class={'text-xxs'}>Donate</span>
            <TiltifyIcon class={'size-2'} />
          </a>
          <Show when={scheduleUrl()}>
            <a
              target={'_blank'}
              href={scheduleUrl()!}
              class={twMerge(
                'inline-flex items-center justify-center gap-1 rounded-xl px-2 py-1',
                'bg-accent-500 text-white',
                'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
              )}
            >
              <span class={'text-xxs'}>Schedule</span>
              <FaSolidCalendarWeek class={'size-2'} />
            </a>
          </Show>
          <Show when={twitchUrl()}>
            <a
              target={'_blank'}
              href={twitchUrl()!}
              class={twMerge(
                'inline-flex items-center justify-center gap-1 rounded-xl px-2 py-1',
                'bg-twitch-500 text-white',
                'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
              )}
            >
              <span class={'text-xxs'}>Twitch</span>
              <TwitchIcon class={'size-2'} />
            </a>
          </Show>
          <Show when={youtubeUrl()}>
            <a
              target={'_blank'}
              href={youtubeUrl()!}
              class={twMerge(
                'inline-flex items-center justify-center gap-1 rounded-xl px-2 py-1',
                'bg-youtube text-white',
                'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
              )}
            >
              <span class={'text-xxs'}>Youtube</span>
              <YoutubeIcon class={'size-2'} />
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
