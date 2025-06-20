import {type Component, Match, Show, Switch} from "solid-js";
import type {DetailedStream} from "../../../../lib/db/models/schedule-ui.ts";
import {DateTime} from "luxon";
import {useNow} from "../../../../lib/utils/useNow.ts";
import {createModalSignal} from "../../../../lib/createModalSignal.ts";
import {getStreamColor, getStreamColors} from "../../../../functions/jjDatesToColors.ts";
import {getTextColor} from "../../../../lib/utils/textColors.ts";
import {ScheduleStreamDetailDialog} from "./ScheduleStreamDetailDialog.tsx";
import {twMerge} from "tailwind-merge";

/**
 * Custom hook that manages state for schedule stream cards
 * Handles countdown timers, live status, and color calculations
 */
const useScheduleStreamState = (stream: DetailedStream) => {
  const modal = createModalSignal();

  const now = useNow();

  // Calculate the highlight color using getStreamColor
  const getHighlightColor = () => {
    const startDate = DateTime.fromJSDate(stream.start).setZone('utc');
    return getStreamColor(startDate);
  };
  // Calculate the highlight color using getStreamColor
  const getHighlightColors = () => {
    const startDate = DateTime.fromJSDate(stream.start).setZone('utc');
    return getStreamColors(startDate);
  };

  const showCountdown = () => {
    return DateTime.fromJSDate(stream.start).setZone('utc') > now();
  };

  const isLive = () => {
    const start = DateTime.fromJSDate(stream.start).setZone('utc');
    const end = DateTime.fromJSDate(stream.end).setZone('utc');
    return start < now() && end > now();
  };

  const diff = () => {
    return DateTime.fromJSDate(stream.start).setZone('utc').diff(now());
  };

  const countdown = () => {
    const d = diff();
    if (d.as('hour') < 1) {
      return d.toFormat("mm'm' ss's'");
    }
    if (d.as('day') < 1) {
      return d.toFormat("h'h' mm'm' ss's'");
    }
    return d.toFormat("d'd' hh'h' mm'm' ss's'");
  };

  const formatDate = () => {
    return DateTime.fromJSDate(stream.start).setZone('utc').toLocaleString({
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const highlightColor = getHighlightColor();
  const textColor = getTextColor(highlightColor);
  const pallet = getHighlightColors()

  return {
    modal, now, showCountdown, isLive, diff, countdown, formatDate, highlightColor, textColor, pallet
  }

}


interface Props {
  stream: DetailedStream;
  type: 'filled' | 'top-bar' | 'bottom-bar' | 'left-bar'
  hover: boolean
}

export const ScheduleStreamCard: Component<Props> = (props) => {
  return (
    <Switch>
      <Match when={props.type === 'filled'}>
        <ScheduleStreamCardColored stream={props.stream}/>
      </Match>
      <Match when={props.type === 'top-bar' && !props.hover}>
        <ScheduleStreamCardTopBar stream={props.stream}/>
      </Match>
      <Match when={props.type === 'top-bar' && props.hover}>
        <ScheduleStreamCardTopBarHover stream={props.stream}/>
      </Match>
      <Match when={props.type === 'bottom-bar' && !props.hover}>
        <ScheduleStreamCardBottomBar stream={props.stream}/>
      </Match>
      <Match when={props.type === 'bottom-bar' && props.hover}>
        <ScheduleStreamCardBottomBarHover stream={props.stream}/>
      </Match>
      <Match when={props.type === 'left-bar' && !props.hover}>
        <ScheduleStreamCardSidebar stream={props.stream}/>
      </Match>
      <Match when={props.type === 'left-bar' && props.hover}>
        <ScheduleStreamCardSidebarHover stream={props.stream}/>
      </Match>
    </Switch>
  );
}

interface ScheduleStreamCardProps {
  stream: DetailedStream;
}

/**
 * Main schedule stream card component
 * Displays stream information with colored background and countdown timer
 */
const ScheduleStreamCardColored: Component<ScheduleStreamCardProps> = (props) => {

  const {
    modal, now, showCountdown, isLive, diff, countdown, formatDate, highlightColor, textColor
  } = useScheduleStreamState(props.stream)

  return (
    <div class="h-full">
      <LiveStreamPulseWrapper isLive={isLive()}>
        <button
          class="w-full h-full rounded-2xl p-3 flex flex-col text-center items-center justify-center transition-all hover:scale-105 hover:brightness-105"
          style={{
            'background-color': highlightColor,
            'color': textColor
          }}
          onClick={() => modal.open()}
        >
          <div class="flex flex-col items-center justify-center w-full">
            <p class="text-lg font-bold tracking-widest uppercase text-pretty line-clamp-2">{props.stream.title}</p>
            <Show when={props.stream.subtitle}>
              <p class="text-sm tracking-widest uppercase text-pretty line-clamp-1">{props.stream.subtitle}</p>
            </Show>
            <p class="text-sm">{formatDate()}</p>
            <Show when={showCountdown()}>
              <p class="font-mono text-xs font-bold lowercase tracking-wide line-clamp-1">{countdown()}</p>
            </Show>
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-white">LIVE</p>
            </Show>
          </div>
        </button>
      </LiveStreamPulseWrapper>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
      />
    </div>
  );
}


/**
 * Alternative stream card with a colored sidebar on the left
 * Uses a white background with a colored stripe for visual distinction
 */
const ScheduleStreamCardSidebar: Component<ScheduleStreamCardProps> = (props) => {
  const {
    modal, now, showCountdown, isLive, diff, countdown, formatDate, highlightColor, textColor, pallet
  } = useScheduleStreamState(props.stream)
  return (
    <>
      {/* white card with content */}
      <button
        // class="w-full h-auto rounded-2xl flex flex-row bg-white"
        class="relative overflow-hidden group w-full rounded-2xl flex flex-row bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
        onClick={() => modal.open()}
      >
        {/* colored stripe */}
        <div
          class={twMerge("w-4 rounded-l-2xl", isLive() && 'animate-pulse')}
          style={{'background-color': highlightColor}}/>

        <div class="flex-1 flex flex-col text-left py-4 pl-2 pr-8">
          <div class="flex flex-col items-start w-full transition-transform origin-left group-hover:scale-105">
            <p class="text-lg font-bold tracking-widest uppercase text-pretty line-clamp-2">{props.stream.title}</p>
            <Show when={props.stream.subtitle}>
              <p class="text-sm tracking-widest uppercase text-pretty line-clamp-1">{props.stream.subtitle}</p>
            </Show>
            <p class="text-sm">{formatDate()}</p>
            <Show when={showCountdown()}>
              <p class="font-mono text-xs font-bold lowercase tracking-wide line-clamp-1">{countdown()}</p>
            </Show>
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-accent">LIVE</p>
            </Show>
          </div>
        </div>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
      />
    </>
  )
}


/**
 * Alternative stream card with a colored sidebar and hover effect
 * Features a color fill animation that expands from left to right on hover
 */
const ScheduleStreamCardSidebarHover: Component<ScheduleStreamCardProps> = (props) => {
  const {
    modal, now, showCountdown, isLive, diff, countdown, formatDate, highlightColor, textColor, pallet
  } = useScheduleStreamState(props.stream)
  return (
    <>
      {/* white card with content */}
      <button
        // class="w-full h-auto rounded-2xl flex flex-row bg-white"
        class="relative overflow-hidden group w-full rounded-2xl flex flex-row bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
        onClick={() => modal.open()}
        style={{
          '--highlight-color': highlightColor,
          '--text-color': textColor
        }}
      >
        {/* colored stripe */}
        <div
          class={twMerge("w-4 rounded-l-2xl", isLive() && 'animate-pulse')}
          style={{'background-color': highlightColor}}/>

        {/* Overlay that animates from left to right on hover */}
        <div
          class="absolute inset-0 z-0 bg-gradient-to-r from-[var(--highlight-color)] to-[var(--highlight-color)] opacity-0 group-hover:opacity-100 rounded-2xl origin-left transform scale-x-0 group-hover:scale-x-100 transition-all ease-in-out duration-500"
        />

        <div
          class="flex-grow flex flex-col text-left py-4 px-1 relative z-2 group-hover:text-[var(--text-color)] transition-colors duration-300">
          <div class="flex flex-col items-start w-full">
            <p class="text-lg font-bold tracking-widest uppercase text-pretty line-clamp-2">{props.stream.title}</p>
            <Show when={props.stream.subtitle}>
              <p class="text-sm tracking-widest uppercase text-pretty line-clamp-1">{props.stream.subtitle}</p>
            </Show>
            <p class="text-sm">{formatDate()}</p>
            <Show when={showCountdown()}>
              <p class="font-mono text-xs font-bold lowercase tracking-wide line-clamp-1">{countdown()}</p>
            </Show>
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-accent group-hover:text-[var(--text-color)]">LIVE</p>
            </Show>
          </div>
        </div>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
      />
    </>
  )
}

/**
 * Alternative stream card with a colored bar at the bottom
 * Uses a white background with a colored stripe for visual distinction
 */
const ScheduleStreamCardBottomBar: Component<ScheduleStreamCardProps> = (props) => {
  const {
    modal, now, showCountdown, isLive, diff, countdown, formatDate, highlightColor, textColor, pallet
  } = useScheduleStreamState(props.stream)
  return (
    <>
      {/* white card with content */}
      <button
        class="relative overflow-hidden group w-full rounded-2xl flex flex-col bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
        onClick={() => modal.open()}
      >
        <div class="flex-grow flex flex-col text-center py-4 px-5">
          <div class="flex flex-col items-center justify-center w-full transition-transform origin-center group-hover:scale-105">
            <p class="text-lg font-bold tracking-widest uppercase text-pretty line-clamp-2">{props.stream.title}</p>
            <Show when={props.stream.subtitle}>
              <p class="text-sm tracking-widest uppercase text-pretty line-clamp-1">{props.stream.subtitle}</p>
            </Show>
            <p class="text-sm">{formatDate()}</p>
            <Show when={showCountdown()}>
              <p class="font-mono text-xs font-bold lowercase tracking-wide line-clamp-1">{countdown()}</p>
            </Show>
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-accent">LIVE</p>
            </Show>
          </div>
        </div>

        {/* colored stripe at bottom */}
        <div
          class={twMerge("h-4 w-full rounded-b-2xl", isLive() && 'animate-pulse')}
          style={{'background-color': highlightColor}}/>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
      />
    </>
  )
}

/**
 * Alternative stream card with a colored bar at the bottom and hover effect
 * Features a color fill animation that expands from bottom to top on hover
 */
const ScheduleStreamCardBottomBarHover: Component<ScheduleStreamCardProps> = (props) => {
  const {
    modal, now, showCountdown, isLive, diff, countdown, formatDate, highlightColor, textColor, pallet
  } = useScheduleStreamState(props.stream)
  return (
    <>
      {/* white card with content */}
      <button
        class="relative overflow-hidden group w-full rounded-2xl flex flex-col bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
        onClick={() => modal.open()}
        style={{
          '--highlight-color': highlightColor,
          '--text-color': textColor
        }}
      >
        {/* Overlay that animates from bottom to top on hover */}
        <div
          class="absolute inset-0 z-0 bg-gradient-to-t from-[var(--highlight-color)] to-[var(--highlight-color)] opacity-0 group-hover:opacity-100 rounded-2xl origin-bottom transform scale-y-0 group-hover:scale-y-100 transition-all ease-in-out duration-500"
        />

        <div class="flex-grow flex flex-col text-center py-4 px-5 relative z-2 group-hover:text-[var(--text-color)] transition-colors duration-300">
          <div class="flex flex-col items-center justify-center w-full">
            <p class="text-lg font-bold tracking-widest uppercase text-pretty line-clamp-2">{props.stream.title}</p>
            <Show when={props.stream.subtitle}>
              <p class="text-sm tracking-widest uppercase text-pretty line-clamp-1">{props.stream.subtitle}</p>
            </Show>
            <p class="text-sm">{formatDate()}</p>
            <Show when={showCountdown()}>
              <p class="font-mono text-xs font-bold lowercase tracking-wide line-clamp-1">{countdown()}</p>
            </Show>
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-accent group-hover:text-[var(--text-color)]">LIVE</p>
            </Show>
          </div>
        </div>

        {/* colored stripe at bottom */}
        <div
          class={twMerge("h-4 w-full rounded-b-2xl", isLive() && 'animate-pulse')}
          style={{'background-color': highlightColor}}/>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
      />
    </>
  )
}

/**
 * Alternative stream card with a colored bar at the top
 * Uses a white background with a colored stripe for visual distinction
 */
const ScheduleStreamCardTopBar: Component<ScheduleStreamCardProps> = (props) => {
  const {
    modal, now, showCountdown, isLive, diff, countdown, formatDate, highlightColor, textColor, pallet
  } = useScheduleStreamState(props.stream)
  return (
    <>
      {/* white card with content */}
      <button
        class="relative overflow-hidden group w-full rounded-2xl flex flex-col bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
        onClick={() => modal.open()}
      >
        {/* colored stripe at top */}
        <div
          class={twMerge("h-4 w-full rounded-t-2xl", isLive() && 'animate-pulse')}
          style={{'background-color': highlightColor}}/>

        <div class="flex-grow flex flex-col text-center py-4 px-5">
          <div class="flex flex-col items-center justify-center w-full transition-transform origin-center group-hover:scale-105">
            <p class="text-lg font-bold tracking-widest uppercase text-pretty line-clamp-2">{props.stream.title}</p>
            <Show when={props.stream.subtitle}>
              <p class="text-sm tracking-widest uppercase text-pretty line-clamp-1">{props.stream.subtitle}</p>
            </Show>
            <p class="text-sm">{formatDate()}</p>
            <Show when={showCountdown()}>
              <p class="font-mono text-xs font-bold lowercase tracking-wide line-clamp-1">{countdown()}</p>
            </Show>
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-accent">LIVE</p>
            </Show>
          </div>
        </div>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
      />
    </>
  )
}

/**
 * Alternative stream card with a colored bar at the top and hover effect
 * Features a color fill animation that expands from top to bottom on hover
 */
const ScheduleStreamCardTopBarHover: Component<ScheduleStreamCardProps> = (props) => {
  const {
    modal, now, showCountdown, isLive, diff, countdown, formatDate, highlightColor, textColor, pallet
  } = useScheduleStreamState(props.stream)
  return (
    <>
      {/* white card with content */}
      <button
        class="relative overflow-hidden group w-full rounded-2xl flex flex-col bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
        onClick={() => modal.open()}
        style={{
          '--highlight-color': highlightColor,
          '--text-color': textColor
        }}
      >
        {/* colored stripe at top */}
        <div
          class={twMerge("h-4 w-full rounded-t-2xl", isLive() && 'animate-pulse')}
          style={{'background-color': highlightColor}}/>

        {/* Overlay that animates from top to bottom on hover */}
        <div
          class="absolute inset-0 z-0 bg-gradient-to-b from-[var(--highlight-color)] to-[var(--highlight-color)] opacity-0 group-hover:opacity-100 rounded-2xl origin-top transform scale-y-0 group-hover:scale-y-100 transition-all ease-in-out duration-500"
        />

        <div class="flex-grow flex flex-col text-center py-4 px-5 relative z-2 group-hover:text-[var(--text-color)] transition-colors duration-300">
          <div class="flex flex-col items-center justify-center w-full">
            <p class="text-lg font-bold tracking-widest uppercase text-pretty line-clamp-2">{props.stream.title}</p>
            <Show when={props.stream.subtitle}>
              <p class="text-sm tracking-widest uppercase text-pretty line-clamp-1">{props.stream.subtitle}</p>
            </Show>
            <p class="text-sm">{formatDate()}</p>
            <Show when={showCountdown()}>
              <p class="font-mono text-xs font-bold lowercase tracking-wide line-clamp-1">{countdown()}</p>
            </Show>
            <Show when={!showCountdown() && isLive()}>
              <p class="text-md font-bold tracking-wide text-accent group-hover:text-[var(--text-color)]">LIVE</p>
            </Show>
          </div>
        </div>
      </button>
      <ScheduleStreamDetailDialog
        stream={props.stream}
        modalSignal={modal}
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
          <span class={'relative inline-flex h-full w-full rounded-full bg-red-500'}/>
          <span
            class={'absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 duration-700'}
          />
        </span>
      </div>
    </div>
  )
}

interface LiveStreamPulseWrapperProps {
  isLive: boolean;
  children: any;
}

/**
 * Wrapper component that adds a pulsing animation effect when a stream is live
 * Provides consistent padding when not live
 */
const LiveStreamPulseWrapper: Component<LiveStreamPulseWrapperProps> = (props) => {
  return (
    <Switch>
      <Match when={props.isLive}>
        <div class="relative w-full h-full">
          <div class="absolute w-full h-full bg-accent-300 rounded-2xl animate-pulse duration-300">
          </div>
          <div class="absolute p-1 w-full h-full">
            {props.children}
          </div>
        </div>
      </Match>
      <Match when={!props.isLive}>
        <div class="p-1 w-full h-full">
          {props.children}
        </div>
      </Match>
    </Switch>
  );
}
