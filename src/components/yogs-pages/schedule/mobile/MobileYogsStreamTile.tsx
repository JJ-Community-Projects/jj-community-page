import { type Component, Show } from 'solid-js'
import type { YogsStream } from '../../../../lib/orpc/private/yogs/contract.ts'
import { YogsScheduleDetailDialog } from '../YogsScheduleDetailDialog.tsx'
import { logSlotClick } from '../../../../lib/analytics.ts'
import { createModalSignal } from '../../../../lib/createModalSignal.ts'
import { useYogsSchedule } from '../provider/YogsScheduleProvider.tsx'
import {
  CreatorStack,
  useStreamState,
  VodIcons,
} from '../YogsStreamParts.tsx'
import {
  cn,
  dataColors,
  dataFill,
  dataFillInverted,
  focusRing,
  tileSurface,
} from '../../../ui/cn'

/** Height of one row (`min-h-14`); MobileYogsSchedule reserves a day with it. */
export const MOBILE_ROW_REM = 3.5

interface MobileScheduleBodyProps {
  stream: YogsStream
}

/**
 * One row of the mobile day list, in the extension's slot layout: a time block in the stream colour
 * (start, LIVE while live, end), title and subtitle, then the countdown or VOD icons and the creators'
 * avatars on the right. Size-1 slots (relay start / finish) show their start only.
 */
export const MobileYogsStreamTile: Component<MobileScheduleBodyProps> = (
  props,
) => {
  const stream = () => props.stream
  const { formatTimeStacked: time } = useYogsSchedule()
  const { isLive, showCountdown, ended, shortCountdown, label } =
    useStreamState(stream)
  const modal = createModalSignal()

  const color = () => stream().color

  return (
    <>
      <button
        type="button"
        class={cn(
          tileSurface,
          focusRing,
          'flex min-h-14 w-full overflow-hidden text-left transition-[box-shadow,opacity] duration-200 hover:shadow-tile-hover focus-visible:outline-white',
          ended() && 'opacity-80',
        )}
        aria-label={label()}
        onClick={() => {
          logSlotClick(stream())
          modal.open()
        }}
      >
        <span
          class={cn(
            'flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 px-1 py-2 text-center leading-tight tabular-nums whitespace-pre',
            dataFill,
          )}
          style={dataColors(color())}
        >
          <span class="text-xs font-bold">{time(stream().start)}</span>
          {/* Inverted colours so the label stands out inside the block */}
          <Show when={isLive()}>
            <span
              class={cn(
                'text-xxs animate-pulse rounded-full px-1.5 font-bold tracking-wide uppercase motion-reduce:animate-none',
                dataFillInverted,
              )}
            >
              Live
            </span>
          </Show>
          <Show when={stream().size > 1}>
            <span class="text-xxs opacity-90">{time(stream().end)}</span>
          </Show>
        </span>
        <span class="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
          <span
            class={cn(
              'text-sm leading-tight font-bold uppercase',
              stream().subtitle ? 'truncate' : 'line-clamp-2',
            )}
          >
            {stream().title}
          </span>
          <Show when={stream().subtitle}>
            <span class="text-fg-muted truncate text-xs uppercase">
              {stream().subtitle}
            </span>
          </Show>
        </span>
        <span class="text-fg-muted flex shrink-0 flex-col items-end justify-center gap-1 py-2 pr-2">
          <Show
            when={showCountdown()}
            fallback={<VodIcons stream={stream()} />}
          >
            <span class="text-xxs font-medium tabular-nums">
              {shortCountdown()}
            </span>
          </Show>
          <Show when={stream().creators?.length}>
            <CreatorStack creators={stream().creators!} compact />
          </Show>
        </span>
      </button>
      <YogsScheduleDetailDialog stream={props.stream} modalSignal={modal} />
    </>
  )
}
