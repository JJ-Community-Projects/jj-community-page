import { type Component, Show } from 'solid-js'
import type { Stream } from '../../../../lib/orpc/public/schemas/schedules.ts'
import { DateTime } from 'luxon'
import { useNow } from '../../../../lib/utils/useNow.ts'
import { type ModalSignal } from '../../../../lib/createModalSignal.ts'
import { getStreamColor } from '../../../../functions/jjDatesToColors.ts'
import { Dialog } from '@kobalte/core'
import { AiOutlineClose } from 'solid-icons/ai'
import { getTextColor } from '../../../../lib/utils/textColors.ts'
import { StreamTags } from './StreamTags'
import { StreamParticipants } from './StreamParticipants'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema.ts'
import { FaBrandsTwitch } from 'solid-icons/fa'

interface ScheduleStreamDetailDialogProps {
  stream: Stream
  modalSignal: ModalSignal
  user?: UserDisplay
}

/**
 * Dialog component that displays detailed information about a stream
 * Shows title, subtitle, description, time, countdown, and tags
 */
export const ScheduleStreamDetailDialog: Component<
  ScheduleStreamDetailDialogProps
> = (props) => {
  const stream = () => props.stream
  const now = useNow()

  // Convert UTC dates from backend to DateTime objects
  const getStreamStartDateTime = () => {
    // Create DateTime from JS Date, assuming it's in UTC, then convert to local time
    return DateTime.fromJSDate(stream().start, { zone: 'utc' }).toLocal()
  }

  const getStreamEndDateTime = () => {
    // Create DateTime from JS Date, assuming it's in UTC, then convert to local time
    return DateTime.fromJSDate(stream().end, { zone: 'utc' }).toLocal()
  }

  // Calculate the highlight color using getStreamColor
  const getHighlightColor = () => {
    // For color calculation, we still use UTC to maintain consistent colors
    const startDate = DateTime.fromJSDate(stream().start, { zone: 'utc' })
    return getStreamColor(startDate)
  }

  const highlightColor = getHighlightColor()
  const textColor = getTextColor(highlightColor)

  const showCountdown = () => {
    return getStreamStartDateTime() > now()
  }

  const isLive = () => {
    const start = getStreamStartDateTime()
    const end = getStreamEndDateTime()
    return start < now() && end > now()
  }

  const diff = () => {
    return getStreamStartDateTime().diff(now())
  }

  const countdownFormat = () => {
    const d = diff()
    if (d.as('day') < 1) {
      return d.toFormat("hh'h' mm'm' ss's'")
    }
    return d.toFormat("dd'd' hh'h' mm'm' ss's'")
  }

  return (
    <Dialog.Root
      open={props.modalSignal.isOpen()}
      onOpenChange={props.modalSignal.setOpen}
    >
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-20 bg-black/20 p-2 lg:p-16" />
        <Dialog.Content class="fixed left-1/2 top-1/2 z-30 flex h-[70vh] w-[calc(100vw_-_24px)] -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-2xl bg-white shadow-xl md:h-[90vh] lg:w-[min(calc(100vw_-_16px),_386px)]">
          <Dialog.Title
            class="flex flex-row gap-4 rounded-t-2xl p-2"
            style={{
              background: highlightColor,
              color: textColor,
            }}
          >
            <button
              class="aspect-square rounded-full hover:bg-accent-200/10"
              onClick={() => props.modalSignal.close()}
            >
              <AiOutlineClose size={24} />
            </button>
            <div class="flex flex-col">
              <p class="text-xl font-bold">{stream().title}</p>
              <Show when={stream().subtitle}>
                <p>{stream().subtitle}</p>
              </Show>
            </div>
          </Dialog.Title>
          <div class="flex h-full flex-1 flex-col overflow-hidden overscroll-none">
            <div class="flex h-full flex-col overflow-auto overflow-x-hidden scrollbar-thin scrollbar-track-accent-100 scrollbar-thumb-accent-500 scrollbar-corner-primary-100">
              <div class="flex h-full flex-col justify-between px-2 pb-4 pt-2">
                <div class="flex flex-col">


                  <Show when={stream().description}>
                    <Dialog.Description class="mb-6">
                      {stream().description}
                    </Dialog.Description>
                  </Show>

                  <Show when={isLive()}>
                    <div class="flex flex-row py-1">
                      <div class="flex flex-row items-center gap-1 rounded-full bg-accent-200/50 px-2 py-0.5 text-black transition-all hover:bg-accent-200">
                        Watch Live{' '}
                        <div class="h-2 w-2">
                          <span class="relative flex h-2 w-2">
                            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 duration-700" />
                            <span class="relative inline-flex h-full w-full rounded-full bg-red-500" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Show>

                  <p>
                    {getStreamStartDateTime().toLocaleString({
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      timeZoneName: 'short',
                    })}
                  </p>

                  <Show when={showCountdown()}>
                    <p>{countdownFormat()}</p>
                  </Show>

                  <Show when={props.user}>
                    <div class="flex flex-col gap-2 py-4">
                      <Show when={props.user?.tiltifySlug}>
                        {(tiltifySlug) => {
                          return (
                            <a
                              href={`/${tiltifySlug()}`}
                              class="w-fit rounded-full bg-accent-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:brightness-105"
                            >
                              Go to user profile
                            </a>
                          )
                        }}
                      </Show>
                      <Show when={props.user?.twitchLogin}>
                        {(twitchLogin) => {
                          return (
                            <a
                              href={`https://twitch.tv/${twitchLogin()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="flex flex-row gap-2 justify-center items-center w-fit rounded-full bg-twitch-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:brightness-105"
                            >
                              Open Twitch <FaBrandsTwitch/>
                            </a>
                          )
                        }}
                      </Show>
                    </div>
                  </Show>

                  <StreamTags tags={stream().tags} />
                  <StreamParticipants participants={stream().participants} />
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
