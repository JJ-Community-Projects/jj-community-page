import {type Component, createSignal, Show} from "solid-js";
import {YogsScheduleDetailDialog} from "./YogsScheduleDetailDialog.tsx";
import {getTextColor} from "../../../lib/utils/textColors.ts";
import {BiLogosTwitch, BiLogosYoutube} from "solid-icons/bi";
import {BsPeopleFill} from "solid-icons/bs";
import {useNow} from "../../../lib/utils/useNow.ts";
import {DateTime} from "luxon";
import {LivePulseDot} from "../../common/LivePulseDot.tsx";
import {useCreatorFilter} from "./provider/CreatorFilterProvider.tsx";
import {twMerge} from "tailwind-merge";
import {YogsStreamUtils} from "../../../lib/utils/YogsStreamUtils.ts";
import type {FullStream} from "../../../lib/model/ContentTypes.ts";
import {logSlotClick} from "../../../lib/analytics.ts";

interface YogsStreamTileProps {
  stream: FullStream
}

export const YogsStreamTile: Component<YogsStreamTileProps> = (props) => {

  const [isDialogOpen, setIsDialogOpen] = createSignal<boolean>(false)

  const {isSlotPartOfFilter} = useCreatorFilter()

  const stream = props.stream
  const title = stream.title
  const subtitle = stream.subtitle
  const style = stream.style
  const tileSize = style.tileSize
  const orientation = style.background.orientation
  const colors = style.background.colors ?? ['#ff0', '#f0f']
  const enable = () => isSlotPartOfFilter(stream)

  function orientationInCss() {
    switch (orientation) {
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

  const gradient = `linear-gradient(${orientationInCss()}, ${colors.join(', ')})`

  const buttonStyle = () => {
    if (enable()) {
      return {
        'background-image': gradient,
        color: getTextColor(colors[0]),
      }
    } else {
      return {
        'background-image': gradient,
        color: getTextColor(colors[0]),
        filter: 'brightness(0.5)',
      }
    }
  }

  const now = useNow()


  const showCountdown = () => {
    return YogsStreamUtils.isBefore(stream, now())
  }

  const isLive = () => YogsStreamUtils.isLive(stream, now())
  const countdown = () => {
    const diff = DateTime.fromJSDate(stream.start).diff(now())
    if (diff.as('day') < 1) {
      return DateTime.fromJSDate(stream.start).diff(now()).toFormat("h'h' mm'm' ss's'")
    }
    return DateTime.fromJSDate(stream.start).diff(now()).toFormat("d'd' hh'h' mm'm' ss's'")
  }

  return (
    <>
      <div
        style={{
          height: `calc(${tileSize} * var(--jj-schedule-slot-size))`,
          width: '100%',
        }}
        class="p-1.5"
      >
        <button
          class={twMerge("w-full h-full rounded-2xl p-1 flex flex-col text-center items-center justify-center transition-all",
            enable() ? 'hover:scale-105 hover:brightness-105' : '')}
          style={buttonStyle()}
          disabled={!enable()}
          onClick={() => {
            logSlotClick(stream)
            setIsDialogOpen(true)
          }}
        >
          <div class={'@container h-full flex flex-col items-center justify-center w-full'}>
            <p class={'~text-sm/2xl font-bold tracking-widest uppercase text-pretty'}>{title}</p>
            <Show when={subtitle}>
              <p class={'~text-xs/md tracking-widest uppercase text-pretty'}>{subtitle}</p>
            </Show>
            <Show when={showCountdown()}>
              <p class={'font-mono text-xs font-bold lowercase tracking-wide line-clamp-1'}>{countdown()}</p>
            </Show>
            <Show when={!showCountdown() && isLive()}>
              <LivePulseDot/>
            </Show>
          </div>
          <Indicator stream={props.stream}/>
        </button>
      </div>
      <YogsScheduleDetailDialog
        stream={props.stream}
        isOpen={isDialogOpen()}
        onOpenChange={setIsDialogOpen}
        close={() => setIsDialogOpen(false)}
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
