import {type Component, Match, type ParentComponent, Show, Switch} from "solid-js";
import {YogsScheduleDetailDialog} from "./YogsScheduleDetailDialog.tsx";
import {getTextColor} from "../../../lib/utils/textColors.ts";
import {BiLogosTwitch, BiLogosYoutube} from "solid-icons/bi";
import {BsPeopleFill} from "solid-icons/bs";
import {useNow} from "../../../lib/utils/useNow.ts";
import {DateTime} from "luxon";
import {useCreatorFilter} from "./provider/CreatorFilterProvider.tsx";
import {twMerge} from "tailwind-merge";
import {YogsStreamUtils} from "../../../lib/utils/YogsStreamUtils.ts";
import type {FullStream} from "../../../lib/model/ContentTypes.ts";
import {logSlotClick} from "../../../lib/analytics.ts";
import {createModalSignal} from "../../../lib/createModalSignal.ts";

interface YogsStreamTileProps {
  stream: FullStream
}

export const YogsStreamTile: Component<YogsStreamTileProps> = (props) => {

  const modal = createModalSignal()

  const {isSlotPartOfFilter} = useCreatorFilter()

  const stream = () => props.stream
  const title = () => stream().title
  const subtitle = () => stream().subtitle
  const style = () => stream().style
  const tileSize = () => style().tileSize
  const orientation = () => style().background.orientation
  const colors = () => style().background.colors ?? ['#ff0', '#f0f']
  const enable = () => isSlotPartOfFilter(stream())

  function orientationInCss() {
    switch (orientation()) {
      case 'TD':
        return 'to bottom'
      case 'LR':
        return 'to right'
      case 'RL':
        return 'to left'
      case 'DT':
        return 'to top'
      case 'TLBR':
        return 'to bottom right'
      case 'TRBL':
        return 'to bottom left'
      default:
        return orientation
    }
  }

  const gradient = () => `linear-gradient(${orientationInCss()}, ${colors().join(', ')})`

  const buttonStyle = () => {
    if (enable()) {
      return {
        'background-image': gradient(),
        color: getTextColor(colors()[0]),
      }
    } else {
      return {
        'background-image': gradient(),
        color: getTextColor(colors()[0]),
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
            class={twMerge("w-full h-full rounded-2xl p-1 flex flex-col text-center items-center justify-center transition-all",
              enable() ? 'hover:scale-105 hover:brightness-105' : '')}
            style={buttonStyle()}
            disabled={!enable()}
            onClick={() => {
              logSlotClick(stream())
              modal.open()
            }}
          >
            <div class={'@container h-full flex flex-col items-center justify-center w-full'}>
              <p class={'~text-sm/2xl font-bold tracking-widest uppercase text-pretty'}>{title()}</p>
              <Show when={subtitle()}>
                <p class={'~text-xs/md tracking-widest uppercase text-pretty'}>{subtitle()}</p>
              </Show>
              <Show when={showCountdown()}>
                <p class={'font-mono text-xs font-bold lowercase tracking-wide line-clamp-1'}>{countdown()}</p>
              </Show>
              <Show when={!showCountdown() && isLive()}>
                <p class={'~text-md/lg font-bold tracking-wide text-white'}>LIVE</p>
              </Show>
            </div>
            <Indicator stream={props.stream}/>
          </button>
        </LivePulse>
      </div>
      <YogsScheduleDetailDialog
        stream={props.stream}
        modalSignal={modal}
      />
    </>
  )
}


interface IndicatorProps {
  stream: FullStream
}

export const Indicator: Component<IndicatorProps> = (props) => {

  const vodTypes = () => props.stream.vods?.map(vod => vod.type) ?? []

  const hasYoutubeVod = () => {
    return vodTypes().includes('youtube')
  }

  const hasTwitchVod = () => {
    return vodTypes().includes('twitch')
  }

  return (
    <>
      <div class={'hidden xl:flex w-full flex-row justify-around'}>
        <Show when={hasTwitchVod()}>
          <BiLogosTwitch size={18}/>
        </Show>
        <Show when={hasYoutubeVod()}>
          <BiLogosYoutube size={18}/>
        </Show>
        <Show when={props.stream.creators.length > 0}>
          <BsPeopleFill size={18}/>
        </Show>
      </div>

      <div class={'flex w-full flex-row justify-around xl:hidden'}>
        <Show when={hasTwitchVod()}>
          <BiLogosTwitch size={12}/>
        </Show>
        <Show when={hasYoutubeVod()}>
          <BiLogosYoutube size={12}/>
        </Show>
        <Show when={props.stream.creators.length > 0}>
          <BsPeopleFill size={12}/>
        </Show>
      </div>
    </>
  );
}

interface LivePulseProps {
  stream: FullStream
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
        <div class={'relative w-full h-full'}>
          <div class={'absolute w-full h-full bg-accent-300 rounded-2xl animate-pulse duration-300'}>
          </div>
          <div class={'absolute p-1 w-full h-full'}>
            {props.children}
          </div>
        </div>
      </Match>
      <Match when={!isLive()}>
        <div class={'p-1 w-full h-full'}>
          {props.children}
        </div>
      </Match>
    </Switch>
  )
}
