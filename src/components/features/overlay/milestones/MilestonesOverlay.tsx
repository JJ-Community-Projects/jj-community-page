import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { cn } from '../../../ui/cn'
import type { Currency } from '../overview/Common.tsx'
import { BG_PRESETS, type BgPreset } from '../donationMatches/presets.ts'
import {
  type BarGeometry,
  barGeometry,
  formatAmount,
  type GoalItem,
  type GoalOrder,
  milestoneWindow,
  reachedCount,
  type RowBox,
  type ShowCount,
} from '../goals/goalItems.ts'
import { itemBackgroundClass } from '../goals/itemBackground.ts'
import { listenDemoRaised } from './demoRaised.ts'

export type BarStyle = 'line' | 'solid'
export const parseBarStyle = (raw: string | null): BarStyle =>
  raw === 'solid' ? 'solid' : 'line'

export type MilestonesOverlayProps = {
  /** Tiltify slug of the fundraiser whose raised amount counts. */
  user?: string
  theme: BgPreset
  currency: Currency
  order: GoalOrder
  show: ShowCount
  bar: boolean
  barStyle: BarStyle
  crossOut: boolean
  itemBg: boolean
  title: string
  /** Sorted lowest first. */
  items: GoalItem[]
  /** Preview only: this raised amount instead of the live one. */
  demoRaised?: number
}

/**
 * The goal bar behind the dots: one track and one fill over the whole list, placed from
 * the measured rows. Bar pieces per row left hairline seams between rows at fractional
 * pixel positions (scaled previews, OBS scaling); a single element has none.
 */
const GoalBar: Component<{
  bar: BarGeometry
  order: GoalOrder
}> = (p) => (
  <div
    class="pointer-events-none absolute left-1.25 w-1.5"
    style={{ top: `${p.bar.top}px`, height: `${p.bar.height}px` }}
  >
    <div class="absolute inset-0 bg-current opacity-25" />
    <div
      class={cn(
        'absolute inset-0 bg-current',
        'transition-transform duration-900 ease-out',
        // Highest first: higher amounts sit above, so the bar fills upward
        p.order === 'desc' ? 'origin-bottom' : 'origin-top',
      )}
      style={{ transform: `scaleY(${p.bar.fill})` }}
    />
  </div>
)

/** Inside of a dot not reached yet: the panel colour hides the bar behind it; on the transparent theme a dark fill. */
const emptyDotFill = (theme: BgPreset) =>
  theme === 'transparent' ? 'var(--color-ink)' : BG_PRESETS[theme].background

/**
 * Solid style, like the campaign goal overlays: the empty bar in the theme colour, the fill
 * always white, in a frame (dark on the white panel). On a panel that already has the theme
 * colour the empty bar takes its darker shade, so it stands apart from the panel.
 */
const SOLID_FILL = 'white'
const SOLID_COLORS: Record<BgPreset, { empty: string; frame: string }> = {
  red: { empty: 'var(--color-primary-shade)', frame: 'white' },
  blue: { empty: 'var(--color-accent-shade)', frame: 'white' },
  black: { empty: 'black', frame: 'white' },
  white: { empty: 'var(--color-primary)', frame: 'var(--color-ink)' },
  transparent: { empty: 'var(--color-primary)', frame: 'white' },
}

const SolidGoalBar: Component<{
  bar: BarGeometry
  order: GoalOrder
  theme: BgPreset
}> = (p) => (
  <div
    // The frame is a box-shadow, not a border, so the fill spans the bar's full
    // height and meets each dot exactly where the geometry puts it
    class="pointer-events-none absolute left-0.75 w-3.5 overflow-hidden rounded-sm"
    style={{
      top: `${p.bar.top}px`,
      height: `${p.bar.height}px`,
      background: SOLID_COLORS[p.theme].empty,
      'box-shadow': `0 0 0 2px ${SOLID_COLORS[p.theme].frame}`,
    }}
  >
    <div
      class={cn(
        'absolute inset-0',
        'transition-transform duration-900 ease-out',
        p.order === 'desc' ? 'origin-bottom' : 'origin-top',
      )}
      style={{
        background: SOLID_FILL,
        transform: `scaleY(${p.bar.fill})`,
      }}
    />
  </div>
)

/** Solid style marks each milestone with a line across the bar, in the opposite colour of the bar under it. */
const solidTickColor = (theme: BgPreset, reached: boolean) =>
  reached ? SOLID_COLORS[theme].empty : SOLID_FILL

const HOLD_MS = 1500
// Same duration and easing as the bar fill's transition (duration-900 ease-out), so the
// fill's tip stays on the reached milestone's marker while the rows move
const MOVE_MS = 900
const MOVE_EASING = 'cubic-bezier(0, 0, 0.2, 1)'

const sameRows = (a: number[], b: number[]) =>
  a.length === b.length && a.every((index, i) => index === b[i])

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const Body: Component<MilestonesOverlayProps> = (props) => {
  const preset = () => BG_PRESETS[props.theme]

  const q = useQuery(() =>
    orpcPrivate.overlay.campaignGoalSlug.queryOptions({
      input: { tiltifySlug: props.user ?? '', currency: props.currency },
      enabled: !!props.user && props.demoRaised === undefined,
      staleTime: 10_000,
      refetchInterval: 30_000,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: true,
      placeholderData: (prev) => prev,
    }),
  )

  // Preview: starts at `demoRaised`, then follows the configurator's test amount
  const [demoRaised, setDemoRaised] = createSignal(props.demoRaised)
  if (props.demoRaised !== undefined) listenDemoRaised(setDemoRaised)

  const raised = () => demoRaised() ?? q.data?.raised ?? 0

  // Indices into the items (lowest first), in display order
  const visible = createMemo(() => {
    const { start, end } = milestoneWindow(
      props.items.length,
      reachedCount(props.items, raised()),
      props.show,
    )
    const indices = Array.from({ length: end - start }, (_, i) => start + i)
    return props.order === 'desc' ? indices.reverse() : indices
  })

  // Fractional rects, not offsetTop, so the bar meets the markers exactly
  let list: HTMLDivElement | undefined
  const [boxes, setBoxes] = createSignal<RowBox[]>([])
  const measure = () => {
    if (!list || !props.bar) return setBoxes([])
    const frame = list.getBoundingClientRect()
    const base = frame.top
    // Rects are in zoomed px under CSS zoom, the bar's top/height in CSS px: divide it out
    const zoom = list.offsetHeight ? frame.height / list.offsetHeight : 1
    const px = (y: number) => (y - base) / zoom
    setBoxes(
      // Only the list's own rows: leaving rows' copies sit outside the ul
      Array.from(list.querySelectorAll(':scope > ul > li'), (li) => {
        // The item box, not the row: the bar lines up with the boxes, not the spacing around them
        const row = (
          li.querySelector('[data-item-box]') ?? li
        ).getBoundingClientRect()
        const dot =
          li.querySelector('[data-dot]')?.getBoundingClientRect() ?? row
        return {
          top: px(row.top),
          bottom: px(row.bottom),
          dotTop: px(dot.top),
          dotBottom: px(dot.bottom),
        }
      }),
    )
  }
  // While the window moves, the rows carry translate animations and their rects are where
  // they are drawn, not where they sit. The list resizing then (rows of other heights came
  // in) must not measure: the bar would keep those offsets. The move measures once it ends.
  let moving = false
  const measureIfSettled = () => {
    if (!moving) measure()
  }
  onMount(() => {
    if (!list) return
    const observer = new ResizeObserver(measureIfSettled)
    observer.observe(list)
    onCleanup(() => observer.disconnect())
    void document.fonts?.ready.then(measureIfSettled)
  })

  // The milestones on screen trail `visible`: a reached milestone stays a moment so its
  // fill and cross-out read, then the list scrolls on. Rows in both windows glide to their
  // new place, leaving rows slide out past the end and new rows slide in from the other.
  // A change during the hold restarts it, so a run of donations moves the list once.
  const [shown, setShown] = createSignal(visible())
  let holdTimer: ReturnType<typeof setTimeout> | undefined

  const moveWindow = async () => {
    const next = visible()
    if (sameRows(next, shown())) return
    const el = list
    if (!el) return setShown(next)
    moving = true

    const frame = el.getBoundingClientRect()
    const zoom = el.offsetHeight ? frame.height / el.offsetHeight : 1
    const rows = () =>
      new Map(
        Array.from(
          el.querySelectorAll<HTMLElement>(':scope > ul > li'),
          (li) => [Number(li.dataset.index), li] as const,
        ),
      )
    const topOf = (li: HTMLElement) =>
      (li.getBoundingClientRect().top - el.getBoundingClientRect().top) / zoom

    const before = rows()
    const beforeTop = new Map([...before].map(([i, li]) => [i, topOf(li)]))
    const forward = Math.min(...next) > Math.min(...shown())
    // Lowest first puts higher amounts lower down, so moving forward scrolls up
    const dir = (props.order === 'asc') === forward ? -1 : 1

    // Leaving rows are removed on the swap: copies take their place for the slide out
    const leaving = [...before]
      .filter(([index]) => !next.includes(index))
      .map(([, li]) => {
        const copy = li.cloneNode(true) as HTMLElement
        copy.removeAttribute('data-index')
        Object.assign(copy.style, {
          position: 'absolute',
          left: '0',
          right: '0',
          top: `${topOf(li)}px`,
          pointerEvents: 'none',
        })
        return copy
      })

    setShown(next)
    // Before any animation starts: the rows are at their new places, untransformed
    measure()
    leaving.forEach((copy) => el.appendChild(copy))

    const after = rows()
    const still = reducedMotion()
    const staying = [...after].find(([index]) => beforeTop.has(index))
    // How far everything moves: what a row in both windows travels, else the old list's height
    const shift = still
      ? 0
      : staying
        ? topOf(staying[1]) - beforeTop.get(staying[0])!
        : dir * (el.getBoundingClientRect().height / zoom)
    const options = { duration: MOVE_MS, easing: MOVE_EASING }

    const animations = [
      ...leaving.map((copy) =>
        copy.animate(
          [
            { transform: 'translateY(0)', opacity: 1 },
            { opacity: 0, offset: 0.6 },
            { transform: `translateY(${shift}px)`, opacity: 0 },
          ],
          options,
        ),
      ),
      ...[...after]
        .filter(([index]) => !(still && beforeTop.has(index)))
        .map(([index, li]) =>
          beforeTop.has(index)
            ? li.animate(
                [
                  {
                    transform: `translateY(${beforeTop.get(index)! - topOf(li)}px)`,
                  },
                  { transform: 'translateY(0)' },
                ],
                options,
              )
            : li.animate(
                [
                  { transform: `translateY(${-shift}px)`, opacity: 0 },
                  { opacity: 0, offset: 0.3 },
                  { transform: 'translateY(0)', opacity: 1 },
                ],
                options,
              ),
        ),
    ]
    try {
      await Promise.all(animations.map((a) => a.finished))
    } finally {
      leaving.forEach((copy) => copy.remove())
      moving = false
      // Catches a resize skipped during the move (fonts, OBS source resized)
      measure()
    }
    if (!sameRows(visible(), shown())) scheduleMove()
  }
  const scheduleMove = () => {
    clearTimeout(holdTimer)
    if (!moving)
      holdTimer = setTimeout(
        // A rejection means an animation was cancelled (the overlay went away): just stop
        () => void moveWindow().catch(() => {}),
        HOLD_MS,
      )
  }
  createEffect(
    on(
      visible,
      (next) => {
        if (!sameRows(next, shown())) scheduleMove()
      },
      { defer: true },
    ),
  )
  onCleanup(() => clearTimeout(holdTimer))

  createEffect(on(shown, measure))
  const bar = createMemo(() =>
    barGeometry(props.items, shown(), boxes(), props.order, raised()),
  )

  return (
    <div
      class={cn('flex min-h-screen w-full flex-col gap-3 p-4', preset().text)}
      style={{ background: preset().background }}
    >
      <Show when={props.title}>
        <p class="text-center text-3xl font-bold">{props.title}</p>
      </Show>
      <Show
        when={props.items.length > 0}
        fallback={
          <p class="text-center text-lg opacity-80">No milestones set</p>
        }
      >
        <div ref={list} class="relative">
          <Show when={props.bar && bar()}>
            {(geometry) => (
              <Show
                when={props.barStyle === 'solid'}
                fallback={<GoalBar bar={geometry()} order={props.order} />}
              >
                <SolidGoalBar
                  bar={geometry()}
                  order={props.order}
                  theme={props.theme}
                />
              </Show>
            )}
          </Show>
          <ul
            class={cn('flex flex-col', !props.bar && !props.itemBg && 'gap-1')}
          >
            <For each={shown()}>
              {(index) => {
                const item = () => props.items[index]
                const reached = () => raised() >= item().value
                const crossed = () => props.crossOut && reached()
                return (
                  <li data-index={index} class="flex items-stretch gap-3">
                    <Show when={props.bar}>
                      <div
                        class={cn(
                          'flex shrink-0 flex-col items-center justify-center',
                          props.barStyle === 'solid' ? 'w-5' : 'w-4',
                        )}
                      >
                        {/* Positioned and after the bar in the DOM, so it paints on top of it.
                            data-dot: the marker's centre is the milestone's position on the bar */}
                        <Show
                          when={props.barStyle === 'solid'}
                          fallback={
                            <div
                              data-dot
                              class={cn(
                                'relative size-4 shrink-0 rounded-full border-2 border-current transition-colors duration-500',
                                reached() && 'bg-current',
                              )}
                              style={{
                                'background-color': reached()
                                  ? undefined
                                  : emptyDotFill(props.theme),
                              }}
                            />
                          }
                        >
                          <div
                            data-dot
                            class="relative h-0.5 w-3.5 shrink-0 transition-colors duration-500"
                            style={{
                              'background-color': solidTickColor(
                                props.theme,
                                reached(),
                              ),
                            }}
                          />
                        </Show>
                      </div>
                    </Show>
                    <div
                      data-item-box
                      class={cn(
                        'flex min-w-0 flex-1 items-baseline gap-2 py-1.5 text-lg transition-opacity duration-500',
                        props.itemBg && [
                          'my-1',
                          itemBackgroundClass(props.theme),
                        ],
                        reached() && 'opacity-60',
                        crossed() && 'line-through',
                      )}
                    >
                      <span class="shrink-0 font-bold tabular-nums">
                        {formatAmount(item().value, props.currency)}
                      </span>
                      <span class="min-w-0 wrap-break-word">{item().text}</span>
                    </div>
                  </li>
                )
              }}
            </For>
          </ul>
        </div>
      </Show>
    </div>
  )
}

export const MilestonesOverlay: Component<MilestonesOverlayProps> = (props) => (
  <QueryClientProvider client={new QueryClient()}>
    <Body {...props} />
  </QueryClientProvider>
)
