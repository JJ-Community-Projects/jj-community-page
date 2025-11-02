import {
  type Component,
  createEffect,
  on,
  For,
  Match,
  Show,
  Switch,
  createMemo,
} from 'solid-js'
import { createI18n, I18nProvider } from 'solid-i18n'
import '../common/marquee.css'
import { JJLink } from '../common/JJLinkCard.tsx'
import { useLocale } from '@kobalte/core'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { useQuery, QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { CharityTickerChild } from '../common/CharityTickerChild'
import { JJLogo } from '../common/JJLogo.tsx'

export type CharitiesProps = {
  theme?: 'default' | 'red' | 'blue'
  speed?: number
  url?: string
  titleLogo?: string
  user?: string
  currency?: 'GBP' | 'USD' | 'EUR'
}

export const CharitiesTickerOverlay: Component<CharitiesProps> = (props) => {
  const resolved = {
    theme: props.theme ?? 'default',
    url: props.url ?? 'jinglejam.tiltify.com',
    titleLogo: props.titleLogo ?? 'none',
    user: props.user,
    currency: props.currency ?? 'GBP',
  }
  const i18n = createI18n({ language: useLocale().locale() })
  return (
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider i18n={i18n}>
        <Body
          theme={resolved.theme}
          url={resolved.url}
          titleLogo={resolved.titleLogo}
          user={resolved.user}
          currency={resolved.currency}
        />
      </I18nProvider>
    </QueryClientProvider>
  )
}

const Body: Component<{
  theme: 'default' | 'red' | 'blue'
  url: string
  titleLogo: string
  user?: string
  currency: 'GBP' | 'USD' | 'EUR'
}> = (props) => {
  const q = useQuery(() =>
    orpcPrivate.overlay.charities.queryOptions({
      input: { includeTotals: true, currency: props.currency, user: props.user },
      staleTime: 60_000,
      refetchInterval: 60_000,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: true,
      placeholderData: (prev) => prev,
    }),
  )

  const displayItems = () => {
    if (!q.data) {
      return []
    }

    const data = q.data

    const gap = 4
    const result: any[] = []

    const base = data.charities
    const newChildren = Array.from({ length: gap * 2 }, () => base).flat()

    let hi = 0
    for (let i = 0; i < newChildren.length; i++) {
      const d = newChildren[i]
      if (i % gap === 0) {
        if (hi === 0) {
          result.push(<JJLogo theme={props.theme} />)
        } else {
          result.push(
            <JJLink theme={props.theme} url={data.userFundraiser?.url} />,
          )
        }
        hi = (hi + 1) % 2
      }
      result.push(
        <CharityTickerChild
          item={d}
          theme={props.theme as any}
          showRaised={true}
        />,
      )
    }
    return result
  }

  const speed = createMemo(() => displayItems().length * 4)
  return (
    <Switch>
      <Match when={q.data}>
        <p>{}</p>
        <div class="relative flex overflow-x-hidden">
          <div
            style={{
              animation: `marquee ${speed()}s linear infinite`,
            }}
            class="flex flex-row whitespace-nowrap"
          >
            <For each={displayItems()}>
              {(d) => (
                <div class="inline-block h-[80px] w-[256px] items-center justify-center px-2 py-1">
                  {d}
                </div>
              )}
            </For>
          </div>
          <div
            style={{
              animation: `marquee2 ${speed()}s linear infinite`,
            }}
            class="absolute top-0 flex flex-row whitespace-nowrap"
          >
            <For each={displayItems()}>
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
