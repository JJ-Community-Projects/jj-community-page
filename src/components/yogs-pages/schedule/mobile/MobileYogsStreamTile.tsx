import { type Component, Show } from 'solid-js'
import type { YogsStream } from '../../../../lib/orpc/private/yogs/contract.ts'
import { getTextColor } from '../../../../lib/utils/textColors.ts'
import { YogsScheduleDetailDialog } from '../YogsScheduleDetailDialog.tsx'
import { logSlotClick } from '../../../../lib/analytics.ts'
import { createModalSignal } from '../../../../lib/createModalSignal.ts'
import { useYogsSchedule } from '../provider/YogsScheduleProvider.tsx'
import {
  CountdownChip,
  LiveRing,
  useStreamState,
  VodIcons,
} from '../YogsStreamParts.tsx'
import { cn, focusRing } from '../../../ui/cn'
import { LiveBadge } from '../../../ui/Labels'

/** Height of one slot unit in the mobile timeline; MobileYogsSchedule reserves a day with it. */
export const MOBILE_UNIT_REM = 2

interface MobileScheduleBodyProps {
  stream: YogsStream
}

/**
 * One row of the mobile day timeline: start / end on the canvas, the card in the stream colour,
 * at least as tall as the slot (as on the desktop grid). Size-1 slots (relay start / finish) are one line.
 */
export const MobileYogsStreamTile: Component<MobileScheduleBodyProps> = (
  props,
) => {
  const stream = () => props.stream
  const { toDateTime } = useYogsSchedule()
  const { isLive, showCountdown, ended, countdown, label } = useStreamState(
    stream,
  )
  const modal = createModalSignal()

  const color = () => stream().color
  const compact = () => stream().size <= 1

  const status = () => (
    <>
      <Show when={showCountdown()}>
        <CountdownChip color={color()} class="text-xs">
          {countdown()}
        </CountdownChip>
      </Show>
      <Show when={isLive()}>
        <LiveBadge />
      </Show>
    </>
  )

  return (
    <>
      <button
        type="button"
        class={cn(
          'group rounded-tile flex w-full gap-2 text-left',
          focusRing,
          'focus-visible:outline-white',
        )}
        aria-label={label()}
        onClick={() => {
          logSlotClick(stream())
          modal.open()
        }}
      >
        <span class="text-on-canvas flex w-11 shrink-0 flex-col items-end pt-2 text-sm leading-tight tabular-nums">
          <span class="font-semibold">
            {toDateTime(stream().start).toFormat('HH:mm')}
          </span>
          <Show when={!compact()}>
            <span class="text-on-canvas-muted text-xs">
              {toDateTime(stream().end).toFormat('HH:mm')}
            </span>
          </Show>
        </span>
        <span
          class={cn(
            'rounded-tile shadow-tile relative flex min-w-0 flex-1 overflow-hidden transition-[filter,box-shadow,opacity] duration-200 group-hover:brightness-105',
            compact()
              ? 'flex-row items-center justify-between gap-2 px-3 py-1.5'
              : 'flex-col justify-between gap-1 px-3 py-2.5',
            ended() && 'opacity-80',
          )}
          style={{
            'background-color': color(),
            color: getTextColor(color()),
            'min-height': `${stream().size * MOBILE_UNIT_REM}rem`,
          }}
        >
          <Show when={isLive()}>
            <LiveRing />
          </Show>
          <span class="font-babas flex min-w-0 flex-col tracking-wide">
            <span
              class={cn(
                'text-pretty uppercase',
                compact() ? 'line-clamp-1 text-base' : 'text-xl leading-tight',
              )}
            >
              {stream().title}
            </span>
            <Show when={!compact() && stream().subtitle}>
              <span class="text-sm uppercase">{stream().subtitle}</span>
            </Show>
          </span>
          <Show when={compact()} fallback={
            <span class="flex min-h-4 items-center justify-between gap-2">
              <Show when={!showCountdown()} fallback={<span />}>
                <VodIcons stream={stream()} />
              </Show>
              <span class="flex items-center gap-1.5">{status()}</span>
            </span>
          }>
            <span class="flex shrink-0 items-center gap-1.5">{status()}</span>
          </Show>
        </span>
      </button>
      <YogsScheduleDetailDialog stream={props.stream} modalSignal={modal} />
    </>
  )
}
