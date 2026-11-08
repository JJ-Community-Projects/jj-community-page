import { type Component, For, Show } from 'solid-js'
import { DateTime } from 'luxon'
import { BiLogosTwitch, BiLogosYoutube } from 'solid-icons/bi'
import { isColorLight } from '../../../lib/utils/textColors.ts'
import { YogsStreamUtils } from '../../../lib/utils/YogsStreamUtils.ts'
import type {
  YogsCreator,
  YogsStream,
} from '../../../lib/orpc/private/yogs/contract.ts'
import { useYogsSchedule } from './provider/YogsScheduleProvider.tsx'
import { Avatar } from '../../ui/Avatar'
import { cn } from '../../ui/cn'
import { CREATOR_FALLBACK_COLOR } from '../creators/YogsCreatorChip.tsx'

/**
 * Clock-based state of one stream, shared by the desktop tile and the mobile row. Everything is
 * false until the island is mounted (see YogsScheduleProvider).
 */
export const useStreamState = (stream: () => YogsStream) => {
  const { mounted, now, isRunning, toDateTime, formatTime } = useYogsSchedule()

  const start = () => DateTime.fromJSDate(stream().start)
  const end = () => DateTime.fromJSDate(stream().end)
  const isLive = () => mounted() && start() < now() && end() > now()
  const showCountdown = () =>
    mounted() && YogsStreamUtils.isBefore(stream(), now())
  /** Ended while the schedule is running (so never on archive pages). */
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

  /** Narrow form for the mobile rows (as in the extension): "2d 3h", a ticking "02:14:09" on the day. */
  const shortCountdown = () => {
    const d = start().diff(now())
    return d.as('day') >= 1 ? d.toFormat("d'd' h'h'") : d.toFormat('hh:mm:ss')
  }

  /** "Title, Subtitle, Mon 1 Dec, 12:00 – 15:00[, live now]" */
  const label = () =>
    [
      stream().title,
      stream().subtitle,
      `${toDateTime(stream().start).toFormat('EEE d MMM')}, ${formatTime(stream().start)} – ${formatTime(stream().end)}`,
      isLive() && 'live now',
    ]
      .filter(Boolean)
      .join(', ')

  return { isLive, showCountdown, ended, countdown, shortCountdown, label }
}

/** The countdown as a chip, readable on light and dark stream colours. */
export const CountdownChip: Component<{
  color: string
  class?: string
  children: string
}> = (props) => (
  <span
    class={cn(
      'rounded-full px-[calc(var(--yogs-rem,1rem)*0.375)] font-sans font-semibold whitespace-nowrap tabular-nums',
      isColorLight(props.color) ? 'bg-black/10' : 'bg-black/15',
      props.class,
    )}
  >
    {props.children}
  </span>
)

/** The pulsing white ring of a live stream; inside a `relative` card. */
export const LiveRing: Component = () => (
  <span
    class="rounded-tile pointer-events-none absolute inset-0 animate-pulse ring-[length:calc(var(--yogs-rem,1rem)*0.125)] ring-white ring-inset motion-reduce:animate-none"
    aria-hidden="true"
  />
)

export const VodIcons: Component<{ stream: YogsStream; class?: string }> = (
  props,
) => {
  const { mounted } = useYogsSchedule()
  const types = () => props.stream.vods?.map((vod) => vod.type) ?? []

  // Drawn after hydration only: as inline SVGs in every tile they were a sixth of the server-rendered
  // page. The row keeps its height meanwhile.
  return (
    <Show when={types().length > 0}>
      <div
        class={cn(
          'flex min-h-[calc(var(--yogs-rem,1rem)*0.75)] items-center gap-[calc(var(--yogs-rem,1rem)*0.375)] opacity-80',
          props.class,
        )}
        aria-hidden="true"
      >
        <Show when={mounted()}>
          <Show when={types().includes('twitch')}>
            <BiLogosTwitch class="size-[calc(var(--yogs-rem,1rem)*0.75)]" />
          </Show>
          <Show when={types().includes('youtube')}>
            <BiLogosYoutube class="size-[calc(var(--yogs-rem,1rem)*0.75)]" />
          </Show>
        </Show>
      </div>
    </Show>
  )
}

/**
 * Overlapping creator avatars in at most `max` (3) circles: all of them when they fit, else `max - 1`
 * avatars and a "+N" (so N is always 2 or more, never "+1"). The slot's label carries the text.
 * `compact` shrinks the circles from 20px to 16px for the mobile rows; in the grid they grow with
 * --yogs-rem (yogs-schedule.css).
 */
export const CreatorStack: Component<{
  creators: YogsCreator[]
  max?: number
  compact?: boolean
  class?: string
}> = (props) => {
  const max = () => props.max ?? 3
  const circle = () =>
    props.compact
      ? 'size-4 text-xxxs'
      : 'size-[calc(var(--yogs-rem,1rem)*1.25)] text-[length:calc(var(--yogs-rem,1rem)*0.625)]'
  const shown = () =>
    props.creators.length <= max()
      ? props.creators
      : props.creators.slice(0, max() - 1)
  const hidden = () => props.creators.length - shown().length
  return (
    <span
      class={cn(
        'flex items-center',
        props.compact
          ? '-space-x-0.5'
          : '-space-x-[calc(var(--yogs-rem,1rem)*0.25)]',
        props.class,
      )}
      aria-hidden="true"
    >
      <For each={shown()}>
        {(creator) => (
          <Avatar
            src={creator.thumbnailUrl ?? creator.imageUrl}
            alt=""
            fallback={creator.name.charAt(0)}
            size="xs"
            shape="circle"
            ringColor={creator.color ?? CREATOR_FALLBACK_COLOR}
            class={circle()}
          />
        )}
      </For>
      <Show when={hidden() > 0}>
        <span
          class={cn(
            'bg-surface-strong text-fg ring-line flex items-center justify-center rounded-full font-bold ring-1',
            circle(),
          )}
        >
          +{hidden()}
        </span>
      </Show>
    </span>
  )
}
