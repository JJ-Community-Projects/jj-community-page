import { type Component, createMemo, Show } from 'solid-js'
import { DateTime } from 'luxon'
import { getTextColor } from '../../../../../lib/utils/textColors.ts'
import { useNow } from '../../../../../lib/utils/useNow.ts'
import { Avatar } from '../../../../ui/Avatar'
import { cn, tileSurface } from '../../../../ui/cn'

interface Owner {
  userId: number
  username: string
  profileImage?: string | null
  twitchLogin?: string | null
  tiltifySlug?: string | null
}

interface OverlayStreamCardProps {
  stream: {
    id: number
    start: Date
    end: Date
    title: string
    subtitle: string | null
    color?: string
    owner?: Owner
  }
  timezone: string
}

/**
 * One stream in the extension's slot layout (as MobileYogsStreamTile): a time block in the stream
 * colour (day, start, LIVE while live, end), title and subtitle, then the countdown and the owner's
 * avatar on the right. The list spans several days, so the block names the day too.
 */
export const OverlayStreamCard: Component<OverlayStreamCardProps> = (props) => {
  const now = useNow()
  const zoned = (date: Date) =>
    DateTime.fromJSDate(date, { zone: 'utc' }).setZone(props.timezone || 'UTC')
  const start = createMemo(() => zoned(props.stream.start))
  const end = createMemo(() => zoned(props.stream.end))

  const isLive = () => now() >= start() && now() <= end()
  const isBefore = () => start() > now()
  /** Narrow form, as in the extension: "2d 3h", a ticking "02:14:09" on the day. */
  const countdown = () => {
    const d = start().diff(now())
    return d.as('day') >= 1 ? d.toFormat("d'd' h'h'") : d.toFormat('hh:mm:ss')
  }

  const color = () => props.stream.color || '#6b7280' // default gray-500
  const textColor = () => getTextColor(color())

  return (
    <div class={cn(tileSurface, 'flex min-h-14 w-full overflow-hidden')}>
      <span
        class="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 px-1 py-2 leading-tight tabular-nums"
        style={{ 'background-color': color(), color: textColor() }}
      >
        <span class="text-xxs whitespace-nowrap opacity-80">
          {start().toFormat('d LLL', { locale: 'en-GB' })}
        </span>
        <span class="text-xs font-bold">{start().toFormat('HH:mm')}</span>
        {/* Inverted colours so the label stands out inside the block */}
        <Show when={isLive()}>
          <span
            class="text-xxs animate-pulse rounded-full px-1.5 font-bold tracking-wide uppercase motion-reduce:animate-none"
            style={{ 'background-color': textColor(), color: color() }}
          >
            Live
          </span>
        </Show>
        <span class="text-xxs opacity-80">{end().toFormat('HH:mm')}</span>
      </span>
      <span class="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
        <span
          class={cn(
            'text-sm leading-tight font-bold uppercase',
            props.stream.subtitle ? 'truncate' : 'line-clamp-2',
          )}
        >
          {props.stream.title}
        </span>
        <Show when={props.stream.subtitle}>
          <span class="text-fg-muted truncate text-xs uppercase">
            {props.stream.subtitle}
          </span>
        </Show>
      </span>
      <span class="text-fg-muted flex shrink-0 flex-col items-end justify-center gap-1 py-2 pr-2">
        <Show when={isBefore()}>
          <span class="text-xxs font-medium tabular-nums">{countdown()}</span>
        </Show>
        <Show when={props.stream.owner}>
          {(owner) => (
            <Avatar
              src={owner().profileImage}
              alt={owner().username}
              size="xs"
              shape="circle"
            />
          )}
        </Show>
      </span>
    </div>
  )
}
