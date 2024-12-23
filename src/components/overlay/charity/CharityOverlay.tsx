import {type Component, For, Match, Show, Switch} from 'solid-js'
import {createI18n, I18nProvider, Numeric} from 'solid-i18n'
import {useShowRaised, useSpeed, useTheme, useTiltifyUrl, useTitleLogo} from '../overlay_signals'
import '../marquee.css'
import {JJLink} from '../JJLinkCard'
import {JJTitleCard} from '../JJTitleCard'
import {useJJDonationTracker} from "../../../lib/useJJDonationTracker.ts";
import type {Cause} from "../../../lib/model/jjData/JJData.ts";
import {useLocale} from "@kobalte/core";

export const CharityOverlay: Component = () => {
  return (
    <CharityOverlayComponent
      speed={useSpeed()}
      theme={useTheme()}
      showRaised={useShowRaised()}
      url={useTiltifyUrl()}
      titleLogo={useTitleLogo()}
    />
  )
}


export const CharityOverlayComponent: Component<{
  speed: number
  theme: string
  showRaised: boolean
  url: string
  titleLogo: string
}> = props => {
  const i18n = createI18n({language: useLocale().locale()})

  return <I18nProvider i18n={i18n}>
    <Body speed={props.speed} theme={props.theme} showRaised={props.showRaised} url={props.url} titleLogo={props.titleLogo}/>
  </I18nProvider>
}

export const Body: Component<{
  speed: number
  theme: string
  showRaised: boolean
  url: string
  titleLogo: string
}> = props => {
  const charityData = useJJDonationTracker()
  const desc = () => {
    return 3
  }
  const items = () => {
    const lst = charityData.data?.causes
    if (!lst) {
      return []
    }
    const result = []

    for (let i = 0; i < lst.length; i++) {
      const d = lst[i]
      if (i % desc() == 0) {
        if (i % (desc() * 2) == 0) {
          result.push(<Title theme={props.theme} titleLogo={props.titleLogo} />)
        } else {
          result.push(<JJLink theme={props.theme} url={props.url} />)
        }
      }
      result.push(<Child d={d} theme={props.theme} showRaised={props.showRaised} />)
    }

    return result
  }

  return (
    <Switch>
      <Match when={charityData.data} keyed={true}>
        <p>{}</p>
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
      </Match>
    </Switch>
  )
}

interface ChildProps {
  theme: string
  d: Cause
  showRaised: boolean
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
  const useNameTextColor = () => {
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

  const value = () => props.d.raised.fundraisers // + props.d.raised.yogscast

  return (
    <div class={`h-full w-full rounded-2xl ${useBackground()} p-2 shadow-2xl`}>
      <div class={'flex h-full w-full flex-row items-center justify-start'}>
        <img class={'h-12 w-12 rounded-lg'} alt={''} src={props.d.logo} loading={'eager'} />
        <div class={'flex h-full flex-1 flex-col items-start justify-center overflow-hidden truncate pl-2 '}>
          <p class={`${useNameTextColor()} font-bold`}>{props.d.name}</p>
          <Show when={props.showRaised}>
            <p class={`${useRaisedTextColor()} font-bold`}>
              Raised <Numeric value={value()} numberStyle="currency" currency={'GBP'} />
            </p>
          </Show>
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
