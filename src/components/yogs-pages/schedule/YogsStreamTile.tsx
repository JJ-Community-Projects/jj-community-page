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

interface YogsStreamTileProps {
  stream: YogsStream
}

export const YogsStreamTile: Component<YogsStreamTileProps> = (props) => {
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

  const titleStyle = () => {
    if (tileSize() === 1) {
      return 'line-clamp-1 text-pretty font-bold uppercase tracking-wide text-base'
    }

   if (tileSize() === 2 && (subtitle() === undefined || subtitle() === '')) {
      return 'line-clamp-2 text-pretty font-bold uppercase tracking-wide ~text-base/2xl'
    } else if (tileSize() === 2 && !((subtitle() === undefined || subtitle() === ''))) {
      return 'line-clamp-2 text-pretty font-bold uppercase tracking-wide ~text-xs/lg'
    }

    if (tileSize() === 4) {
      return 'line-clamp-2 text-pretty font-bold uppercase tracking-widest ~text-sm/2xl'
    }

    return 'text-pretty font-bold uppercase tracking-widest ~text-sm/3xl'
  }

  const subtitleStyle = () => {

    if (tileSize() === 1) {
      return '~text-xxs/sm text-pretty uppercase tracking-wide'
    }

    if (tileSize() === 2) {
      return '~text-xxs/xs text-pretty uppercase tracking-wide'
    }

    if (tileSize() === 4) {
      return '~text-xs/base text-pretty uppercase tracking-widest'
    }

    return '~text-sm/lg text-pretty uppercase tracking-widest'
  }

  const countdownStyle = () => {
    if (tileSize() <= 1) {
      return 'line-clamp-1 font-mono text-xxs font-bold lowercase'
    }

    return 'line-clamp-1 font-mono text-xs font-bold lowercase tracking-wide'
  }

  const liveStyle = () => {
    if (tileSize() === 1) {
      return '~text-xxs font-bold tracking-wide'
    }

    return '~text-base/lg font-bold tracking-wide'
  }

  return (
    <>
      <div
        style={{
          height: `calc(${tileSize()} * var(--jj-schedule-data-size))`,
          width: '100%',
        }}
        class="p-0.5"
      >
        <LivePulse stream={stream()}>
          <button
            class={twMerge(
              'flex h-full w-full flex-col items-center justify-center rounded-2xl p-1 text-center transition-all',
              enable() ? 'hover:scale-101 hover:brightness-105' : '',
            )}
            style={buttonStyle()}
            disabled={!enable()}
            onClick={() => {
              logSlotClick(stream())
              modal.open()
            }}
          >
            <div
              class={
                'flex h-full w-full flex-col items-center justify-center @container'
              }
            >
              <p class={titleStyle()}>{title()}</p>
              <Show when={subtitle() && tileSize() > 1}>
                <p class={subtitleStyle()}>
                  {subtitle()}
                </p>
              </Show>
              <Show when={showCountdown()}>
                <p class={countdownStyle()}>{countdown()}</p>
              </Show>
              <Show when={!showCountdown() && isLive()}>
                <p class={liveStyle()}>
                  LIVE
                </p>
              </Show>
            </div>
            <Show when={tileSize() > 1}>
              <Indicator stream={props.stream} />
            </Show>
          </button>
        </LivePulse>
      </div>
      <YogsScheduleDetailDialog stream={props.stream} modalSignal={modal} />
    </>
  )
}

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

  return (
    <>
      <div class={'hidden w-full flex-row justify-around xl:flex'}>
        <Show when={hasTwitchVod()}>
          <BiLogosTwitch size={14} />
        </Show>
        <Show when={hasYoutubeVod()}>
          <BiLogosYoutube size={14} />
        </Show>
        <Show when={(props.stream.creators?.length ?? 0) > 0}>
          <BsPeopleFill size={14} />
        </Show>
      </div>

      <div class={'flex w-full flex-row justify-around xl:hidden'}>
        <Show when={hasTwitchVod()}>
          <BiLogosTwitch size={10} />
        </Show>
        <Show when={hasYoutubeVod()}>
          <BiLogosYoutube size={10} />
        </Show>
        <Show when={(props.stream.creators?.length ?? 0) > 0}>
          <BsPeopleFill size={0} />
        </Show>
      </div>
    </>
  )
}

interface LivePulseProps {
  stream: YogsStream
}

const LivePulse: ParentComponent<LivePulseProps> = (props) => {
  const stream = () => props.stream
  const now = useNow()

  const isLive = () => {
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
              'absolute h-full w-full animate-pulse rounded-2xl bg-accent-300 duration-300'
            }
          ></div>
          <div class={'absolute h-full w-full p-1'}>{props.children}</div>
        </div>
      </Match>
      <Match when={!isLive()}>
        <div class={'h-full w-full p-1'}>{props.children}</div>
      </Match>
    </Switch>
  )
}
