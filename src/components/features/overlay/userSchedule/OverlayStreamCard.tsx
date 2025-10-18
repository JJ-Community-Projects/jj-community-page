import { type Component, createMemo, createSignal, onCleanup, onMount, Show, } from 'solid-js'
import { DateTime } from 'luxon'
import { getTextColor } from '../../../../lib/utils/textColors.ts'

interface OverlayStreamCardProps {
  stream: {
    id: number
    start: Date
    end: Date
    title: string
    subtitle: string | null
    color?: string
  }
  timezone: string
}

// Internal timer signal to keep countdowns fresh without external hooks
const useNow = () => {
  const [now, setNow] = createSignal(Date.now())
  let t: any
  onMount(() => {
    t = setInterval(() => setNow(Date.now()), 1000)
  })
  onCleanup(() => t && clearInterval(t))
  return () => DateTime.fromMillis(now())
}

const useStreamTime = (props: OverlayStreamCardProps) => {
  const now = useNow()
  const start = createMemo(() =>
    DateTime.fromJSDate(props.stream.start, { zone: 'utc' }).setZone(
      props.timezone || 'UTC',
    ),
  )
  const end = createMemo(() =>
    DateTime.fromJSDate(props.stream.end, { zone: 'utc' }).setZone(
      props.timezone || 'UTC',
    ),
  )

  const showCountdown = () => start() > now()
  const isLive = () => now() >= start() && now() <= end()
  const diff = () => start().diff(now())
  const countdown = () => {
    const d = diff()
    if (d.as('hour') < 1) return d.toFormat("mm'm' ss's'")
    if (d.as('day') < 1) return d.toFormat("h'h' mm'm' ss's'")
    return d.toFormat("d'd' hh'h' mm'm' ss's'")
  }
  const formatDate = () =>
    start().toLocaleString(
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      },
      {
        locale: 'en-GB',
      },
    )

  return { now, start, end, showCountdown, isLive, countdown, formatDate }
}

export const OverlayStreamCardFilled: Component<OverlayStreamCardProps> = (
  props,
) => {
  const { showCountdown, isLive, countdown, formatDate } = useStreamTime(props)
  const bg = () => props.stream.color || '#6b7280' // default gray-500
  const text = () => getTextColor(bg())

  return (
    <div
      class="flex h-full w-full flex-col items-center justify-center rounded-2xl p-2 text-center"
      style={{ 'background-color': bg(), color: text() }}
    >
      <p class="line-clamp-2 text-pretty text-lg font-bold uppercase tracking-widest">
        {props.stream.title}
      </p>
      <Show when={props.stream.subtitle}>
        <p class="line-clamp-1 text-pretty text-sm uppercase tracking-widest">
          {props.stream.subtitle}
        </p>
      </Show>
      <p class="text-sm opacity-90">{formatDate()}</p>
      <Show when={isLive()}>
        <p class="line-clamp-1 font-mono text-xs font-bold tracking-wide opacity-95">LIVE</p>
      </Show>
      <Show when={showCountdown()}>
        <p class="line-clamp-1 font-mono text-xs font-bold lowercase tracking-wide opacity-95">
          {countdown()}
        </p>
      </Show>
    </div>
  )
}

export const OverlayStreamCardSidebar: Component<OverlayStreamCardProps> = (
  props,
) => {
  const { showCountdown, isLive, countdown, formatDate } = useStreamTime(props)
  const stripe = () => props.stream.color || '#6b7280'

  return (
    <div class="relative flex w-full flex-row overflow-hidden rounded-2xl bg-white">
      <div class="w-6 md:w-8" style={{ 'background-color': stripe() }} />
      <div class="flex flex-1 flex-col py-3 pl-2 pr-4 text-left">
        <p class="line-clamp-2 text-pretty text-lg font-bold uppercase tracking-widest text-gray-900">
          {props.stream.title}
        </p>
        <Show when={props.stream.subtitle}>
          <p class="line-clamp-1 text-pretty text-sm uppercase tracking-widest text-gray-700">
            {props.stream.subtitle}
          </p>
        </Show>
        <p class="text-sm text-gray-700">{formatDate()}</p>
        <Show when={isLive()}>
          <p class="line-clamp-1 font-mono text-xs font-bold tracking-wide text-gray-800">LIVE</p>
        </Show>
        <Show when={showCountdown()}>
          <p class="line-clamp-1 font-mono text-xs font-bold lowercase tracking-wide text-gray-800">
            {countdown()}
          </p>
        </Show>
      </div>
    </div>
  )
}
