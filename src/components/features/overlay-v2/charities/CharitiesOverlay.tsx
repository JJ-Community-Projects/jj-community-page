import {
  type Component,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { Transition } from 'solid-transition-group'
import { twMerge } from 'tailwind-merge'
import { QRCodeSVG } from 'solid-qr-code'
import '../../overlay/marquee.css'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import type { CharityItemT } from '../../../../lib/orpc/private/overlay/contract.ts'

// Header cards (mirrors V1 CharityOverlay2)
function bg(theme: string) {
  switch (theme) {
    case 'red':
      return 'bg-primary-500'
    case 'blue':
      return 'bg-accent-500'
    default:
      return 'bg-white'
  }
}

const HeaderCard: Component<{ theme: string; children: any }> = (p) => (
  <div class="w-full p-2">
    <div
      class={twMerge(
        'flex h-11 w-full flex-row items-center justify-center rounded-2xl p-2 text-4xl font-bold shadow-xl transition-all',
        bg(p.theme),
      )}
    >
      {p.children}
    </div>
  </div>
)

const Title: Component<{ theme: string }> = (p) => (
  <HeaderCard theme={p.theme}>
    <div class="w-full text-center text-2xl">
      <p class={p.theme === 'default' ? 'text-primary-500' : 'text-white'}>
        Charities
      </p>
    </div>
  </HeaderCard>
)

const DonationChatCommand: Component<{ theme: string }> = (p) => (
  <HeaderCard theme={p.theme}>
    <p class="w-full text-center text-xl">
      <span class={p.theme === 'default' ? 'text-accent-500' : 'text-white'}>
        !Donate
      </span>{' '}
      <span class={p.theme === 'default' ? 'text-primary-500' : 'text-white'}>
        in Chat
      </span>
    </p>
  </HeaderCard>
)

const JJLink: Component<{ theme: string }> = (p) => (
  <HeaderCard theme={p.theme}>
    <p class="w-full text-center text-base">
      <span class={p.theme === 'default' ? 'text-primary' : 'text-white'}>
        jinglejam.tiltify.com
      </span>
    </p>
  </HeaderCard>
)

const OverlayHeader: Component<{
  header: string[]
  headerTheme: string
  speed: number
}> = (props) => {
  const names = () => props.header.map((h) => h.toLowerCase())
  const items = () => {
    const arr: any[] = []
    if (names().includes('title')) arr.push(<Title theme={props.headerTheme} />)
    if (names().includes('donate') || names().includes('donation'))
      arr.push(<DonationChatCommand theme={props.headerTheme} />)
    if (names().includes('jj') || names().includes('jjlink'))
      arr.push(<JJLink theme={props.headerTheme} />)
    return arr
  }
  const [idx, setIdx] = createSignal(0)
  const animate = () => items().length > 1
  let t: any
  onMount(() => {
    if (animate())
      t = setInterval(
        () => setIdx((i) => (i + 1) % items().length),
        Math.max(1, props.speed) * 1000,
      )
  })
  onCleanup(() => t && clearInterval(t))
  const current = () =>
    items().length === 0 ? null : animate() ? items()[idx()] : items()[0]
  return (
    <Show when={!names().includes('none')}>
      <Show when={animate()}>
        <Transition
          mode="outin"
          onEnter={(el: any, done: any) => {
            const a = el.animate(
              [
                { opacity: 1, transform: 'rotateX(-90deg) perspective(800px)' },
                { opacity: 1, transform: 'rotateX(0deg) perspective(0px)' },
              ],
              { duration: 700 },
            )
            a.finished.then(done)
          }}
          onExit={(el: any, done: any) => {
            const a = el.animate(
              [
                { opacity: 1, transform: 'rotateX(0deg) perspective(0px)' },
                { opacity: 1, transform: 'rotateX(90deg) perspective(800px)' },
              ],
              { duration: 700 },
            )
            a.finished.then(done)
          }}
        >
          {current()}
        </Transition>
      </Show>
      <Show when={!animate()}>{current()}</Show>
    </Show>
  )
}

// Rotating single charity card (mirrors V1 CharityOverlay2)
export type Props = {
  headers?: string[]
  speed?: number // seconds per rotation; default 1
  includeTotals?: boolean // maps to showRaised
  theme?: 'default' | 'red' | 'blue' | 'carousel'
  headerTheme?: 'default' | 'red' | 'blue'
  showDesc?: boolean
  showQRCode?: boolean
  showUrl?: boolean
  causes?: number[]
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export const CharitiesOverlay: Component<Props> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Charities2OverlayBody {...props} />
    </QueryClientProvider>
  )
}

const Charities2OverlayBody: Component<Props> = (props) => {
  const header = () => props.headers ?? []
  const speed = () => clamp(Number(props.speed ?? 3), 1, 30)
  const theme = () => props.theme ?? 'default'
  const headerTheme = () => props.headerTheme ?? 'default'
  const showRaised = () => Boolean(props.includeTotals)
  const showDesc = () => Boolean(props.showDesc)
  const showQRCode = () => Boolean(props.showQRCode)
  const showUrl = () =>
    props.showUrl === undefined ? true : Boolean(props.showUrl)
  const causes = () => props.causes ?? []

  const q = useQuery(() =>
    orpcPrivate.overlay.charities.queryOptions({
      input: { includeTotals: showRaised() },
      staleTime: 5_000,
      refetchInterval: 5_000,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: true,
    }),
  )
  const charities = () => q.data ?? []
  const filteredCharities = () =>
    causes().length === 0
      ? charities()
      : charities().filter((c) => causes().includes(Number(c.id)))

  const [idx, setIdx] = createSignal(0)
  let timer: any

  onMount(() => {
    timer = setInterval(() => {
      if (filteredCharities().length > 0)
        setIdx((i) => (i + 1) % filteredCharities().length)
    }, speed() * 1000)
  })

  onCleanup(() => timer && clearInterval(timer))

  const currentTheme = (i: number) =>
    theme() === 'carousel'
      ? i % 3 === 0
        ? 'default'
        : i % 3 === 1
          ? 'red'
          : 'blue'
      : theme()

  const current = (): CharityItemT | undefined => {
    const list = filteredCharities()
    if (list.length === 0) return undefined
    return list[idx() % list.length]
  }

  return (
    <div class="flex h-full w-full flex-col">
      <OverlayHeader
        header={header()}
        headerTheme={headerTheme()}
        speed={speed()}
      />
      <div class="flex-1">
        <Show when={current()}>
          {(c) => (
            <Transition
              mode="outin"
              onEnter={(el: any, done: any) => {
                const a = el.animate(
                  [
                    {
                      opacity: 0,
                      transform: 'rotateY(-90deg) perspective(800px)',
                    },
                    { opacity: 1, transform: 'rotateY(0deg) perspective(0px)' },
                  ],
                  { duration: 900 },
                )
                a.finished.then(done)
              }}
              onExit={(el: any, done: any) => {
                const a = el.animate(
                  [
                    { opacity: 1, transform: 'rotateY(0deg) perspective(0px)' },
                    {
                      opacity: 0,
                      transform: 'rotateY(90deg) perspective(800px)',
                    },
                  ],
                  { duration: 900 },
                )
                a.finished.then(done)
              }}
            >
              <CharityItem
                charity={c() as CharityItemT}
                theme={currentTheme(idx())}
                showDesc={showDesc()}
                showQRCode={showQRCode()}
                showUrl={showUrl()}
                showRaised={showRaised()}
              />
            </Transition>
          )}
        </Show>
      </div>
    </div>
  )
}

const CharityItem: Component<{
  charity: CharityItemT
  theme: string
  showDesc: boolean
  showQRCode: boolean
  showUrl: boolean
  showRaised: boolean
}> = (props) => {
  const background = () =>
    props.theme === 'red'
      ? 'bg-primary-500'
      : props.theme === 'blue'
        ? 'bg-accent-500'
        : 'bg-white'
  const textColor = () =>
    props.theme === 'red' || props.theme === 'blue'
      ? 'text-white'
      : 'text-black'
  const raisedColor = () =>
    props.theme === 'red' || props.theme === 'blue'
      ? 'text-white'
      : 'text-primary-500'

  const qrCodeFG = () =>
    props.theme === 'red' || props.theme === 'blue' ? '#ffffff' : '#000000'
  const qrCodeBG = () =>
    props.theme === 'red'
      ? '#E21350'
      : props.theme === 'blue'
        ? '#3484BF'
        : '#ffffff'

  const charityUrl = () => {
    const raw = props.charity.websiteUrl ?? ''
    const url = raw
      .replace('https://', '')
      .replace('http://', '')
      .replace('www.', '')
    return url.endsWith('/') ? url.slice(0, -1) : url
  }
  const qrCodeSize = () => {
    let base = 64
    if (!props.showDesc) base += 24
    if (!props.showUrl) base += 12
    if (!props.showRaised) base += 12
    return base
  }

  const value = () => props.charity.amountRaised ?? 0

  return (
    <div class={'h-full p-2'}>
      <div
        class={twMerge(
          'flex h-full flex-col items-center justify-center rounded-2xl p-2 text-center font-bold shadow-xl transition-all',
          background(),
          textColor(),
        )}
      >
        <img
          class={'h-20 w-20 rounded-lg bg-white'}
          alt={''}
          src={props.charity.logoUrl ?? ''}
          loading={'eager'}
        />
        <p class={'line-clamp-2 overflow-hidden text-2xl'}>
          {props.charity.name}
        </p>
        <Show when={props.showRaised}>
          <p
            class={twMerge(
              'line-clamp-2 overflow-hidden text-xl',
              raisedColor(),
            )}
          >
            Raised{' '}
            <span>
              {new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
                maximumFractionDigits: 0,
              }).format(value())}
            </span>
          </p>
        </Show>
        <Show when={props.showDesc}>
          <p class={'line-clamp-3 text-center'}>{props.charity.description}</p>
        </Show>
        <Show when={props.showUrl && !props.showQRCode}>
          <p>{charityUrl()}</p>
        </Show>
        <Show when={props.showQRCode}>
          <div
            class={
              'flex w-full flex-1 flex-col content-center items-center justify-center gap-1 pt-2'
            }
          >
            <QRCodeSVG
              value={props.charity.websiteUrl ?? ''}
              level={'medium'}
              width={qrCodeSize()}
              height={qrCodeSize()}
              backgroundColor={qrCodeBG()}
              foregroundColor={qrCodeFG()}
              backgroundAlpha={1}
              foregroundAlpha={1}
            />
            <Show when={props.showUrl}>
              <p>{charityUrl()}</p>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  )
}
