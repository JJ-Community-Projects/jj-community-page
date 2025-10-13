import { type Component, createEffect, on, For, Match, Show, Switch } from 'solid-js'
import { createI18n, I18nProvider, Numeric } from 'solid-i18n'
import { useShowRaised, useSpeed, useTheme, useTiltifyUrl, useTitleLogo, useShowJJLink, useShowTitle, useUsername } from '../overlay/overlay_signals'
import '../overlay/marquee.css'
import { JJLink } from '../overlay/JJLinkCard'
import { JJTitleCard } from '../overlay/JJTitleCard'
import { useLocale } from '@kobalte/core'
import { orpcPrivate } from '../../../lib/orpc/client'
import { useQuery, QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import type { CharityItemT } from '../../../lib/orpc/private/overlay/contract'

export const CharitiesOverlay: Component = () => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <CharitiesOverlayComponent
        speed={useSpeed()}
        theme={useTheme()}
        showRaised={useShowRaised()}
        url={useTiltifyUrl()}
        titleLogo={useTitleLogo()}
        showTitle={useShowTitle()}
        showJJLink={useShowJJLink()}
        username={useUsername()}
      />
    </QueryClientProvider>
  )
}

export const CharitiesOverlayComponent: Component<{
  speed: number
  theme: string
  showRaised: boolean
  url: string
  titleLogo: string
  showTitle: boolean
  showJJLink: boolean
  username: string
}> = (props) => {
  const i18n = createI18n({ language: useLocale().locale() })
  return (
    <I18nProvider i18n={i18n}>
      <Body
        speed={props.speed}
        theme={props.theme}
        showRaised={props.showRaised}
        url={props.url}
        titleLogo={props.titleLogo}
        showTitle={props.showTitle}
        showJJLink={props.showJJLink}
        username={props.username}
      />
    </I18nProvider>
  )
}

export const Body: Component<{
  speed: number
  theme: string
  showRaised: boolean
  url: string
  titleLogo: string
  showTitle: boolean
  showJJLink: boolean
  username: string
}> = (props) => {
  const desc = () => 3

  const q = useQuery(() =>
    orpcPrivate.overlay.charities.queryOptions({
      input: { includeTotals: props.showRaised },
      staleTime: 5_000,
      refetchInterval: 5_000,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: true,
      placeholderData: (prev) => prev
    }),
  )

  createEffect(on(() => q.data, (data) => console.log('Charities data', new Date(), data)))

  const urlWithUser = () => (props.username && props.username.length > 0 ? `${props.url}/${props.username}` : props.url)

  const items = () => {
    const lst = q.data ?? []
    if (!lst) return []
    const result: any[] = []
    for (let i = 0; i < lst.length; i++) {
      const d = lst[i]
      if (i % desc() == 0) {
        if (i % (desc() * 2) == 0) {
          if (props.showTitle) result.push(<Title theme={props.theme} titleLogo={props.titleLogo} />)
        } else {
          if (props.showJJLink) result.push(<JJLink theme={props.theme} url={urlWithUser()} />)
        }
      }
      result.push(
        <Child d={d} theme={props.theme} showRaised={props.showRaised} />,
      )
    }
    return result
  }

  return (
    <Switch>
      <Match when={q.data}>
        <p>{}</p>
        <div class="relative flex overflow-x-hidden">
          <div
            style={{
              animation: `marquee ${props.speed * (items().length * 2)}s linear infinite`,
            }}
            class="flex flex-row whitespace-nowrap"
          >
            <For each={items()}>
              {(d) => (
                <div class="inline-block h-[80px] w-[256px] items-center justify-center px-2 py-1">
                  {d}
                </div>
              )}
            </For>
          </div>
          <div
            style={{
              animation: `marquee2 ${props.speed * (items().length * 2)}s linear infinite`,
            }}
            class="absolute top-0 flex flex-row whitespace-nowrap"
          >
            <For each={items()}>
              {(d) => (
                <div class="inline-block h-[80px] w-[256px] items-center justify-center px-2 py-1">
                  {d}
                </div>
              )}
            </For>
          </div>
        </div>
      </Match>
    </Switch>
  )
}

interface ChildProps {
  theme: string
  d: CharityItemT
  showRaised: boolean
}

const Child: Component<ChildProps> = (props) => {
  const useBackground = () => {
    switch (props.theme) {

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

      case 'red':
      case 'blue':
        return 'text-white'
      default:
        return 'text-accent'
    }
  }
  const useRaisedTextColor = () => {
    switch (props.theme) {

      case 'red':
      case 'blue':
        return 'text-white'
      default:
        return 'text-primary'
    }
  }

  const value = () => props.d.amountRaised ?? 0

  return (
    <div class={`h-full w-full rounded-2xl ${useBackground()} p-2 shadow-2xl`}>
      <div class={'flex h-full w-full flex-row items-center justify-start'}>
        <img class={'h-12 w-12 rounded-lg'} alt={''} src={props.d.logoUrl ?? ''} loading={'eager'} />
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

const Title: Component<TitleProps> = (props) => {
  const community = () => {
    switch (props.theme) {

      case 'red':
      case 'blue':
        return 'text-white'
      default:
        return 'text-accent-500'
    }
  }
  const fundraisers = () => {
    switch (props.theme) {

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
