import { type Component, Match, Show, Switch } from 'solid-js'
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
import { twMerge } from 'tailwind-merge'
import { FaBrandsTwitch, FaBrandsYoutube, FaSolidUsers } from 'solid-icons/fa'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema.ts'

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

interface Props {
  stream: Stream
  type: 'filled' | 'top-bar' | 'bottom-bar' | 'left-bar'
  hover: boolean
  user?: UserDisplay
}

export const ScheduleStreamCard: Component<Props> = (props) => {
  return (
    <Switch>
      <Match when={props.type === 'filled'}>
        <ScheduleStreamCardColored stream={props.stream} user={props.user} />
      </Match>
      <Match when={props.type === 'top-bar' && !props.hover}>
        <ScheduleStreamCardTopBar stream={props.stream} user={props.user} />
      </Match>
      <Match when={props.type === 'top-bar' && props.hover}>
        <ScheduleStreamCardTopBarHover
          stream={props.stream}
          user={props.user}
        />
      </Match>
      <Match when={props.type === 'bottom-bar' && !props.hover}>
        <ScheduleStreamCardBottomBar stream={props.stream} user={props.user} />
      </Match>
      <Match when={props.type === 'bottom-bar' && props.hover}>
        <ScheduleStreamCardBottomBarHover
          stream={props.stream}
          user={props.user}
        />
      </Match>
      <Match when={props.type === 'left-bar' && !props.hover}>
        <ScheduleStreamCardSidebar stream={props.stream} user={props.user} />
      </Match>
      <Match when={props.type === 'left-bar' && props.hover}>
        <ScheduleStreamCardSidebarHover
          stream={props.stream}
          user={props.user}
        />
      </Match>
    </Switch>
  )
}

interface ScheduleStreamCardProps {
  stream: Stream
  user?: UserDisplay
  streamColor?: string
}

/**
 * Main schedule stream card component
 * Displays stream information with colored background and countdown timer
 */
const ScheduleStreamCardColored: Component<ScheduleStreamCardProps> = (
  props,
) => {
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
  } = useScheduleStreamState(props.stream)

  return (
    <div class="h-full">
      <LiveStreamPulseWrapper isLive={isLive()}>
        <button
          class="flex h-full w-full flex-col items-center justify-center rounded-2xl p-3 text-center transition-all hover:scale-105 hover:brightness-105"
          style={{
            'background-color': highlightColor,
            color: textColor,
          }}
          onClick={() => modal.open()}
        >
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
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-white">LIVE</p>
            </Show>
            <UserInfo user={props.user} />
          </div>
        </button>
      </LiveStreamPulseWrapper>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
        user={props.user}
      />
    </div>
  )
}

/**
 * Alternative stream card with a colored sidebar on the left
 * Uses a white background with a colored stripe for visual distinction
 */
const ScheduleStreamCardSidebar: Component<ScheduleStreamCardProps> = (
  props,
) => {
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
        // class="w-full h-auto rounded-2xl flex flex-row bg-white"
        class="group relative flex w-full flex-row overflow-hidden rounded-2xl bg-white shadow-md transition-shadow duration-300 hover:shadow-lg"
        onClick={() => modal.open()}
      >
        {/* colored stripe */}
        <div
          class={twMerge('w-4 rounded-l-2xl', isLive() && 'animate-pulse')}
          style={{ 'background-color': highlightColor }}
        />

        <div class="flex flex-1 flex-col py-4 pl-2 pr-8 text-left">
          <div class="flex w-full origin-left flex-col items-start transition-transform group-hover:scale-105">
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
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-accent">LIVE</p>
            </Show>
            <UserInfo user={props.user} />
          </div>
        </div>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
        user={props.user}
      />
    </>
  )
}

/**
 * Alternative stream card with a colored sidebar and hover effect
 * Features a color fill animation that expands from left to right on hover
 */
const ScheduleStreamCardSidebarHover: Component<ScheduleStreamCardProps> = (
  props,
) => {
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
        // class="w-full h-auto rounded-2xl flex flex-row bg-white"
        class="group relative flex w-full flex-row overflow-hidden rounded-2xl bg-white shadow-md transition-shadow duration-300 hover:shadow-lg"
        onClick={() => modal.open()}
        style={{
          '--stream-highlight-color': highlightColor,
          '--stream-text-color': textColor,
        }}
      >
        {/* colored stripe */}
        <div
          class={twMerge('w-4 rounded-l-2xl', isLive() && 'animate-pulse')}
          style={{ 'background-color': highlightColor }}
        />

        {/* Overlay that animates from left to right on hover */}
        <div class="absolute inset-0 z-0 origin-left scale-x-0 transform rounded-2xl bg-gradient-to-r from-[var(--stream-highlight-color)] to-[var(--stream-highlight-color)] opacity-0 transition-all duration-500 ease-in-out group-hover:scale-x-100 group-hover:opacity-100" />

        <div class="z-2 relative flex flex-grow flex-col px-1 py-4 text-left transition-colors duration-300 group-hover:text-[var(--stream-text-color)]">
          <div class="flex w-full flex-col items-start">
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
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-accent group-hover:text-[var(--stream-text-color)]">
                LIVE
              </p>
            </Show>
            <UserInfo user={props.user} />
          </div>
        </div>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
        user={props.user}
      />
    </>
  )
}

/**
 * Alternative stream card with a colored bar at the bottom
 * Uses a white background with a colored stripe for visual distinction
 */
const ScheduleStreamCardBottomBar: Component<ScheduleStreamCardProps> = (
  props,
) => {
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
        onClick={() => modal.open()}
      >
        <div class="flex flex-grow flex-col px-5 py-4 text-center">
          <div class="flex w-full origin-center flex-col items-center justify-center transition-transform group-hover:scale-105">
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
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-accent">LIVE</p>
            </Show>
          </div>
          <UserInfo user={props.user} />
        </div>

        {/* colored stripe at bottom */}
        <div
          class={twMerge(
            'h-4 w-full rounded-b-2xl',
            isLive() && 'animate-pulse',
          )}
          style={{ 'background-color': highlightColor }}
        />
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
        user={props.user}
      />
    </>
  )
}

/**
 * Alternative stream card with a colored bar at the bottom and hover effect
 * Features a color fill animation that expands from bottom to top on hover
 */
const ScheduleStreamCardBottomBarHover: Component<ScheduleStreamCardProps> = (
  props,
) => {
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
          '--stream-highlight-color': highlightColor,
          '--stream-text-color': textColor,
        }}
      >
        {/* Overlay that animates from bottom to top on hover */}
        <div class="absolute inset-0 z-0 origin-bottom scale-y-0 transform rounded-2xl bg-gradient-to-t from-[var(--stream-highlight-color)] to-[var(--stream-highlight-color)] opacity-0 transition-all duration-500 ease-in-out group-hover:scale-y-100 group-hover:opacity-100" />

        <div class="z-2 relative flex flex-grow flex-col px-5 py-4 text-center transition-colors duration-300 group-hover:text-[var(--stream-text-color)]">
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
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-accent group-hover:text-[var(--stream-text-color)]">
                LIVE
              </p>
            </Show>
            <UserInfo user={props.user} />
          </div>
        </div>

        {/* colored stripe at bottom */}
        <div
          class={twMerge(
            'h-4 w-full rounded-b-2xl',
            isLive() && 'animate-pulse',
          )}
          style={{ 'background-color': highlightColor }}
        />
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
        user={props.user}
      />
    </>
  )
}

/**
 * Alternative stream card with a colored bar at the top
 * Uses a white background with a colored stripe for visual distinction
 */
const ScheduleStreamCardTopBar: Component<ScheduleStreamCardProps> = (
  props,
) => {
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
        onClick={() => modal.open()}
      >
        {/* colored stripe at top */}
        <div
          class={twMerge(
            'h-4 w-full rounded-t-2xl',
            isLive() && 'animate-pulse',
          )}
          style={{ 'background-color': highlightColor }}
        >
          <div class="h-full w-full">
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
          </div>
        </div>

        <div class="flex flex-grow flex-col px-5 py-4 text-center">
          <div class="flex w-full origin-center flex-col items-center justify-center transition-transform group-hover:scale-105">
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
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-accent">LIVE</p>
            </Show>
            <UserInfo user={props.user} />
          </div>
        </div>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
        user={props.user}
      />
    </>
  )
}

/**
 * Alternative stream card with a colored bar at the top and hover effect
 * Features a color fill animation that expands from top to bottom on hover
 */
const ScheduleStreamCardTopBarHover: Component<ScheduleStreamCardProps> = (
  props,
) => {
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
          '--stream-highlight-color': highlightColor,
          '--stream-text-color': textColor,
        }}
      >
        {/* Overlay that animates from top to bottom on hover */}
        <div class="absolute inset-0 z-0 origin-top scale-y-0 transform rounded-2xl bg-gradient-to-b from-[var(--stream-highlight-color)] to-[var(--stream-highlight-color)] opacity-0 transition-all duration-500 ease-in-out group-hover:scale-y-100 group-hover:opacity-100" />

        {/* colored stripe at top */}
        <div
          class={twMerge(
            'z-10 h-6 w-full rounded-t-2xl px-4 py-2',
            isLive() && 'animate-pulse',
          )}
          style={{ 'background-color': highlightColor }}
        >
          <div class="flex h-full w-full flex-row items-center gap-2 text-[var(--stream-text-color)]">
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

        <div class="relative z-10 flex flex-grow flex-col px-5 py-4 text-center transition-colors delay-100 duration-300 group-hover:text-[var(--stream-text-color)]">
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
            <UserInfo user={props.user} />
          </div>
        </div>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
        user={props.user}
      />
    </>
  )
}

/**
 * Component that displays a "LIVE" indicator with a pulsing red dot
 * Used to show when a stream is currently live
 */
const LiveStreamIndicator: Component = () => {
  return (
    <div class={'flex flex-row items-center justify-center gap-2 rounded px-1'}>
      <p class={'text-xs font-bold tracking-wide'}>LIVE</p>
      <div class={'h-2 w-2'}>
        <span class="relative flex h-2 w-2">
          <span
            class={'relative inline-flex h-full w-full rounded-full bg-red-500'}
          />
          <span
            class={
              'absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 duration-700'
            }
          />
        </span>
      </div>
    </div>
  )
}

interface LiveStreamPulseWrapperProps {
  isLive: boolean
  children: any
}

/**
 * Wrapper component that adds a pulsing animation effect when a stream is live
 * Provides consistent padding when not live
 */
const LiveStreamPulseWrapper: Component<LiveStreamPulseWrapperProps> = (
  props,
) => {
  return (
    <Switch>
      <Match when={props.isLive}>
        <div class="relative h-full w-full">
          <div class="absolute h-full w-full animate-pulse rounded-2xl bg-accent-300 duration-300"></div>
          <div class="absolute h-full w-full p-1">{props.children}</div>
        </div>
      </Match>
      <Match when={!props.isLive}>
        <div class="h-full w-full p-1">{props.children}</div>
      </Match>
    </Switch>
  )
}

const UserInfo: Component<{ user?: UserDisplay }> = (props) => {
  return (
    <Show when={props.user}>
      {(user) => {
        return (
          <div class="flex items-center gap-2 px-1 pt-1">
            <img
              class="size-8 shrink-0 rounded-lg ring-1 ring-black/10"
              alt={user().username}
              src={user().profileImage}
              loading="lazy"
            />
            <div class="min-w-0">
              <p class="truncate text-ellipsis text-sm font-semibold">
                {user().username}
              </p>
            </div>
          </div>
        )
      }}
    </Show>
  )
}

export const UpcomingStreamsStreamCard: Component<ScheduleStreamCardProps> = (
  props,
) => {
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
  } = useScheduleStreamState(props.stream, props.streamColor)

  const bg = () => {
    if (props.stream.id < 0) {
      return 'bg-primary-300 text-white'
    }
    return 'bg-white'
  }

  return (
    <>
      {/* white card with content */}
      <button
        class={twMerge(
          'group relative flex w-full flex-1 flex-col overflow-hidden rounded-2xl shadow-md transition-shadow duration-300 hover:shadow-lg',
          bg(),
        )}
        onClick={modal.open}
        style={{
          '--stream-highlight-color': highlightColor,
          '--stream-text-color': textColor,
        }}
      >
        {/* Overlay that animates from top to bottom on hover */}
        <div class="absolute inset-0 z-0 origin-top scale-y-0 transform rounded-2xl bg-gradient-to-b from-[var(--stream-highlight-color)] to-[var(--stream-highlight-color)] opacity-0 transition-all duration-500 ease-in-out group-hover:scale-y-100 group-hover:opacity-100" />

        {/* colored stripe at top */}
        <div
          class={twMerge(
            'z-10 h-6 w-full rounded-t-2xl px-4 py-2',
            isLive() && 'animate-pulse',
          )}
          style={{ 'background-color': highlightColor }}
        >
          <div class="flex h-full w-full flex-row items-center gap-2 text-[var(--stream-text-color)]">
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

        <div class="relative z-10 flex flex-grow flex-col p-2 text-left transition-colors delay-100 duration-300 group-hover:text-[var(--stream-text-color)]">
          <div
            class={
              'flex h-full w-full flex-row items-start justify-start gap-1'
            }
          >
            <div class="flex w-full flex-1 flex-col items-start justify-start">
              <p class="line-clamp-1 text-ellipsis text-xs font-bold uppercase">
                {props.stream.title}
              </p>
              <Show when={props.stream.subtitle}>
                <p class="line-clamp-1 text-ellipsis text-xs uppercase">
                  {props.stream.subtitle}
                </p>
              </Show>
              <p class="text-xs">{formatDate()}</p>
              <Show when={showCountdown()}>
                <p class="line-clamp-1 font-mono text-xxs font-bold lowercase tracking-wide">
                  {countdown()}
                </p>
              </Show>
            </div>

            <Show when={props.user}>
              {(user) => {
                return (
                  <div class="flex items-center gap-1">
                    <img
                      class="size-4 shrink-0 rounded-lg ring-1 ring-black/10"
                      alt={user().username}
                      src={user().profileImage}
                      loading="lazy"
                    />
                    <div class="min-w-0">
                      <p class="truncate text-ellipsis text-xs font-semibold">
                        {user().username}
                      </p>
                    </div>
                  </div>
                )
              }}
            </Show>
          </div>
        </div>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
        user={props.user}
      />
    </>
  )
}
