import { type Component, Show } from 'solid-js'
import { DateTime } from 'luxon'
import { BiLogosTwitch, BiLogosYoutube } from 'solid-icons/bi'
import { isColorLight } from '../../../lib/utils/textColors.ts'
import { YogsStreamUtils } from '../../../lib/utils/YogsStreamUtils.ts'
import type { YogsStream } from '../../../lib/orpc/private/yogs/contract.ts'
import { useYogsSchedule } from './provider/YogsScheduleProvider.tsx'
import { cn } from '../../ui/cn'

/**
 * Clock-based state of one stream, shared by the desktop tile and the mobile row. Everything is
 * false until the island is mounted (see YogsScheduleProvider).
 */
export const useStreamState = (stream: () => YogsStream) => {
  const { mounted, now, isRunning, toDateTime } = useYogsSchedule()

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

  /** "Title, Subtitle, Mon 1 Dec, 12:00 – 15:00[, live now]" */
  const label = () =>
    [
      stream().title,
      stream().subtitle,
      `${toDateTime(stream().start).toFormat('EEE d MMM, HH:mm')} – ${toDateTime(stream().end).toFormat('HH:mm')}`,
      isLive() && 'live now',
    ]
      .filter(Boolean)
      .join(', ')

  return { isLive, showCountdown, ended, countdown, label }
}

/** The countdown as a chip, readable on light and dark stream colours. */
export const CountdownChip: Component<{
  color: string
  class?: string
  children: string
}> = (props) => (
  <span
    class={cn(
      'rounded-full px-1.5 font-sans font-semibold whitespace-nowrap tabular-nums',
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
    class="rounded-tile pointer-events-none absolute inset-0 animate-pulse ring-2 ring-white ring-inset motion-reduce:animate-none"
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
        class={cn('flex min-h-3 items-center gap-1.5 opacity-80', props.class)}
        aria-hidden="true"
      >
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
