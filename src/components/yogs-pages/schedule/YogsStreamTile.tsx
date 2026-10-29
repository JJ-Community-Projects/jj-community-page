import { type Component, Show } from 'solid-js'
import { YogsScheduleDetailDialog } from './YogsScheduleDetailDialog.tsx'
import { getTextColor } from '../../../lib/utils/textColors.ts'
import { useCreatorFilter } from './provider/CreatorFilterProvider.tsx'
import type { YogsStream } from '../../../lib/orpc/private/yogs/contract.ts'
import { logSlotClick } from '../../../lib/analytics.ts'
import { createModalSignal } from '../../../lib/createModalSignal.ts'
import { cn, focusRing } from '../../ui/cn'
import { LiveBadge } from '../../ui/Labels'
import {
  CountdownChip,
  LiveRing,
  useStreamState,
  VodIcons,
} from './YogsStreamParts.tsx'

interface YogsStreamTileProps {
  stream: YogsStream
}

const text = 'text-pretty font-bold uppercase'

// Font sizes by slot size, in container units of the tile: at 1280px they match the old fluid sizes
const titleClass = (size: number, hasSubtitle: boolean) => {
  if (size === 1) return cn(text, 'line-clamp-1 text-base tracking-wide')
  if (size === 2) {
    return hasSubtitle
      ? cn(text, 'line-clamp-2 text-[length:clamp(0.75rem,10.7cqi,1rem)] tracking-wide')
      : cn(text, 'line-clamp-2 text-[length:clamp(1rem,15.6cqi,1.5rem)] tracking-wide')
  }
  if (size === 3) return cn(text, 'text-[length:clamp(0.875rem,15.2cqi,1.5rem)] tracking-widest')
  if (size === 4) return cn(text, 'line-clamp-3 text-[length:clamp(0.875rem,15.2cqi,1.5rem)] tracking-widest')
  return cn(text, 'text-[length:clamp(0.875rem,18.3cqi,1.875rem)] tracking-widest')
}

const subtitleClass = (size: number) =>
  size <= 2
    ? 'text-pretty uppercase text-[length:clamp(0.75rem,9.7cqi,0.875rem)] tracking-wide'
    : 'text-pretty uppercase text-[length:clamp(0.75rem,10.7cqi,1rem)] tracking-widest'

const countdownSize = (size: number) =>
  size <= 1 ? 'text-xxs' : size <= 2 ? 'text-xs' : 'text-sm'

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
  // Filtered-out tiles stay clickable and focusable, only dimmed
  const dimmed = () => !isSlotPartOfFilter(stream())

  return (
    <>
      <div
        class="yogs-cell"
        style={{ height: `calc(${tileSize()} * var(--yogs-unit))` }}
      >
        <button
          type="button"
          class={cn(
            'rounded-tile relative flex size-full flex-col items-center justify-center overflow-hidden p-1 text-center @container',
            'hover:shadow-tile-hover transition-[filter,box-shadow,opacity] duration-200 hover:brightness-105',
            // White on the canvas reads better than accent next to the data colours; focus undims
            focusRing,
            'focus-visible:outline-white',
            dimmed() ? 'opacity-40 saturate-0' : ended() && 'opacity-80',
            'focus-visible:opacity-100 focus-visible:saturate-100',
          )}
          style={{
            'background-color': color(),
            color: getTextColor(color()),
          }}
          aria-label={label()}
          onClick={() => {
            logSlotClick(stream())
            modal.open()
          }}
        >
          <Show when={isLive()}>
            <LiveRing />
          </Show>
          <div class="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-0.5">
            <Show when={isLive() && tileSize() > 1}>
              <LiveBadge />
            </Show>
            <p class={titleClass(tileSize(), !!subtitle())}>{title()}</p>
            <Show when={subtitle() && tileSize() > 1}>
              <p class={subtitleClass(tileSize())}>{subtitle()}</p>
            </Show>
            <Show when={showCountdown()}>
              <CountdownChip color={color()} class={countdownSize(tileSize())}>
                {countdown()}
              </CountdownChip>
            </Show>
          </div>
          {/* VODs exist after the start; with a countdown the row would only crowd the tile */}
          <Show when={tileSize() > 1 && !showCountdown()}>
            <VodIcons stream={props.stream} class="justify-center" />
          </Show>
        </button>
      </div>
      <YogsScheduleDetailDialog stream={props.stream} modalSignal={modal} />
    </>
  )
}
