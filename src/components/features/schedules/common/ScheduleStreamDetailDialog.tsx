import { type Component, JSX, Show } from 'solid-js'
import type { Stream } from '../../../../lib/orpc/public/schemas/schedules.ts'
import { DateTime, Duration } from 'luxon'
import ical, { ICalAlarmType } from 'ical-generator'
import { useNow } from '../../../../lib/utils/useNow.ts'
import { type ModalSignal } from '../../../../lib/createModalSignal.ts'
import { getStreamColor } from '../../../../functions/jjDatesToColors.ts'
import { Dialog } from '@kobalte/core'
import { AiOutlineClose } from 'solid-icons/ai'
import { getTextColor } from '../../../../lib/utils/textColors.ts'
import { StreamTags } from './StreamTags'
import { StreamParticipants } from './StreamParticipants'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema.ts'
import { FaBrandsTwitch, FaRegularCalendarPlus } from 'solid-icons/fa'

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

  // Linkify Twitch URLs in the stream description
  // Matches: https://twitch.tv/USERNAME or twitch.tv/USERNAME
  const linkifyTwitch = (text: string) => {
    const regex = /(?:https?:\/\/)?twitch\.tv\/([A-Za-z0-9_]+)/g
    const parts: Array<string | JSX.Element> = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      const start = match.index
      const end = regex.lastIndex
      if (start > lastIndex) {
        parts.push(text.slice(lastIndex, start))
      }
      const username = match[1]
      const href = `https://twitch.tv/${username}`
      const fullMatch = text.slice(start, end)
      parts.push(
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          class="text-twitch-500 underline hover:brightness-110"
        >
          {fullMatch}
        </a>,
      )
      lastIndex = end
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }
    return parts
  }

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
                      {linkifyTwitch(stream().description as string)}
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
                              class="flex w-fit flex-row items-center justify-center gap-2 rounded-full bg-twitch-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:brightness-105"
                            >
                              Open Twitch <FaBrandsTwitch />
                            </a>
                          )
                        }}
                      </Show>
                    </div>
                  </Show>
                  <Show when={showCountdown()}>
                    <div class="flex flex-row gap-2 py-1">
                      <AddToGoogleCalendarButton
                        stream={stream()}
                        user={props.user}
                      />
                      <DownloadIcsButton stream={stream()} user={props.user} />
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

interface AddToGoogleCalendarButtonProps {
  stream: Stream
  user?: UserDisplay
}

const AddToGoogleCalendarButton: Component<AddToGoogleCalendarButtonProps> = (
  props,
) => {
  const buildGoogleCalendarUrl = () => {
    const stream = props.stream
    const startUtc = DateTime.fromJSDate(stream.start)
      .toUTC()
      .toFormat("yyyyLLdd'T'HHmmss'Z'")
    const endUtc = DateTime.fromJSDate(stream.end)
      .toUTC()
      .toFormat("yyyyLLdd'T'HHmmss'Z'")

    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE'

    const title = encodeURIComponent(
      (stream.title ?? 'Jingle Jam Stream') +
        ' - ' + `JJ ${props.stream.start.getFullYear()} - `+
        (props.user?.username ?? ''),
    )
    const dates = `${startUtc}/${endUtc}`
    const twitchUrl = props.user
      ? `https://twitch.tv/${props.user?.twitchLogin}`
      : ''
    // Build details as: [DESCRIPTION or SUBTITLE]\n[WEBSITE URL]
    const descriptionText = stream.description || stream.subtitle || ''
    const detailsText = descriptionText
      ? `${descriptionText}\n${twitchUrl}`
      : `${twitchUrl}`
    const details = `&details=${encodeURIComponent(detailsText)}`

    const url = `${base}&text=${title}&dates=${dates}${details}`
    return url
  }

  const url = () => buildGoogleCalendarUrl()

  return (
    <div class={'flex flex-row'}>
      <a
        target={'_blank'}
        rel={'noreferrer noopener'}
        class={
          'flex flex-row items-center gap-1 rounded-full bg-accent-200/50 px-2 py-1 text-xs text-black no-underline transition-all hover:cursor-pointer hover:bg-accent-200'
        }
        href={url()}
      >
        Add to Google Calendar <FaRegularCalendarPlus />
      </a>
    </div>
  )
}

interface DownloadIcsButtonProps {
  stream: Stream
  user?: UserDisplay
}

const DownloadIcsButton: Component<DownloadIcsButtonProps> = (props) => {
  const buildIcs = (stream: Stream) => {
    const cal = ical({ name: 'Jingle Jam Stream' })
    const start = DateTime.fromJSDate(stream.start)
    const end = DateTime.fromJSDate(stream.end)

    const detailsParts: string[] = []
    if (stream.subtitle) detailsParts.push(stream.subtitle)
    if (stream.description) detailsParts.push(stream.description)
    const description = detailsParts.join('\n\n')
    const title = encodeURIComponent(
      (stream.title ?? 'Jingle Jam Stream') +
        ' ' +
        (props.user?.username ?? ''),
    )
    const twitchUrl = props.user
      ? `https://twitch.tv/${props.user?.twitchLogin}`
      : ''
    cal.createEvent({
      start,
      end,
      summary: title,
      description: description || undefined,
      url: twitchUrl,
      alarms: [
        {
          type: ICalAlarmType.display,
          triggerBefore: start.minus(Duration.fromObject({ minutes: 15 })),
        },
      ],
    })

    return cal.toString()
  }

  const sanitize = (s: string) =>
    s.replace(/[^A-Za-z0-9-_]+/g, '_').slice(0, 60)

  const filename = () => {
    const start = DateTime.fromJSDate(props.stream.start)
    const date = start.toFormat('yyyy-LL-dd_HHmm')
    const title = encodeURIComponent(
      (props.stream.title ?? 'Jingle Jam Stream') +
        ' ' + `- JJ ${start.year} - `+
        (props.user?.username ?? ''),
    )
    return `${date}_${title}.ics`
  }

  const download = () => {
    const data = buildIcs(props.stream)
    const a = document.createElement('a')
    a.setAttribute(
      'href',
      'data:text/calendar;charset=utf8,' + encodeURIComponent(data),
    )
    a.setAttribute('download', filename())
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div class={'flex flex-row'}>
      <button
        type="button"
        class={
          'flex flex-row items-center gap-1 rounded-full bg-accent-200/50 px-2 py-1 text-xs text-black transition-all hover:cursor-pointer hover:bg-accent-200'
        }
        onClick={download}
      >
        Download .ics{''} <FaRegularCalendarPlus />
      </button>
    </div>
  )
}
