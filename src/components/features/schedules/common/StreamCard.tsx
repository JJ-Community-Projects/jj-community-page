import { type Component, Show } from 'solid-js'
import type { Stream } from '../../../../lib/orpc/public/schemas/schedules.ts'
import { DateTime } from 'luxon'
import { useNow } from '../../../../lib/utils/useNow.ts'
import { createModalSignal } from '../../../../lib/createModalSignal.ts'
import {
  getStreamColor,
  getStreamColors,
} from '../../../../functions/jjDatesToColors.ts'
import { getTextColor } from '../../../../lib/utils/textColors.ts'
import { ScheduleStreamDetailDialog } from './ScheduleStreamDetailDialog.tsx'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema.ts'
import { Avatar } from '../../../ui/Avatar'
import { cn, dataFill, focusRing } from '../../../ui/cn'
import { LiveBadge } from '../../../ui/Labels'

/**
 * Custom hook that manages state for schedule stream cards
 * Handles countdown timers, live status, and color calculations
 */
const useScheduleStreamState = (
  stream: Stream,
  streamColor: string | undefined = undefined,
) => {
  const modal = createModalSignal()

  const now = useNow()

  // Convert UTC dates from backend to DateTime objects
  const getStreamStartDateTime = () => {
    // Create DateTime from JS Date, assuming it's in UTC, then convert to local time
    return DateTime.fromJSDate(stream.start, { zone: 'utc' }).toLocal()
  }

  const getStreamEndDateTime = () => {
    // Create DateTime from JS Date, assuming it's in UTC, then convert to local time
    return DateTime.fromJSDate(stream.end, { zone: 'utc' }).toLocal()
  }

  // Calculate the highlight color using getStreamColor
  const getHighlightColor = () => {
    if (streamColor) {
      return streamColor
    }

    const startDate = DateTime.fromJSDate(stream.start, { zone: 'utc' })
    // For color calculation, we still use UTC to maintain consistent colors
    return getStreamColor(startDate)
  }

  // Calculate the highlight color using getStreamColor
  const getHighlightColors = () => {
    if (streamColor) {
      return streamColor
    }
    // For color calculation, we still use UTC to maintain consistent colors
    const startDate = DateTime.fromJSDate(stream.start, { zone: 'utc' })
    return getStreamColors(startDate)
  }

  const showCountdown = () => {
    return getStreamStartDateTime() > now() && !stream.isTimeTBD
  }

  const isLive = () => {
    const start = getStreamStartDateTime()
    const end = getStreamEndDateTime()
    return start < now() && end > now()
  }

  const diff = () => {
    return getStreamStartDateTime().diff(now())
  }

  const countdown = () => {
    const d = diff()
    if (d.as('hour') < 1) {
      return d.toFormat("mm'm' ss's'")
    }
    if (d.as('day') < 1) {
      return d.toFormat("h'h' mm'm' ss's'")
    }
    return d.toFormat("d'd' hh'h' mm'm' ss's'")
  }

  const formatDate = () => {
    // Display date in user's local timezone

    if (stream.isTimeTBD) {
      return (
        getStreamStartDateTime().toLocaleString({
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }) + ' TBD'
      )
    }

    return getStreamStartDateTime().toLocaleString({
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
  }

  const highlightColor = getHighlightColor()
  const textColor = getTextColor(highlightColor)
  const pallet = getHighlightColors()

  return {
    modal,
    now,
    showCountdown,
    isLive,
    diff,
    countdown,
    formatDate,
    highlightColor,
    textColor,
    pallet,
  }
}

interface ScheduleStreamCardProps {
  stream: Stream
  user?: UserDisplay
  streamColor?: string
}

/**
 * One upcoming stream as a compact row: day-colour stripe, owner avatar, title, owner and time, and a
 * countdown or LIVE badge. Opens the stream's detail dialog. Sits on a tile or group surface.
 */
export const UpcomingStreamRow: Component<
  ScheduleStreamCardProps & { class?: string }
> = (props) => {
  const {
    modal,
    showCountdown,
    isLive,
    countdown,
    formatDate,
    highlightColor,
  } = useScheduleStreamState(props.stream, props.streamColor)

  return (
    <>
      <button
        type="button"
        class={cn(
          'rounded-group bg-surface-strong ring-line hover:bg-surface relative flex w-full min-w-0 items-center gap-2 overflow-hidden py-2 pr-2 pl-3.5 text-left ring-1 transition-colors',
          focusRing,
          props.class,
        )}
        onClick={modal.open}
      >
        <span
          class="absolute inset-y-0 left-0 w-1.5"
          style={{ 'background-color': highlightColor }}
          aria-hidden="true"
        />
        <Show when={props.user}>
          {(user) => (
            <Avatar
              src={user().profileImage}
              alt=""
              size="sm"
              fallback={user().username[0]}
            />
          )}
        </Show>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">{props.stream.title}</p>
          <p class="text-fg-muted truncate text-xs">
            <Show when={props.user}>{(user) => `${user().username} · `}</Show>
            {formatDate()}
          </p>
        </div>
        <Show when={isLive()}>
          <LiveBadge class="shrink-0" />
        </Show>
        <Show when={!isLive() && showCountdown()}>
          <span class="text-fg-muted text-xxs shrink-0 font-medium tabular-nums">
            {countdown()}
          </span>
        </Show>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
        user={props.user}
        color={highlightColor}
      />
    </>
  )
}

/**
 * A stream inside a day list (public and community schedule), in the extension's slot layout: a time
 * block in the day colour with start and end (LIVE joins it while live), title and subline, then the
 * countdown and the owner's avatar on the right. Opens the stream's detail dialog.
 */
export const StreamTimeRow: Component<
  ScheduleStreamCardProps & { class?: string }
> = (props) => {
  const { modal, showCountdown, isLive, countdown, highlightColor, textColor } =
    useScheduleStreamState(props.stream, props.streamColor)
  const time = (date: Date) =>
    DateTime.fromJSDate(date, { zone: 'utc' })
      .toLocal()
      .toLocaleString(DateTime.TIME_SIMPLE)
  const subline = () =>
    [props.user?.username, props.stream.subtitle].filter(Boolean).join(' · ')

  return (
    <>
      <button
        type="button"
        class={cn(
          'rounded-group bg-surface-strong ring-line hover:bg-surface flex min-h-14 w-full min-w-0 items-stretch gap-3 overflow-hidden text-left ring-1 transition-colors',
          focusRing,
          props.class,
        )}
        onClick={modal.open}
      >
        <span
          class="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 px-1 py-2 text-xs leading-tight font-semibold tabular-nums"
          style={{ 'background-color': dataFill(highlightColor), color: textColor }}
        >
          <Show when={!props.stream.isTimeTBD} fallback="TBD">
            <span>{time(props.stream.start)}</span>
            {/* Inverted colours so the label stands out inside the block */}
            <Show when={isLive()}>
              <span
                class="text-xxs rounded-full px-1.5 leading-tight font-bold tracking-wide uppercase"
                style={{ 'background-color': textColor, color: dataFill(highlightColor) }}
              >
                Live
              </span>
            </Show>
            <span class="opacity-80">{time(props.stream.end)}</span>
          </Show>
        </span>
        <span class="flex min-w-0 flex-1 flex-col justify-center py-2">
          <span class="block truncate text-sm font-semibold">
            {props.stream.title}
          </span>
          <Show when={subline()}>
            <span class="text-fg-muted block truncate text-xs">
              {subline()}
            </span>
          </Show>
        </span>
        <span class="flex shrink-0 flex-col items-end justify-center gap-1 py-2 pr-2">
          <Show when={showCountdown()}>
            <span class="text-fg-muted text-xxs font-medium tabular-nums">
              {countdown()}
            </span>
          </Show>
          <Show when={props.user}>
            {(user) => (
              <Avatar
                src={user().profileImage}
                alt=""
                size="sm"
                fallback={user().username[0]}
              />
            )}
          </Show>
        </span>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
        user={props.user}
        color={highlightColor}
      />
    </>
  )
}
