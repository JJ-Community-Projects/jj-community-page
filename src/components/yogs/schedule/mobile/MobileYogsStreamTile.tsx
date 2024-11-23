import {type Component, createSignal, Show} from "solid-js";
import type {FullStream} from "../../../../lib/model/ContentTypes.ts";
import {DateTime} from "luxon";
import {useNow} from "../../../../lib/utils/useNow.ts";
import {BiLogosTwitch, BiLogosYoutube} from "solid-icons/bi";
import {getTextColor} from "../../../../lib/utils/textColors.ts";
import {YogsStreamUtils} from "../../../../lib/utils/YogsStreamUtils.ts";
import {LivePulseDot} from "../../../common/LivePulseDot.tsx";
import {BsPeopleFill} from "solid-icons/bs";
import {YogsScheduleDetailDialog} from "../YogsScheduleDetailDialog.tsx";
import {logSlotClick} from "../../../../lib/analytics.ts";

interface MobileScheduleBodyProps {
  stream: FullStream
}

export const MobileYogsStreamTile: Component<MobileScheduleBodyProps> = (props) => {
  const stream = props.stream
  const now = useNow()


  const countdown = () => {
    const diff = DateTime.fromJSDate(stream.start).diff(now())
    if (diff.as('day') < 1) {
      return DateTime.fromJSDate(stream.start).diff(now()).toFormat("hh'h' mm'm' ss's'")
    }
    return DateTime.fromJSDate(stream.start).diff(now()).toFormat("dd'd' hh'h' mm'm' ss's'")
  }

  const showCountdown = () => {
    return YogsStreamUtils.isBefore(stream, now())
  }
  const isLive = () => YogsStreamUtils.isLive(stream, now())


  function textColor(background: string) {
    return getTextColor(background)
  }

  function _parseColor(c: string): string {
    return '#' + c.substring(2) //  + c.substring(0, 2)
  }

  /*
  const background = () => {
    let gradientStyle: JSX.CSSProperties | undefined
    if (stream.style.linearGradient) {
      const linearGradient = stream.style.linearGradient
      gradientStyle = {
        background: `linear-gradient(180deg, ${linearGradient.colors.map(_parseColor).join(', ')})`,
        color: textColor(_parseColor(stream.style.background ?? linearGradient.colors[0] ?? 'ffff0000')),
        height: '100%',
      }
    } else {
      if (stream.style.background) {
        gradientStyle = {
          background: `${_parseColor(stream.style.background ?? 'ffff0000')}`,
          // background: _parseColor(stream.style.background)
          color: textColor(_parseColor(stream.style.background ?? 'ffff0000')),
          height: '100%',
        }
      }
    }
    return gradientStyle
  }*/
  const vodTypes = () => props.stream.vods?.map(vod => vod.type) ?? []

  const hasYoutubeVod = () => {
    return vodTypes().includes('youtube')
  }

  const hasTwitchVod = () => {
    return vodTypes().includes('twitch')
  }

  const [isDialogOpen, setIsDialogOpen] = createSignal<boolean>(false)
  const style = stream.style
  const colors = style.background.colors ?? ['#ff0', '#f0f']
  const orientation = style.background.orientation
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


  return (
    <>
      <div
        class={'rounded-2xl w-full'}
        style={{

          'background-image': gradient,
          color: getTextColor(colors[0]),
        }}
      >
        <div class={'p-schedule h-full transition-all'}>
          <div
            class={'schedule-card flex flex-col items-center justify-center p-1 text-center transition-all'}
            style={{
              //    ...background(),
            }}
            onclick={() => {
              logSlotClick(stream)
              setIsDialogOpen(true)
            }}
          >
            <p class={'text-md font-bold'}>{props.stream.title}</p>
            <p class={'text-sm'}>{props.stream.subtitle}</p>
            <Show when={showCountdown()}>
              <p class={'font-mono text-xs'}>{countdown()}</p>
            </Show>
            <Show when={!showCountdown() && isLive()}>
              <LivePulseDot/>
            </Show>
            <div class={'flex w-full flex-row justify-around'}>
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
          </div>
        </div>
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
