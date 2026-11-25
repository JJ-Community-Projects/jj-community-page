import {
  type Component,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { cn } from '../../../ui/cn'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { demoCharities } from '../demoData.ts'
import { BG_PRESETS, type BgPreset } from '../donationMatches/presets.ts'
import { fitGrid } from './fitGrid.ts'

export type CharityLogosOverlayProps = {
  theme: BgPreset
  /** White rounded box behind each logo. */
  logoBg: boolean
  /** The charity's name under its logo. */
  names: boolean
  demo: boolean
}

// Name label, relative to the tile width: up to two lines under the logo.
// Every cell keeps room for two lines, so the rows line up.
const LABEL_FONT = 0.11
const LABEL_LEADING = 1.15
const LABEL_MARGIN = 0.05
const LABEL_HEIGHT = LABEL_MARGIN + 2 * LABEL_LEADING * LABEL_FONT

export const CharityLogosOverlay: Component<CharityLogosOverlayProps> = (props) => (
  <QueryClientProvider client={new QueryClient()}>
    <Body {...props} />
  </QueryClientProvider>
)

const Body: Component<CharityLogosOverlayProps> = (props) => {
  const q = useQuery(() =>
    orpcPrivate.overlay.charities.queryOptions({
      input: { currency: 'GBP' },
      enabled: !props.demo,
      // Logos hardly change: a slow refresh picks up a new charity during the event
      staleTime: 5 * 60_000,
      refetchInterval: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: true,
      placeholderData: (prev) => prev,
    }),
  )
  const charities = createMemo(() => {
    const all = (props.demo ? demoCharities('GBP') : q.data)?.charities ?? []
    return all.filter((c) => c.logoUrl)
  })

  // The browser source's size decides the layout
  let root!: HTMLDivElement
  const [size, setSize] = createSignal({ width: 0, height: 0 })
  onMount(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    )
    observer.observe(root)
    onCleanup(() => observer.disconnect())
  })
  const grid = createMemo(() =>
    fitGrid(
      charities().length,
      size().width,
      size().height,
      props.names ? 1 + LABEL_HEIGHT : 1,
    ),
  )

  return (
    <div
      ref={root}
      class={cn(
        'flex h-screen w-screen items-center justify-center overflow-hidden',
        BG_PRESETS[props.theme].text,
      )}
      style={{ background: BG_PRESETS[props.theme].background }}
    >
      <ul
        class="flex flex-wrap justify-center"
        style={{
          width: `${grid().columns * grid().tile + (grid().columns - 1) * grid().gap}px`,
          gap: `${grid().gap}px`,
        }}
      >
        <For each={charities()}>
          {(charity) => (
            <li
              class="flex shrink-0 flex-col items-center"
              style={{ width: `${grid().tile}px` }}
            >
              <div
                class={cn(
                  'flex shrink-0 items-center justify-center overflow-hidden',
                  props.logoBg && 'bg-white shadow-md',
                )}
                style={{
                  width: `${grid().tile}px`,
                  height: `${grid().tile}px`,
                  'border-radius': props.logoBg ? `${grid().tile * 0.12}px` : undefined,
                  padding: props.logoBg ? `${grid().tile * 0.06}px` : undefined,
                }}
              >
                <img
                  class="size-full object-contain"
                  alt={props.names ? '' : charity.name}
                  src={charity.logoUrl ?? ''}
                  loading="eager"
                />
              </div>
              <Show when={props.names}>
                <p
                  class={cn(
                    'line-clamp-2 w-full text-center font-bold wrap-break-word',
                    // Over the stream, a shadow keeps the white text readable
                    props.theme === 'transparent' && 'text-shadow-md',
                  )}
                  style={{
                    'font-size': `${grid().tile * LABEL_FONT}px`,
                    'line-height': LABEL_LEADING,
                    'margin-top': `${grid().tile * LABEL_MARGIN}px`,
                    height: `${grid().tile * 2 * LABEL_LEADING * LABEL_FONT}px`,
                  }}
                >
                  {charity.name}
                </p>
              </Show>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}
