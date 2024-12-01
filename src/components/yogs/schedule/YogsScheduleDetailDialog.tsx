import {type Component, For, Show} from "solid-js";
import {Dialog} from "@kobalte/core";
import {BsTwitch, BsYoutube} from "solid-icons/bs";
import {AiOutlineClose} from "solid-icons/ai";
import {DateTime} from "luxon";
import {getTextColor} from "../../../lib/utils/textColors.ts";
import type {ContentVod, FullCreator, FullStream} from "../../../lib/model/ContentTypes.ts";
import {YogsStreamUtils} from "../../../lib/utils/YogsStreamUtils.ts";
import {useNow} from "../../../lib/utils/useNow.ts";
import {logCreatorFromSlotClick, logCreatorSlotFilterClick} from "../../../lib/analytics.ts";
import {CreatorDialog} from "../../creators/CreatorDialog.tsx";
import {createModalSignal, type ModalSignal} from "../../../lib/createModalSignal.ts";
import {useYogsSchedule} from "./provider/YogsScheduleProvider.tsx";
import {useCreatorFilter} from "./provider/CreatorFilterProvider.tsx";
import {StreamDisclaimer} from "../ScheduleDisclaimer.tsx";

interface YogsScheduleDetailDialogProps {
  stream: FullStream
  modalSignal: ModalSignal
}

export const YogsScheduleDetailDialog: Component<YogsScheduleDetailDialogProps> = (props) => {

  const background = () => {
    return props.stream.style?.background?.colors?.at(0) ?? '#ff0000'
  }

  return (
    <Dialog.Root open={props.modalSignal.isOpen()} onOpenChange={props.modalSignal.setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/20 lg:p-16 p-2"/>
        <Dialog.Content
          class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl w-[calc(100vw_-_24px)] lg:w-[min(calc(100vw_-_16px),_386px)] h-[90vh] flex flex-col">
          <Dialog.Title
            class="p-2 flex flex-row gap-4 rounded-t-2xl"
            style={{
              background: background(),
              color: getTextColor(background())
            }}
          >
            <button class={'rounded-full hover:bg-accent-200/10 aspect-square'}
                    onClick={() => props.modalSignal.close()}>
              <AiOutlineClose size={24}/>
            </button>
            <div class={'flex flex-col'}>
              <p class={'text-xl font-bold'}>{props.stream.title}</p>
              <p>{props.stream.subtitle}</p>
            </div>
          </Dialog.Title>
          <Body stream={props.stream} modalSignal={props.modalSignal}/>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


interface BodyProps {
  stream: FullStream
  modalSignal: ModalSignal
}

const Body: Component<BodyProps> = (props) => {
  const stream = () => props.stream
  const now = useNow()

  const countdownFormat = () => {
    if (YogsStreamUtils.start(stream()).diff(now()).as('day') < 1) {
      return YogsStreamUtils.start(stream()).diff(now()).toFormat("hh'h' mm'm' ss's'")
    }
    return YogsStreamUtils.start(stream()).diff(now()).toFormat("dd'd' hh'h' mm'm' ss's'")
  }

  const isBefore = () => {
    return YogsStreamUtils.isBefore(stream(), now())
  }

  return (
    <div class="h-full flex flex-1 flex-col overflow-hidden overscroll-none">
      <div
        class={'h-full flex flex-col overflow-auto overflow-x-hidden scrollbar-thin scrollbar-corner-primary-100 scrollbar-thumb-accent-500 scrollbar-track-accent-100'}>
        <div class={'h-full flex flex-col justify-between'}>
          <div class={'flex flex-col'}>
            <Show when={props.stream.description}>
              <Dialog.Description class="mb-6">{props.stream.description}</Dialog.Description>
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
                    creator => (
                      <CreatorComponent creator={creator} modalSignal={props.modalSignal} stream={props.stream}/>)
                  }
                </For>
              </div>
            </Show>
          </div>
          <StreamDisclaimer/>
        </div>
      </div>
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
  stream: FullStream
  modalSignal: ModalSignal
}

const CreatorComponent: Component<CreatorComponentProps> = (props) => {
  const creator = props.creator
  const image = creator?.profileImage
  const twitchUser = creator.twitchUser
  const bg = creator?.style?.primaryColor ?? '#1E95EF'
  const textColor = getTextColor(bg)

  const label = creator.name
  const imageUrl = image?.small ?? image?.medium ?? image?.large ?? twitchUser?.profile_image_url

  const modal = createModalSignal()

  const {getCreatorStreams} = useYogsSchedule()

  const streams = getCreatorStreams(creator.id)

  const shouldShowJJStreams = streams.length > 1

  const {reset, addFilter} = useCreatorFilter()

  const onJJStreamsClick = () => {
    reset()
    modal.close()
    props.modalSignal.close()
    addFilter(creator.id)
    logCreatorSlotFilterClick(creator, props.stream)
  }

  return (
    <>
      <button
        class="~text-xs/base cursor-pointer p-2 rounded-full flex flex-row gap-2 items-center hover:scale-105 hover:brightness-105 transition-all duration-200"
        style={{
          'background-color': bg,
          'color': textColor,
        }}
        onclick={() => {
          modal.open()
          logCreatorFromSlotClick(creator, props.stream)
        }}
      >
        {
          imageUrl &&
            <img
                src={imageUrl}
                alt={label}
                class="rounded-full ~w-5/8 ~h-5/8"
            />
        }
        <span>{label}</span>
      </button>
      <CreatorDialog creator={creator} modalSignal={modal}
                     onJJStreamsClick={shouldShowJJStreams ? onJJStreamsClick : undefined}/>
    </>
  )

}
