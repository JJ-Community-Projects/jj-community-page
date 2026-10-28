import { type Component, type JSX, Show } from 'solid-js'
import type { Stream } from '../../../../lib/orpc/public/schemas/schedules.ts'
import { DateTime, Duration } from 'luxon'
import ical, { ICalAlarmType } from 'ical-generator'
import { useNow } from '../../../../lib/utils/useNow.ts'
import { type ModalSignal } from '../../../../lib/createModalSignal.ts'
import { getStreamColor } from '../../../../functions/jjDatesToColors.ts'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { Chip, LiveBadge } from '../../../ui/Labels'
import { StreamTags } from './StreamTags'
import { StreamParticipants } from './StreamParticipants'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema.ts'
import {
  FaBrandsTwitch,
  FaBrandsYoutube,
  FaRegularCalendarPlus,
} from 'solid-icons/fa'

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
          class="text-twitch-600 font-medium underline"
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

  const showCountdown = () => {
    return getStreamStartDateTime() > now() && !stream().isTimeTBD
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

  const when = () =>
    stream().isTimeTBD
      ? `${getStreamStartDateTime().toLocaleString({ weekday: 'short', month: 'short', day: 'numeric' })} TBD`
      : getStreamStartDateTime().toLocaleString({
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          timeZoneName: 'short',
        })

  return (
    <Dialog
      open={props.modalSignal.isOpen()}
      onOpenChange={props.modalSignal.setOpen}
      title={stream().title}
      description={stream().subtitle || undefined}
    >
      <div class="flex flex-col gap-4 text-sm">
        <div class="flex flex-wrap items-center gap-2">
          <Chip color={highlightColor}>{when()}</Chip>
          <Show when={isLive()}>
            <LiveBadge />
          </Show>
          <Show when={showCountdown()}>
            <span class="text-fg-muted text-xs font-medium tabular-nums">
              starts in {countdownFormat()}
            </span>
          </Show>
        </div>

        <Show when={stream().description}>
          <p class="whitespace-pre-line">
            {linkifyTwitch(stream().description as string)}
          </p>
        </Show>

        <Show when={props.user}>
          {(user) => (
            <div class="flex flex-wrap gap-2">
              <Button
                href={`/${user().tiltifySlug}`}
                size="sm"
                variant="accent"
              >
                Go to user profile
              </Button>
              <Show when={user().twitchLogin}>
                {(twitchLogin) => (
                  <Button
                    href={`https://twitch.tv/${twitchLogin()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                    brand="twitch"
                  >
                    <FaBrandsTwitch aria-hidden="true" /> Open Twitch
                  </Button>
                )}
              </Show>
              <Show when={user().youtubeUrl}>
                {(url) => (
                  <Button
                    href={url()}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                    brand="youtube"
                  >
                    <FaBrandsYoutube aria-hidden="true" /> Open YouTube
                  </Button>
                )}
              </Show>
            </div>
          )}
        </Show>

        <Show when={showCountdown()}>
          <div class="flex flex-wrap gap-2">
            <AddToGoogleCalendarButton stream={stream()} user={props.user} />
            <DownloadIcsButton stream={stream()} user={props.user} />
          </div>
        </Show>

        <StreamTags tags={stream().tags} />
        <StreamParticipants participants={stream().participants} />
      </div>
    </Dialog>
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
        ' - ' +
        `JJ ${props.stream.start.getFullYear()} - ` +
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
    <Button target="_blank" rel="noreferrer noopener" size="sm" href={url()}>
      Add to Google Calendar <FaRegularCalendarPlus aria-hidden="true" />
    </Button>
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
        ' ' +
        `- JJ ${start.year} - ` +
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
    <Button size="sm" onClick={download}>
      Download .ics <FaRegularCalendarPlus aria-hidden="true" />
    </Button>
  )
}
