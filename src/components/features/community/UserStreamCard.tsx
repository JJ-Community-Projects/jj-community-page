import { type Component, Show } from 'solid-js'
import { twMerge } from 'tailwind-merge'
import { ScheduleStreamCard } from '../schedules/common/StreamCard'
import type { Stream } from '../../../lib/orpc/public/schemas/schedules'
import { createModalSignal } from '../../../lib/createModalSignal.ts'
import { useNow } from '../../../lib/utils/useNow.ts'
import { DateTime } from 'luxon'
import { getStreamColor, getStreamColors, } from '../../../functions/jjDatesToColors.ts'
import { getTextColor } from '../../../lib/utils/textColors.ts'
import { FaBrandsTwitch, FaBrandsYoutube, FaSolidUsers } from 'solid-icons/fa'
import { ScheduleStreamDetailDialog } from '../schedules/common/ScheduleStreamDetailDialog.tsx'

interface OwnerLite {
  username: string
  profileImage: string
}

interface Props {
  stream: Stream
  owner: OwnerLite
}
const useScheduleStreamState = (stream: Stream) => {
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
    // For color calculation, we still use UTC to maintain consistent colors
    const startDate = DateTime.fromJSDate(stream.start, { zone: 'utc' })
    return getStreamColor(startDate)
  }

  // Calculate the highlight color using getStreamColor
  const getHighlightColors = () => {
    // For color calculation, we still use UTC to maintain consistent colors
    const startDate = DateTime.fromJSDate(stream.start, { zone: 'utc' })
    return getStreamColors(startDate)
  }

  const showCountdown = () => {
    return getStreamStartDateTime() > now()
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

// Displays a stream together with its owner (avatar + name)
export const UserStreamCard: Component<Props> = (props) => {
  const {
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
  } = useScheduleStreamState(props.stream)


  return (
    <>
      {/* white card with content */}
      <button
        class="group relative flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-shadow duration-300 hover:shadow-lg"
        onClick={modal.open}
        style={{
          '--highlight-color': highlightColor,
          '--text-color': textColor,
        }}
      >
        {/* Overlay that animates from top to bottom on hover */}
        <div class="absolute inset-0 z-0 origin-top scale-y-0 transform rounded-2xl bg-gradient-to-b from-[var(--highlight-color)] to-[var(--highlight-color)] opacity-0 transition-all duration-500 ease-in-out group-hover:scale-y-100 group-hover:opacity-100" />

        {/* colored stripe at top */}
        <div
          class={twMerge(
            'z-10 h-6 w-full rounded-t-2xl px-4 py-2',
            isLive() && 'animate-pulse',
          )}
          style={{ 'background-color': highlightColor }}
        >
          <div class="flex h-full w-full flex-row items-center gap-2 text-[var(--text-color)]">
            <div class="flex flex-1 flex-row items-center gap-2">
              <Show when={props.stream.twitchVodUrl}>
                <FaBrandsTwitch />
              </Show>
              <Show when={props.stream.youtubeVodUrl}>
                <FaBrandsYoutube />
              </Show>
            </div>
            <Show when={props.stream.participants.length > 0}>
              <FaSolidUsers />
            </Show>
            <Show when={isLive()}>
              <div class="flex flex-row items-center gap-1">
                <p class="text-xs">LIVE</p>
                <div class={'h-2 w-2'}>
                  <span class="relative flex h-2 w-2">
                    <span
                      class={
                        'relative inline-flex h-full w-full rounded-full bg-red-500'
                      }
                    />
                    <span
                      class={
                        'absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 duration-700'
                      }
                    />
                  </span>
                </div>
              </div>
            </Show>
          </div>
        </div>

        <div class="relative z-10 flex flex-grow flex-col px-5 py-4 text-center transition-colors delay-100 duration-300 group-hover:text-[var(--text-color)]">
          <div class="flex w-full flex-col items-center justify-center">
            <p class="line-clamp-2 text-pretty text-lg font-bold uppercase tracking-widest">
              {props.stream.title}
            </p>
            <Show when={props.stream.subtitle}>
              <p class="line-clamp-1 text-pretty text-sm uppercase tracking-widest">
                {props.stream.subtitle}
              </p>
            </Show>
            <p class="text-sm">{formatDate()}</p>
            <Show when={showCountdown()}>
              <p class="line-clamp-1 font-mono text-xs font-bold lowercase tracking-wide">
                {countdown()}
              </p>
            </Show>
            <div class="flex items-center gap-2 px-1 pt-1">
              <img
                class="size-8 shrink-0 rounded-lg ring-1 ring-black/10"
                alt={props.owner.username}
                src={props.owner.profileImage}
                loading="lazy"
              />
              <div class="min-w-0">
                <p class="truncate text-ellipsis text-sm font-semibold">
                  {props.owner.username}
                </p>
              </div>
            </div>
          </div>
        </div>
      </button>
      <ScheduleStreamDetailDialog stream={props.stream} modalSignal={modal} />
    </>
  )

  return (
    <div
      class={twMerge(
        'w-full rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md',
        'hover:scale-101 hover:brightness-105',
        'bg-gradient-to-b from-neutral-50 to-neutral-100 ring-1 ring-black/5',
      )}
    >
      <div class="flex h-full w-full flex-col gap-2 p-2.5">
        <div class="flex items-center gap-2 px-1 pt-1">
          <img
            class="size-8 shrink-0 rounded-lg ring-1 ring-black/10"
            alt={props.owner.username}
            src={props.owner.profileImage}
            loading="lazy"
          />
          <div class="min-w-0">
            <p class="truncate text-ellipsis text-sm font-semibold text-neutral-900">
              {props.owner.username}
            </p>
          </div>
        </div>
        <div class="px-0.5">
          <ScheduleStreamCard stream={props.stream} type="top-bar" hover={true} />
        </div>
      </div>
    </div>
  )
}
