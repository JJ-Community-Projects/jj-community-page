import { type Component, Show } from 'solid-js'
import { YogsScheduleDetailDialog } from './YogsScheduleDetailDialog.tsx'
import { getTextColor, isColorLight } from '../../../lib/utils/textColors.ts'
import { BiLogosTwitch, BiLogosYoutube } from 'solid-icons/bi'
import { DateTime } from 'luxon'
import { useCreatorFilter } from './provider/CreatorFilterProvider.tsx'
import { YogsStreamUtils } from '../../../lib/utils/YogsStreamUtils.ts'
import type { YogsStream } from '../../../lib/orpc/private/yogs/contract.ts'
import { logSlotClick } from '../../../lib/analytics.ts'
import { createModalSignal } from '../../../lib/createModalSignal.ts'
import { useYogsSchedule } from './provider/YogsScheduleProvider.tsx'
import { cn, focusRing } from '../../ui/cn'
import { LiveBadge } from '../../ui/Labels'

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
  const { mounted, now, isRunning, toDateTime } = useYogsSchedule()

  const stream = () => props.stream
  const title = () => stream().title
  const subtitle = () => stream().subtitle
  const tileSize = () => stream().size
  const color = () => stream().color

  const start = () => DateTime.fromJSDate(stream().start)
  const end = () => DateTime.fromJSDate(stream().end)
  const isLive = () => mounted() && start() < now() && end() > now()
  const showCountdown = () => mounted() && YogsStreamUtils.isBefore(stream(), now())
  // Filtered-out tiles stay clickable and focusable, only dimmed; ended ones only while the event runs
  const dimmed = () => !isSlotPartOfFilter(stream())
  const ended = () => isRunning() && end() < now()

  const countdown = () => {
    const d = start().diff(now())
    if (d.as('hour') < 1) {
      return d.toFormat("mm'm' ss's'")
    }
    if (d.as('day') < 1) {
      return d.toFormat("h'h' mm'm' ss's'")
    }
    return d.toFormat("d'd' hh'h' mm'm' ss's'")
  }

  const label = () =>
    [
      title(),
      subtitle(),
      `${toDateTime(stream().start).toFormat('EEE d MMM, HH:mm')} – ${toDateTime(stream().end).toFormat('HH:mm')}`,
      isLive() && 'live now',
    ]
      .filter(Boolean)
      .join(', ')

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
            <span
              class="rounded-tile pointer-events-none absolute inset-0 animate-pulse ring-2 ring-white ring-inset motion-reduce:animate-none"
              aria-hidden="true"
            />
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
              <p
                class={cn(
                  'rounded-full px-1.5 font-sans font-semibold whitespace-nowrap tabular-nums',
                  countdownSize(tileSize()),
                  isColorLight(color()) ? 'bg-black/10' : 'bg-black/15',
                )}
              >
                {countdown()}
              </p>
            </Show>
          </div>
          {/* VODs exist after the start; with a countdown the row would only crowd the tile */}
          <Show when={tileSize() > 1 && !showCountdown()}>
            <VodIcons stream={props.stream} />
          </Show>
        </button>
      </div>
      <YogsScheduleDetailDialog stream={props.stream} modalSignal={modal} />
    </>
  )
}

const VodIcons: Component<{ stream: YogsStream }> = (props) => {
  const { mounted } = useYogsSchedule()
  const types = () => props.stream.vods?.map((vod) => vod.type) ?? []

  // Drawn after hydration only: as inline SVGs in every tile they were a sixth of the server-rendered
  // page. The row keeps its height meanwhile.
  return (
    <Show when={types().length > 0}>
      <div class="flex min-h-3 items-center justify-center gap-1.5 opacity-80" aria-hidden="true">
        <Show when={mounted()}>
          <Show when={types().includes('twitch')}>
            <BiLogosTwitch class="size-3" />
          </Show>
          <Show when={types().includes('youtube')}>
            <BiLogosYoutube class="size-3" />
          </Show>
        </Show>
      </div>
    </Show>
  )
}
