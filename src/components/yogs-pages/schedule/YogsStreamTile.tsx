import {
  type Component,
  createEffect,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { YogsScheduleDetailDialog } from './YogsScheduleDetailDialog.tsx'
import { useCreatorFilter } from './provider/CreatorFilterProvider.tsx'
import type { YogsStream } from '../../../lib/orpc/private/yogs/contract.ts'
import { logSlotClick } from '../../../lib/analytics.ts'
import { createModalSignal } from '../../../lib/createModalSignal.ts'
import { cn, dataColors, dataFill, focusRing } from '../../ui/cn'
import { LiveBadge } from '../../ui/Labels'
import {
  CountdownChip,
  CreatorStack,
  LiveRing,
  useStreamState,
  VodIcons,
} from './YogsStreamParts.tsx'

interface YogsStreamTileProps {
  stream: YogsStream
}

const text = 'text-pretty font-bold uppercase'

// Font sizes by slot size, in container units of the tile: at 1280px they match the old fluid sizes.
// Their caps are multiples of --yogs-rem (yogs-schedule.css), so they keep growing with big grids.
// `--fit` (set by fitText) shrinks a long title and subtitle together until they fit the tile.
const titleClass = (size: number, hasSubtitle: boolean) => {
  if (size === 1) return cn(text, 'line-clamp-1 text-(length:--yogs-rem) tracking-wide')
  if (size === 2) {
    return hasSubtitle
      ? cn(text, 'line-clamp-2 text-[length:calc(clamp(0.75rem,10.7cqi,var(--yogs-rem))*var(--fit,1))] tracking-wide')
      : cn(text, 'line-clamp-2 text-[length:calc(clamp(1rem,15.6cqi,var(--yogs-rem)*1.5)*var(--fit,1))] tracking-wide')
  }
  if (size === 3) return cn(text, 'text-[length:calc(clamp(0.875rem,15.2cqi,var(--yogs-rem)*1.5)*var(--fit,1))] tracking-widest')
  if (size === 4) return cn(text, 'line-clamp-3 text-[length:calc(clamp(0.875rem,15.2cqi,var(--yogs-rem)*1.5)*var(--fit,1))] tracking-widest')
  return cn(text, 'text-[length:calc(clamp(0.875rem,18.3cqi,var(--yogs-rem)*1.875)*var(--fit,1))] tracking-widest')
}

const subtitleClass = (size: number) =>
  size <= 2
    ? 'text-pretty uppercase leading-tight text-[length:calc(clamp(0.75rem,9.7cqi,var(--yogs-rem)*0.875)*var(--fit,1))] tracking-wide'
    : 'text-pretty uppercase leading-tight text-[length:calc(clamp(0.75rem,10.7cqi,var(--yogs-rem))*var(--fit,1))] tracking-widest'

/** Smallest `--fit`: below it the title gets hard to read, so the rest is cut as before. */
const MIN_FIT = 0.6
const FIT_STEP = 0.05

/** Room the text keeps free in its tile, so a long title doesn't touch the edges. */
const FIT_SLACK_PX = 4

/** The text block doesn't fit the tile (with the slack): too tall, or a word wider than the tile. */
const overflows = (el: HTMLElement) => {
  const parts = [...el.children]
  if (parts.length === 0) return false
  const height =
    parts.at(-1)!.getBoundingClientRect().bottom -
    parts[0].getBoundingClientRect().top
  return (
    height > el.clientHeight - FIT_SLACK_PX ||
    [...el.querySelectorAll('p')].some((p) => p.scrollWidth > p.clientWidth + 1)
  )
}

/**
 * Shrinks the tile's text in small steps until it fits. Only touches tiles that overflow; runs after
 * mount (so the server markup is unchanged) and again when the tile is resized or the webfont loads.
 */
const fitText = (el: HTMLElement) => {
  let fit = 1
  el.style.setProperty('--fit', '1')
  while (fit > MIN_FIT && overflows(el)) {
    fit = Math.max(MIN_FIT, fit - FIT_STEP)
    el.style.setProperty('--fit', fit.toFixed(2))
  }
}

// The shared LiveBadge's text-xxs, padding, gap and dot in --yogs-rem, so it grows with the tile
const liveBadgeSize =
  'text-[length:calc(var(--yogs-rem)*0.625)]/[1.2] gap-[calc(var(--yogs-rem)*0.25)] px-[calc(var(--yogs-rem)*0.5)] py-[calc(var(--yogs-rem)*0.125)] [&>span]:size-[calc(var(--yogs-rem)*0.375)]'

// text-xxs, text-xs and text-sm (sizes and line heights) in --yogs-rem
const countdownSize = (size: number) =>
  size <= 1
    ? 'text-[length:calc(var(--yogs-rem)*0.625)]/[1.2]'
    : size <= 2
      ? 'text-[length:calc(var(--yogs-rem)*0.75)]/[1.333]'
      : 'text-[length:calc(var(--yogs-rem)*0.875)]/[1.429]'

export const YogsStreamTile: Component<YogsStreamTileProps> = (props) => {
  const modal = createModalSignal()

  const { isSlotPartOfFilter } = useCreatorFilter()
  const { isLive, showCountdown, ended, countdown, label } = useStreamState(
    () => props.stream,
  )

  const stream = () => props.stream
  const title = () => stream().title
  const subtitle = () => stream().subtitle
  const tileSize = () => stream().size
  const color = () => stream().color
  // VODs exist after the start only
  const showVods = () =>
    tileSize() > 1 && !showCountdown() && !!stream().vods?.length
  // Filtered-out tiles stay clickable and focusable, only dimmed
  const dimmed = () => !isSlotPartOfFilter(stream())

  let content!: HTMLDivElement
  onMount(() => {
    const observer = new ResizeObserver(() => fitText(content))
    observer.observe(content)
    onCleanup(() => observer.disconnect())
    void document.fonts.ready.then(() => fitText(content))
  })
  // The live badge and the countdown chip take room too
  createEffect(on([isLive, showCountdown], () => fitText(content), { defer: true }))

  return (
    <>
      <div
        class="yogs-tile-cell"
        style={{ height: `calc(${tileSize()} * var(--yogs-unit))` }}
      >
        <button
          type="button"
          class={cn(
            'rounded-tile relative flex size-full flex-col items-center justify-center overflow-hidden p-[calc(var(--yogs-rem)*0.25)] text-center @container',
            'hover:shadow-tile-hover transition-[filter,box-shadow,opacity] duration-200 hover:brightness-105',
            // White on the canvas reads better than accent next to the data colours; focus undims
            focusRing,
            'focus-visible:outline-white',
            dimmed() ? 'opacity-40 saturate-0' : ended() && 'opacity-80',
            'focus-visible:opacity-100 focus-visible:saturate-100',
            dataFill,
          )}
          style={dataColors(color())}
          aria-label={label()}
          onClick={() => {
            logSlotClick(stream())
            modal.open()
          }}
        >
          <Show when={isLive()}>
            <LiveRing />
          </Show>
          <div
            ref={content}
            class={cn(
              'flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-0',
              // Keeps the text below the VOD icons; fitText shrinks it into the rest
              showVods() && 'mt-[calc(var(--yogs-rem)*0.75)]',
            )}
          >
            <Show when={isLive() && tileSize() > 1}>
              <LiveBadge class={liveBadgeSize} />
            </Show>
            {/* After the size class: cn drops a leading-* that comes before a text size */}
            <p
              class={cn(titleClass(tileSize(), !!subtitle()), 'leading-tight')}
            >
              {title()}
            </p>
            <Show when={subtitle() && tileSize() > 1}>
              <p class={subtitleClass(tileSize())}>{subtitle()}</p>
            </Show>
            <Show when={showCountdown()}>
              <CountdownChip color={color()} class={countdownSize(tileSize())}>
                {countdown()}
              </CountdownChip>
            </Show>
          </div>
          <Show when={tileSize() > 1 && stream().creators?.length}>
            <CreatorStack
              creators={stream().creators!}
              max={5}
              class="yogs-avatars shrink-0 pt-[calc(var(--yogs-rem)*0.25)] pb-[calc(var(--yogs-rem)*0.125)]"
            />
          </Show>
          <Show when={showVods()}>
            <VodIcons
              stream={props.stream}
              class="absolute top-[calc(var(--yogs-rem)*0.25)] right-[calc(var(--yogs-rem)*0.375)]"
            />
          </Show>
        </button>
      </div>
      <YogsScheduleDetailDialog stream={props.stream} modalSignal={modal} />
    </>
  )
}
