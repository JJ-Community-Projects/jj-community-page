import { type Component, For, Show } from 'solid-js'
import type {
  YogsCreator,
  YogsStream,
} from '../../../../lib/orpc/private/yogs/contract.ts'
import { getTextColor } from '../../../../lib/utils/textColors.ts'
import { YogsScheduleDetailDialog } from '../YogsScheduleDetailDialog.tsx'
import { logSlotClick } from '../../../../lib/analytics.ts'
import { createModalSignal } from '../../../../lib/createModalSignal.ts'
import { useYogsSchedule } from '../provider/YogsScheduleProvider.tsx'
import { useStreamState, VodIcons } from '../YogsStreamParts.tsx'
import { Avatar } from '../../../ui/Avatar'
import { cn, dataFill, focusRing, tileSurface } from '../../../ui/cn'
import { CREATOR_FALLBACK_COLOR } from '../../creators/YogsCreatorChip.tsx'

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
  const { toDateTime } = useYogsSchedule()
  const { isLive, showCountdown, ended, shortCountdown, label } =
    useStreamState(stream)
  const modal = createModalSignal()

  const color = () => stream().color
  const textColor = () => getTextColor(color())
  const time = (date: Date) => toDateTime(date).toFormat('HH:mm')

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
          class="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 px-1 py-2 leading-tight tabular-nums"
          style={{ 'background-color': dataFill(color()), color: textColor() }}
        >
          <span class="text-xs font-bold">{time(stream().start)}</span>
          {/* Inverted colours so the label stands out inside the block */}
          <Show when={isLive()}>
            <span
              class="text-xxs animate-pulse rounded-full px-1.5 font-bold tracking-wide uppercase motion-reduce:animate-none"
              style={{ 'background-color': textColor(), color: dataFill(color()) }}
            >
              Live
            </span>
          </Show>
          <Show when={stream().size > 1}>
            <span class="text-xxs opacity-80">{time(stream().end)}</span>
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
            <CreatorStack creators={stream().creators!} />
          </Show>
        </span>
      </button>
      <YogsScheduleDetailDialog stream={props.stream} modalSignal={modal} />
    </>
  )
}

/** Up to three overlapping creator avatars and a "+N" for the rest; the row's label carries the text. */
const CreatorStack: Component<{ creators: YogsCreator[] }> = (props) => {
  const shown = () => props.creators.slice(0, 3)
  const hidden = () => props.creators.length - shown().length
  return (
    <span class="flex items-center -space-x-1.5" aria-hidden="true">
      <For each={shown()}>
        {(creator) => (
          <Avatar
            src={creator.imageUrl}
            alt=""
            fallback={creator.name.charAt(0)}
            size="xs"
            shape="circle"
            ringColor={creator.color ?? CREATOR_FALLBACK_COLOR}
          />
        )}
      </For>
      <Show when={hidden() > 0}>
        <span class="bg-surface-strong text-fg ring-line text-xxs flex size-6 items-center justify-center rounded-full font-bold ring-1">
          +{hidden()}
        </span>
      </Show>
    </span>
  )
}
