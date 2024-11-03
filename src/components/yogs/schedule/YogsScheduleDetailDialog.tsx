import {type Component, For, Show} from "solid-js";
import {Dialog} from "@kobalte/core";
import {BsTwitch, BsYoutube} from "solid-icons/bs";
import {AiOutlineClose} from "solid-icons/ai";
import {DateTime} from "luxon";
import {getTextColor} from "../../../lib/utils/textColors.ts";
import type {ContentVod, FullCreator, FullStream} from "../../../lib/model/ContentTypes.ts";
import {YogsStreamUtils} from "../../../lib/utils/YogsStreamUtils.ts";
import {useNow} from "../../../lib/utils/useNow.ts";

interface YogsScheduleDetailDialogProps {
  stream: FullStream
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  close: () => void;
}

export const YogsScheduleDetailDialog: Component<YogsScheduleDetailDialogProps> = (props) => {

  const background = () => {
    return props.stream.style?.background?.colors?.at(0) ?? '#ff0000'
  }
  // <Dialog.Overlay class={'fixed inset-0 z-50 bg-black bg-opacity-20'} />
  // <div class={'fixed inset-0 z-50 flex items-center justify-center'}>
  // <Dialog.Content class={'h-full w-full max-w-[500px] p-2 lg:w-[min(calc(100vw_-_16px),_500px)] lg:p-16'}>
  return (
    <Dialog.Root open={props.isOpen} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/20 lg:p-16 p-2"/>
        <Dialog.Content
          class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl w-[calc(100vw_-_24px)] lg:w-[min(calc(100vw_-_16px),_386px)] h-[90vh]">
          <Dialog.Title
            class="p-2 flex flex-row gap-4 rounded-t-2xl"
            style={{
              background: background(),
            }}
          >
            <button class={'rounded-full hover:bg-accent-200/10 aspect-square'} onClick={() => props.close()}>
              <AiOutlineClose size={24}/>
            </button>
            <div class={'flex flex-col'}>
              <p class={'text-xl font-bold'}>{props.stream.title}</p>
              <p>{props.stream.subtitle}</p>
            </div>
          </Dialog.Title>
          <Body stream={props.stream}/>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


interface BodyProps {
  stream: FullStream
}

const Body: Component<BodyProps> = (props) => {
  const {stream} = props
  const now = useNow()

  const countdownFormat = () => {
    if (YogsStreamUtils.start(stream).diff(now()).as('day') < 1) {
      return YogsStreamUtils.start(stream).diff(now()).toFormat("hh'h' mm'm' ss's'")
    }
    return YogsStreamUtils.start(stream).diff(now()).toFormat("dd'd' hh'h' mm'm' ss's'")
  }

  const isBefore = () => {
    return YogsStreamUtils.isBefore(stream, now())
  }

  return (
    <div class={'p-2'}>
      <Show when={props.stream.subtitle}>
        <Dialog.Description class="mb-6">{props.stream.subtitle}</Dialog.Description>
      </Show>
      <p>{DateTime.fromJSDate(props.stream.start).toLocaleString({
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short'
      })}</p>
      <Show when={isBefore()}>
        <p>{countdownFormat()}</p>
      </Show>
      <Show when={props.stream.vods && props.stream.vods.length > 0}>
        <p>Vods</p>
        <div class={'flex flex-wrap gap-2'}>
          <For each={props.stream.vods}>
            {
              vod => (<VodComponent vod={vod}/>)
            }
          </For>
        </div>
      </Show>

      <Show when={props.stream.vods && props.stream.vods.length > 0 && props.stream.creators.length > 0}>
        <div class={'h-2'}/>
      </Show>
      <Show when={props.stream.creators.length > 0}>
        <p>Creators</p>
        <div class={'flex flex-wrap gap-2'}>
          <For each={props.stream.creators}>
            {
              creator => (<CreatorComponent creator={creator}/>)
            }
          </For>
        </div>
      </Show>
    </div>
  )
}


interface VodProps {
  vod: ContentVod
}

const VodComponent: Component<VodProps> = (props) => {

  if (props.vod.type === 'youtube') {
    return (
      <div class={'flex flex-row py-1'}>
        <a
          target={'_blank'}
          class={
            'bg-youtube-100/50 hover:bg-youtube-100 flex flex-row items-center gap-1 rounded-full px-2 py-0.5 text-black no-underline hover:cursor-pointer'
          }
          href={props.vod.link}
        >
          <BsYoutube/> {props.vod.label}
        </a>
      </div>
    )
  } else if (props.vod.type === 'twitch') {
    return (
      <div class={'flex flex-row py-1'}>
        <a
          target={'_blank'}
          class={
            'bg-twitch-200/50 hover:bg-twitch-200 flex flex-row items-center gap-1 rounded-full px-2 py-0.5 text-black no-underline hover:cursor-pointer'
          }
          href={props.vod.link}
        >
          <BsTwitch/> {props.vod.label}
        </a>
      </div>
    )
  } else {
    return (
      <div class={'flex flex-row py-1'}>
        <a
          target={'_blank'}
          class={
            'bg-twitch-200 hover:bg-twitch-200 hover:text-twitch flex flex-row items-center gap-1 rounded-full px-2 py-0.5 text-black no-underline hover:cursor-pointer'
          }
          href={props.vod.link}
        >
          <BsTwitch/> {props.vod.label}
        </a>
      </div>
    )
  }
}


interface CreatorComponentProps {
  creator: FullCreator
}

const CreatorComponent: Component<CreatorComponentProps> = (props) => {

  const bg = props.creator?.style?.primaryColor ?? '#1E95EF'
  const textColor = getTextColor(bg)
  return (
    <div class={'flex flex-row py-1'}>
      <a
        target={'_blank'}
        class={
          'flex flex-row items-center gap-1 rounded-full px-2 py-0.5 text-black no-underline hover:cursor-pointer'
        }
        style={{
          'background-color': bg,
          'color': textColor,
        }}
        href={props.creator.link}
      >
        {props.creator.name}
      </a>
    </div>
  );
}
