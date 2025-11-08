import { type Component, Match, type ParentComponent, Show, Switch, } from 'solid-js'
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

  return (
    <>
      <div
        style={{
          height: `calc(${tileSize()} * var(--jj-schedule-slot-size))`,
          width: '100%',
        }}
        class="p-0.5"
      >
        <LivePulse stream={stream()}>
          <button
            class={twMerge(
              'flex h-full w-full flex-col items-center justify-center rounded-2xl p-1 text-center transition-all',
              enable() ? 'hover:scale-105 hover:brightness-105' : '',
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
              <p
                class={
                  'text-pretty font-bold uppercase tracking-widest ~text-sm/2xl'
                }
              >
                {title()}
              </p>
              <Show when={subtitle()}>
                <p class={'~text-xs/md text-pretty uppercase tracking-widest'}>
                  {subtitle()}
                </p>
              </Show>
              <Show when={showCountdown()}>
                <p
                  class={
                    'line-clamp-1 font-mono text-xs font-bold lowercase tracking-wide'
                  }
                >
                  {countdown()}
                </p>
              </Show>
              <Show when={!showCountdown() && isLive()}>
                <p class={'~text-md/lg font-bold tracking-wide text-white'}>
                  LIVE
                </p>
              </Show>
            </div>
            <Indicator stream={props.stream} />
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
          <BiLogosTwitch size={18} />
        </Show>
        <Show when={hasYoutubeVod()}>
          <BiLogosYoutube size={18} />
        </Show>
        <Show when={(props.stream.creators?.length ?? 0) > 0}>
          <BsPeopleFill size={18} />
        </Show>
      </div>

      <div class={'flex w-full flex-row justify-around xl:hidden'}>
        <Show when={hasTwitchVod()}>
          <BiLogosTwitch size={12} />
        </Show>
        <Show when={hasYoutubeVod()}>
          <BiLogosYoutube size={12} />
        </Show>
        <Show when={(props.stream.creators?.length ?? 0) > 0}>
          <BsPeopleFill size={12} />
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
