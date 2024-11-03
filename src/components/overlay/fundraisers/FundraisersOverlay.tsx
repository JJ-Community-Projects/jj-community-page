import {type Component, createEffect, For, Match, Switch} from 'solid-js'
import {createI18n, I18nProvider, Numeric} from 'solid-i18n'
import {FaBrandsTwitch, FaBrandsYoutube} from 'solid-icons/fa'
import {excludedChannel, minAmount, useSpeed, useTheme, useTiltifyUrl, useTitleLogo} from '../overlay_signals'
import '../marquee.css'
import {JJLink} from '../JJLinkCard'
import {twMerge} from 'tailwind-merge'
import {JJTitleCard} from '../JJTitleCard'
import {useFundraiser} from "../../../lib/useJJDonationTracker.ts";
import type {Campaign} from "../../../lib/model/jjData/JJCommunityFundraiser.ts";
import {useLocale} from "@kobalte/core";

export const FundraisersOverlay = () => {
  return (
    <FundraisersOverlayComponent
      speed={useSpeed()}
      theme={useTheme()}
      url={useTiltifyUrl()}
      titleLogo={useTitleLogo()}
    />
  )
}

interface Props {
  speed: number
  theme: string
  url: string
  titleLogo: string
}

export const FundraisersOverlayComponent: Component<Props> = props => {
  // todo fix
  const config = {
    overlay: {
      fundraiser: true
    }
  }
  const i18n = createI18n({language: useLocale().locale()})
  return (
    <I18nProvider i18n={i18n}>
      <Switch>
        <Match when={config.overlay.fundraiser}>
          <Body speed={props.speed} theme={props.theme} url={props.url} titleLogo={props.titleLogo}/>
        </Match>
        <Match when={!config.overlay.fundraiser}>
          <p class={'rounded bg-white p-2 text-black'}>The Fundraisers are not available yet</p>
        </Match>
      </Switch>
    </I18nProvider>
  )
}

const Body: Component<Props> = props => {
  const e = excludedChannel()

  const fundraiserData = useFundraiser()

  createEffect(() => {
    console.log('Fundraiser data', fundraiserData)
  })

  const useData = () =>
    fundraiserData.data?.campaigns
      // .filter(d => !e.includes(d.login))
      // .filter(d => !e.includes(d.display_name))
      .filter(d => d.raised >= minAmount()) ?? []

  const desc = () => {
    if (useData().length % 4 == 0) {
      return 4
    }
    return 3
  }
  const items = () => {
    const lst = useData()
    console.log('items', lst)
    const result = []

    for (let i = 0; i < lst.length; i++) {
      const d = lst[i]
      if (i % desc() == 0) {
        if (i % (desc() * 2) == 0) {
          result.push(<Title theme={props.theme} titleLogo={props.titleLogo}/>)
        } else {
          result.push(<JJLink theme={props.theme} url={props.url}/>)
        }
      }
      result.push(<Child d={d} theme={props.theme}/>)
    }

    return result
  }

  return (
    <div class="relative flex overflow-x-hidden">
      <div
        style={{
          animation: `marquee ${props.speed * (items().length * 2)}s linear infinite`,
        }}
        class="flex flex-row whitespace-nowrap"
      >
        <For each={items()}>
          {d => {
            return <div class="inline-block h-[80px] w-[256px] items-center justify-center px-2 py-1">{d}</div>
          }}
        </For>
      </div>
      <div
        style={{
          animation: `marquee2 ${props.speed * (items().length * 2)}s linear infinite`,
        }}
        class="absolute top-0 flex flex-row whitespace-nowrap"
      >
        <For each={items()}>
          {d => {
            return <div class="inline-block h-[80px] w-[256px] items-center justify-center px-2 py-1">{d}</div>
          }}
        </For>
      </div>
    </div>
  )
}

interface ChildProps {
  theme: string
  d: Campaign
}

const Child: Component<ChildProps> = props => {
  const useBackground = () => {
    switch (props.theme) {
      case 'pink':
      case 'red':
        return 'bg-primary'
      case 'blue':
        return 'bg-accent'
      default:
        return 'bg-white'
    }
  }
  const useDisplayNameTextColor = () => {
    switch (props.theme) {
      case 'pink':
      case 'red':
      case 'blue':
        return 'text-white'
      default:
        return 'text-accent'
    }
  }
  const useRaisedTextColor = () => {
    switch (props.theme) {
      case 'pink':
      case 'red':
      case 'blue':
        return 'text-white'
      default:
        return 'text-primary'
    }
  }
  const useTwitchIconColor = () => {
    switch (props.theme) {
      case 'pink':
      case 'red':
      case 'blue':
        return 'text-white'
      default:
        return 'text-twitch'
    }
  }

  const isTwitch = () => props.d.twitch_data && props.d.livestream.type === 'twitch'
  const isYoutube = () => props.d.livestream.type === 'youtube'

  const img = () => {
    if (props.d.user.avatar === 'https://assets.tiltify.com/assets/default-avatar.png') {
      if (isTwitch()) {
        return props.d.twitch_data?.profile_image_url
      }
    }
    return props.d.user.avatar
  }

  return (
    <div class={`h-full w-full rounded-2xl ${useBackground()} p-2 text-base shadow-2xl`}>
      <div class={'flex h-full w-full flex-row items-center justify-start'}>
        <img class={'h-12 w-12 rounded-lg'} alt={''} src={img()} loading={'eager'}/>
        <div class={'flex h-full w-full flex-col items-start justify-center overflow-hidden truncate pl-2'}>
          <div class={twMerge(`flex flex-row items-center font-bold`, useDisplayNameTextColor())}>{props.d.name}</div>
          <Switch>
            <Match when={isTwitch()}>
              <div class={twMerge(`flex flex-row items-center font-bold`, useTwitchIconColor())}>
                <FaBrandsTwitch size={14}/>
                <span class={twMerge(`text-xs`, useDisplayNameTextColor())}>/{props.d.twitch_data?.login}</span>
              </div>
            </Match>
            <Match when={isYoutube()}>
              <div class={`${useTwitchIconColor()} flex flex-row items-center font-bold`}>
                <FaBrandsYoutube size={14}/>
                <span class={twMerge(`text-xs`, useDisplayNameTextColor())}>/{props.d.livestream.channel}</span>
              </div>
            </Match>
          </Switch>
          <p class={`${useRaisedTextColor()} font-bold`}>
            Raised <Numeric value={props.d.raised} numberStyle="currency" currency={'GBP'}/>
          </p>
        </div>
      </div>
    </div>
  )
}

interface TitleProps {
  theme: string
  titleLogo: string
}

const Title: Component<TitleProps> = props => {
  const community = () => {
    switch (props.theme) {
      case 'pink':
      case 'red':
      case 'blue':
        return 'text-white'
      default:
        return 'text-accent-500'
    }
  }
  const fundraisers = () => {
    switch (props.theme) {
      case 'pink':
      case 'red':
      case 'blue':
        return 'text-white'
      default:
        return 'text-primary-500'
    }
  }
  return (
    <JJTitleCard theme={props.theme} titleLogo={props.titleLogo}>
      <p class={`${community()} font-bold`}>Jingle Jam</p>
      <p class={`${fundraisers()} font-bold`}>Charities</p>
    </JJTitleCard>
  )
}
