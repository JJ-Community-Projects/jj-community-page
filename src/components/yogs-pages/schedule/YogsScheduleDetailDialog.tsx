import { type Component, For, Show } from 'solid-js'
import { Dialog } from '@kobalte/core'
import { FaBrandsTwitch, FaBrandsYoutube, FaSolidXmark } from 'solid-icons/fa'
import { DateTime } from 'luxon'
import { getTextColor } from '../../../lib/utils/textColors.ts'
import type {
  YogsCreator,
  YogsStream,
  YogsVOD,
} from '../../../lib/orpc/private/yogs/contract.ts'
import { YogsStreamUtils } from '../../../lib/utils/YogsStreamUtils.ts'
import { useNow } from '../../../lib/utils/useNow.ts'
import {
  logCreatorFromSlotClick,
  logCreatorSlotFilterClick,
} from '../../../lib/analytics.ts'
import {
  createModalSignal,
  type ModalSignal,
} from '../../../lib/createModalSignal.ts'
import { useYogsSchedule } from './provider/YogsScheduleProvider.tsx'
import { useCreatorFilter } from './provider/CreatorFilterProvider.tsx'
import { SolidMarkdown } from 'solid-markdown'
import remarkGfm from 'remark-gfm'
import { YogsStreamDisclaimer } from './YogsScheduleDisclaimer.tsx'
import { YogsCreatorDialog } from '../creators/YogsCreatorDialog.tsx'

interface YogsScheduleDetailDialogProps {
  stream: YogsStream
  modalSignal: ModalSignal
}

export const YogsScheduleDetailDialog: Component<
  YogsScheduleDetailDialogProps
> = (props) => {
  const background = () => {
    return props.stream.color ?? '#ff0000'
  }

  return (
    <Dialog.Root
      open={props.modalSignal.isOpen()}
      onOpenChange={props.modalSignal.setOpen}
    >
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/20 p-2 lg:p-16" />
        <Dialog.Content class="fixed left-1/2 top-1/2 flex h-[70vh] w-[calc(100vw_-_24px)] -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-2xl bg-white shadow-xl md:h-[90vh] lg:w-[min(calc(100vw_-_16px),_386px)]">
          <Dialog.Title
            class="flex flex-row gap-4 rounded-t-2xl p-2"
            style={{
              background: background(),
              color: getTextColor(background()),
            }}
          >
            <button
              class={'aspect-square rounded-full hover:bg-accent-200/10'}
              onClick={() => props.modalSignal.close()}
            >
              <FaSolidXmark size={24} />
            </button>
            <div class={'flex flex-col'}>
              <p class={'text-xl font-bold'}>{props.stream.title}</p>
              <p>{props.stream.subtitle}</p>
            </div>
          </Dialog.Title>
          <Body stream={props.stream} modalSignal={props.modalSignal} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface BodyProps {
  stream: YogsStream
  modalSignal: ModalSignal
}

const Body: Component<BodyProps> = (props) => {
  const stream = () => props.stream
  const now = useNow()

  const countdownFormat = () => {
    if (YogsStreamUtils.start(stream()).diff(now()).as('day') < 1) {
      return YogsStreamUtils.start(stream())
        .diff(now())
        .toFormat("hh'h' mm'm' ss's'")
    }
    return YogsStreamUtils.start(stream())
      .diff(now())
      .toFormat("dd'd' hh'h' mm'm' ss's'")
  }

  const isBefore = () => {
    return YogsStreamUtils.isBefore(stream(), now())
  }
  const isLive = () => {
    const start = DateTime.fromJSDate(stream().start)
    const end = DateTime.fromJSDate(stream().end)
    return start < now() && end > now()
  }
  return (
    <div class="flex h-full flex-1 flex-col overflow-hidden overscroll-none">
      <div
        class={
          'flex h-full flex-col overflow-auto overflow-x-hidden scrollbar-thin scrollbar-track-accent-100 scrollbar-thumb-accent-500 scrollbar-corner-primary-100'
        }
      >
        <div class={'flex h-full flex-col justify-between px-2 pb-4 pt-2'}>
          <div class={'flex flex-col'}>
            <Show
              when={
                props.stream.description && !props.stream.markdownDescription
              }
            >
              <Dialog.Description class="mb-6">
                {props.stream.description}
              </Dialog.Description>
            </Show>

            <Show when={props.stream.markdownDescription}>
              <div class="prose">
                <SolidMarkdown
                  children={props.stream.markdownDescription}
                  renderingStrategy={'reconcile'}
                  remarkPlugins={[remarkGfm]}
                  linkTarget={'_blank'}
                />
              </div>
            </Show>

            <Show when={isLive()}>
              <LiveButton />
            </Show>
            <p>
              {DateTime.fromJSDate(props.stream.start).toLocaleString({
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                timeZoneName: 'short',
              })}
            </p>
            <Show when={isBefore()}>
              <p>{countdownFormat()}</p>
            </Show>
            <Show when={props.stream.vods && props.stream.vods.length > 0}>
              <p>Vods</p>
              <div class={'flex flex-wrap gap-2'}>
                <For each={props.stream.vods}>
                  {(vod) => <VodComponent vod={vod} />}
                </For>
              </div>
            </Show>
            <Show
              when={
                props.stream.vods &&
                props.stream.vods.length > 0 &&
                (props.stream.creators?.length ?? 0) > 0
              }
            >
              <div class={'h-2'} />
            </Show>
            <Show when={(props.stream.creators?.length ?? 0) > 0}>
              <p class={'text-lg'}>Creators</p>
              <div class={'flex flex-wrap gap-2'}>
                <For each={props.stream.creators}>
                  {(creator) => (
                    <CreatorComponent
                      creator={creator}
                      modalSignal={props.modalSignal}
                      stream={props.stream}
                    />
                  )}
                </For>
              </div>
            </Show>
          </div>
          <YogsStreamDisclaimer />
        </div>
      </div>
    </div>
  )
}

interface VodProps {
  vod: YogsVOD
}

const VodComponent: Component<VodProps> = (props) => {
  if (props.vod.type === 'youtube') {
    return (
      <div class={'flex flex-row py-1'}>
        <a
          target={'_blank'}
          class={
            'flex flex-row items-center gap-1 rounded-full bg-youtube-100/50 px-2 py-0.5 text-black no-underline transition-all hover:cursor-pointer hover:bg-youtube-100'
          }
          href={props.vod.link}
        >
          <FaBrandsYoutube /> {props.vod.label}
        </a>
      </div>
    )
  } else if (props.vod.type === 'twitch') {
    return (
      <div class={'flex flex-row py-1'}>
        <a
          target={'_blank'}
          class={
            'flex flex-row items-center gap-1 rounded-full bg-twitch-200/50 px-2 py-0.5 text-black no-underline transition-all hover:cursor-pointer hover:bg-twitch-200'
          }
          href={props.vod.link}
        >
          <FaBrandsTwitch /> {props.vod.label}
        </a>
      </div>
    )
  } else {
    return (
      <div class={'flex flex-row py-1'}>
        <a
          target={'_blank'}
          class={
            'flex flex-row items-center gap-1 rounded-full bg-twitch-200 px-2 py-0.5 text-black no-underline transition-all hover:cursor-pointer hover:bg-twitch-200 hover:text-twitch'
          }
          href={props.vod.link}
        >
          <FaBrandsTwitch /> {props.vod.label}
        </a>
      </div>
    )
  }
}

interface CreatorComponentProps {
  creator: YogsCreator
  stream: YogsStream
  modalSignal: ModalSignal
}

const CreatorComponent: Component<CreatorComponentProps> = (props) => {
  const creator = props.creator
  const imageUrl = creator?.imageUrl
  const bg = creator?.color
  const textColor = getTextColor(bg)

  const label = creator.name

  const modal = createModalSignal()

  const { getCreatorStreams } = useYogsSchedule()

  const streams = getCreatorStreams(creator.id)

  const shouldShowJJStreams = streams.length > 1

  const { reset, addFilter } = useCreatorFilter()

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
        class="flex cursor-pointer flex-row items-center gap-2 rounded-full p-2 transition-all duration-200 ~text-xs/base hover:scale-105 hover:brightness-105"
        style={{
          'background-color': bg,
          color: textColor,
        }}
        onclick={() => {
          modal.open()
          logCreatorFromSlotClick(creator, props.stream)
        }}
      >
        {imageUrl && (
          <img src={imageUrl} alt={label} class="rounded-full ~h-5/8 ~w-5/8" />
        )}
        <span>{label}</span>
      </button>
      <YogsCreatorDialog
        creator={creator}
        modalSignal={modal}
        onJJStreamsClick={shouldShowJJStreams ? onJJStreamsClick : undefined}
      />
    </>
  )
}

const LiveButton = () => {
  return (
    <div class={'flex flex-row py-1'}>
      <a
        target={'_blank'}
        class={
          'flex flex-row items-center gap-1 rounded-full bg-twitch-200/50 px-2 py-0.5 text-black no-underline transition-all hover:cursor-pointer hover:bg-twitch-200'
        }
        href={'https://twitch.tv/yogscast'}
      >
        <FaBrandsTwitch /> Watch Live{' '}
        <div class={'h-2 w-2'}>
          <span class="relative flex h-2 w-2">
            <span
              class={
                'absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 duration-700'
              }
            />
            <span
              class={
                'relative inline-flex h-full w-full rounded-full bg-red-500'
              }
            />
          </span>
        </div>
      </a>
    </div>
  )
}
