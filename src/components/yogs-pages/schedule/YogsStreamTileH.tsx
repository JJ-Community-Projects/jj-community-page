import {
  type Component,
  Match,
  type ParentComponent,
  Show,
  Switch,
} from 'solid-js'
import { YogsScheduleDetailDialog } from './YogsScheduleDetailDialog.tsx'
import { getTextColor } from '../../../lib/utils/textColors.ts'
import { BiLogosTwitch, BiLogosYoutube } from 'solid-icons/bi'
import { BsPeopleFill } from 'solid-icons/bs'
import { useNow } from '../../../lib/utils/useNow.ts'
import { DateTime } from 'luxon'
import { useCreatorFilter } from './provider/CreatorFilterProvider.tsx'
import { twMerge } from 'tailwind-merge'
import { YogsStreamUtils } from '../../../lib/utils/YogsStreamUtils.ts'
import type { YogsStream } from '../../../lib/orpc/private/yogs/contract.ts'

import { logSlotClick } from '../../../lib/analytics.ts'
import { createModalSignal } from '../../../lib/createModalSignal.ts'
import './YogsStreamTileH.css'

interface YogsStreamTileProps {
  stream: YogsStream
}

export const YogsStreamTileH: Component<YogsStreamTileProps> = (props) => {
  const modal = createModalSignal()

  const { isSlotPartOfFilter } = useCreatorFilter()

  const stream = () => props.stream
  const title = () => stream().title
  const subtitle = () => stream().subtitle
  const tileSize = () => stream().size
  const enable = () => isSlotPartOfFilter(stream())
  const color = () => stream().color

  const buttonStyle = () => {
    if (enable()) {
      return {
        'background-color': color(),
        color: getTextColor(color()),
      }
    } else {
      return {
        'background-color': color(),
        color: getTextColor(color()),
        filter: 'brightness(0.5)',
      }
    }
  }

  const now = useNow()

  const showCountdown = () => {
    return YogsStreamUtils.isBefore(stream(), now())
  }

  const isLive = () => {
    const start = DateTime.fromJSDate(stream().start)
    const end = DateTime.fromJSDate(stream().end)
    return start < now() && end > now()
  }

  const diff = () => {
    return DateTime.fromJSDate(stream().start).diff(now())
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

  return (
    <div
      style={{
        height: `calc(${tileSize()} * var(--jj-schedule-data-size))`,
        width: '100%',
      }}
      class={'group'}
    >
      <div class="schedule-slot-container h-full w-full">
        <LivePulse stream={stream()}>
          <button
            class={twMerge(
              'flex h-full w-full flex-col items-center justify-center rounded-2xl p-1 text-center transition-all',
              enable()
                ? 'shadow group-hover:p-1.5 group-hover:shadow-lg group-hover:brightness-105'
                : '',
            )}
            style={buttonStyle()}
            disabled={!enable()}
            onClick={() => {
              logSlotClick(stream())
              modal.open()
            }}
          >
            {/* The outer div is the height-based container using your plugin */}
            <div
              class={
                `flex h-full w-full flex-col items-center justify-center`
              }
            >
              {/* Apply responsive classes */}
              <p class={'schedule-slot-title'}>{title()}</p>


              {/* Note: Removed the Show when={tileSize() > 1} around Indicator
                   because the Indicator itself can now hide/show/scale based on
                   container height using its own classes. */}
            </div>
          </button>
        </LivePulse>
      </div>
      <YogsScheduleDetailDialog stream={props.stream} modalSignal={modal} />
    </div>
  )
}

// --- Minor Update to Indicator Component ---

interface IndicatorProps {
  stream: YogsStream
}
export const Indicator: Component<IndicatorProps> = (props) => {
  const vodTypes = () => props.stream.vods?.map((vod) => vod.type) ?? []

  const hasYoutubeVod = () => {
    return vodTypes().includes('youtube')
  }

  const hasTwitchVod = () => {
    return vodTypes().includes('twitch')
  }

  // New logic: Use container height queries to control icon size and visibility.
  // We'll use the icons directly in one div and let the container height control their size.

  return (
    <div
      class={twMerge(
        // Hidden for extra-small containers
        'hidden @2x:flex w-full flex-row justify-around mt-1',
        // Control icon size with container queries and Fluid.tw
      )}
    >
      <Show when={hasTwitchVod()}>
        {/* These icons will scale with the parent div's font size (text-sm/text-base/lg) */}
        <BiLogosTwitch size="1em" />
      </Show>
      <Show when={hasYoutubeVod()}>
        <BiLogosYoutube size="1em" />
      </Show>
      <Show when={(props.stream.creators?.length ?? 0) > 0}>
        <BsPeopleFill size="1em" />
      </Show>
    </div>
  )
}

// ... (LivePulse component remains unchanged)


interface LivePulseProps {
  stream: YogsStream
}

const LivePulse: ParentComponent<LivePulseProps> = (props) => {
  const stream = () => props.stream
  const now = useNow()

  const isLive = () => {

    if (stream().title.toUpperCase() === 'FESTIVUS MAXIMUS') {
      return true
    }

    const start = DateTime.fromJSDate(stream().start)
    const end = DateTime.fromJSDate(stream().end)
    return start < now() && end > now()
  }
  return (
    <Switch>
      <Match when={isLive()}>
        <div class={'relative h-full w-full'}>
          <div
            class={
              'absolute h-full w-full animate-pulse rounded-2xl bg-accent-500 duration-300'
            }
          ></div>
          <div class={'absolute h-full w-full p-1 group-hover:p-0.5 transition-all'}>{props.children}</div>
        </div>
      </Match>
      <Match when={!isLive()}>
        <div class={'h-full w-full p-1 group-hover:p-0.5 transition-all'}>{props.children}</div>
      </Match>
    </Switch>
  )
}
