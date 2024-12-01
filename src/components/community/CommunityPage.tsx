import {type Component, For, Show} from "solid-js";
import {useFundraiser} from "../../lib/useJJDonationTracker.ts";
import type {Campaign} from "../../lib/model/jjData/JJCommunityFundraiser.ts";
import {twMerge} from "tailwind-merge";
import {createI18n, I18nProvider, Numeric} from "solid-i18n";
import {useLocale} from "@kobalte/core";
import {TiltifyIcon, TwitchIcon, YoutubeIcon} from "../common/JJIcons.tsx";
import {Countdown} from "../Countdown.tsx";
import {useIsBeforeJJ, useIsJJ} from "../../lib/utils/jjDates.ts";


export const CommunityPage: Component = () => {
  const i18n = createI18n({language: useLocale().locale()})
  const community = useFundraiser()
  const isJJ = useIsJJ()
  const isBefore = useIsBeforeJJ()
  return (
    <I18nProvider i18n={i18n}>
      <Show when={community.data !== null}>
        <Show when={community.data!.campaigns.length > 0}>
          <Body fundraisers={community.data!.campaigns}/>
        </Show>
        <Show when={community.data!.campaigns.length == 0}>
          <Show when={!isBefore()}>
            <p class={'text-center text-white'}>No Fundraisers found.</p>
          </Show>
          <Show when={isBefore()}>
            <p class={'text-center text-white'}>Check this site again once the Jingle Jam has officially started.</p>
          </Show>
          <Show when={!isJJ()}>
            <Countdown/>
          </Show>
        </Show>
      </Show>
    </I18nProvider>
  );
}


interface BodyProps {
  fundraisers: Campaign[]
}

const Body: Component<BodyProps> = (props) => {

  const fundraiser = () => props.fundraisers.toSorted((a, b) => b.raised - a.raised)

  const top = () => fundraiser().at(0)

  const top10 = () => (fundraiser().length > 10 ? fundraiser().slice(1, 10) : fundraiser().slice(1))

  const rest = () => (fundraiser().length > 10 ? fundraiser().slice(10) : [])


  return (
    <div class={'flex flex-col items-center gap-4'}>
      <Show when={top()}>
        <div class={'md:w-[50%]'}>
          <Child campaign={top()!}/>
        </div>
      </Show>
      <div class={'grid grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] content-center gap-4'}>
        <For each={top10()}>
          {(campaign: Campaign) => {
            return <Child campaign={campaign}/>
          }}
        </For>
      </div>
      <div class={'grid grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] content-center gap-2'}>
        <For each={rest()}>
          {(campaign: Campaign) => {
            return <Child campaign={campaign}/>
          }}
        </For>
      </div>
    </div>
  );
}


const Child: Component<{
  campaign: Campaign
}> = props => {
  const campaign = props.campaign

  const title = () => campaign?.twitch_data?.display_name ?? campaign.user.name
  const isTwitch = () => campaign.twitch_data && campaign.livestream.type === 'twitch'
  const img = () => {
    if (campaign.user.avatar === 'https://assets.tiltify.com/assets/default-avatar.png') {
      if (isTwitch()) {
        return campaign.twitch_data!.profile_image_url
      }
    }
    return campaign.user.avatar
  }

  const twitchUrl = () => {
    if (!campaign.twitch_data) {
      return undefined
    }
    return `https://twitch.tv/${campaign.twitch_data.login}`
  }

  const youtubeUrl = () => {
    if (campaign.livestream.type === 'youtube_live') {
      return `https://www.youtube.com/channel/${campaign.livestream.channel}`
    }
    if (campaign.livestream.type === 'youtube_video') {
      return `https://www.youtube.com/watch?v=${campaign.livestream.channel}`
    }
    return undefined
  }

  return (
    <div class={'min-h-24 flex flex-col'}>
      <div
        class={
          'min-h-24 flex h-full w-full flex-row items-start gap-2 rounded-2xl bg-gradient-to-br from-white to-gray-100 p-1.5 text-black shadow-xl transition-all'
        }
      >
        <div class={'flex h-full flex-1 flex-col overflow-hidden'}>
          <div class={'flex flex-row gap-1'}>
            <img class={'h-10 w-10 rounded-lg'} alt={title()} src={img()} loading={'lazy'}/>
            <div class={'flex h-full flex-col justify-between overflow-hidden'}>
              <div class={'flex max-h-[14px] flex-row items-center gap-1 overflow-hidden'}>
                <Show when={campaign.isLive && twitchUrl()}>
                  <Live/>
                </Show>
                <p class={'truncate text-ellipsis text-start text-sm font-bold'}>{title()}</p>
              </div>
              <p class={'truncate text-ellipsis text-start text-xs font-bold'}>{campaign.name}</p>
              <p class={twMerge('text-primary-500 text-start text-xs font-bold')}>
                Raised <Numeric value={campaign.raised} numberStyle="currency" currency={'GBP'}/>
              </p>
            </div>
          </div>
          <p class={'line-clamp-2 w-full text-ellipsis text-start text-xs'}>{campaign.description}</p>
        </div>
      </div>
      <div class={'flex w-full flex-row items-center justify-end gap-4 p-1'}>
        <a
          class={
            'bg-[#133DF4] hover:scale-102 rounded-xl p-1 no-underline shadow text-white hover:brightness-105 flex flex-row gap-1 items-center'
          }
          href={campaign.url}
          target={'_blank'}
        >
          Donate <TiltifyIcon/>
        </a>
        <Show when={twitchUrl()}>
          <a
            class={
              'bg-twitch-500 hover:scale-102 rounded-xl p-1 no-underline shadow text-white hover:brightness-105 flex flex-row gap-1 items-center'
            }
            href={twitchUrl()}
            target={'_blank'}
          >
            Twitch <TwitchIcon/>
          </a>
        </Show>
        <Show when={youtubeUrl()}>
          <a
            class={
              'bg-youtube hover:scale-102 rounded-xl p-1 no-underline shadow text-white hover:brightness-105 flex flex-row gap-1 items-center'
            }
            href={youtubeUrl()}
            target={'_blank'}
          >
            Youtube <YoutubeIcon/>
          </a>
        </Show>
      </div>
    </div>
  )
}

const Live = () => {
  return (
    <>
      <div class={'relative hidden h-3 items-center justify-center group-hover/live:flex'}>
        <p class={'bg-twitch-500 rounded p-0.5 text-[6px] text-white'}>LIVE</p>
      </div>
      <span class="relative flex h-3 w-3 items-center justify-center group-hover/live:hidden">
        <span class={'bg-twitch-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75'}/>
        <span class={'bg-twitch-500 relative inline-flex h-full w-full rounded-full'}/>
      </span>
    </>
  )
}
