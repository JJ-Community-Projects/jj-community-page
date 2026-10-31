import { type Component, type JSX, Match, Show, Switch } from 'solid-js'
import type { Stream } from '../../../../lib/orpc/public/schemas/schedules.ts'
import { DateTime, Duration } from 'luxon'
import ical, { ICalAlarmType } from 'ical-generator'
import { useNow } from '../../../../lib/utils/useNow.ts'
import { type ModalSignal } from '../../../../lib/createModalSignal.ts'
import { getStreamColor } from '../../../../functions/jjDatesToColors.ts'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { LiveBadge } from '../../../ui/Labels'
import { StreamTags } from './StreamTags'
import { StreamParticipants, sectionLabel } from './StreamParticipants'
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
  /** The row's colour (e.g. its day's); the stream's own day colour when unset. */
  color?: string
}

/**
 * A stream's details, laid out like the extension's slot dialog: header band in the stream colour,
 * then when (with live / countdown / ended), description, participants, tags, the streamer's links
 * and the calendar buttons.
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

  // UTC dates from the backend, shown in the viewer's time zone
  const start = () =>
    DateTime.fromJSDate(stream().start, { zone: 'utc' }).toLocal()
  const end = () => DateTime.fromJSDate(stream().end, { zone: 'utc' }).toLocal()

  // The UTC day's colour, like the rows, unless the row passes its own
  const color = () =>
    props.color ??
    getStreamColor(DateTime.fromJSDate(stream().start, { zone: 'utc' }))

  const isLive = () => start() < now() && end() > now()
  const isOver = () => end() < now()
  const showCountdown = () => start() > now() && !stream().isTimeTBD

  const countdownFormat = () => {
    const d = start().diff(now())
    if (d.as('day') < 1) {
      return d.toFormat("hh'h' mm'm' ss's'")
    }
    return d.toFormat("dd'd' hh'h' mm'm' ss's'")
  }

  // "Sat 6 Dec · 20:00 – 22:00 GMT"
  const when = () => {
    const day = start().toLocaleString({
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    if (stream().isTimeTBD) return `${day} · time TBD`
    const time = (dt: DateTime) => dt.toLocaleString(DateTime.TIME_SIMPLE)
    return `${day} · ${time(start())} – ${time(end())} ${start().offsetNameShort ?? ''}`
  }

  return (
    <Dialog
      open={props.modalSignal.isOpen()}
      onOpenChange={props.modalSignal.setOpen}
      title={stream().title}
      description={stream().subtitle || undefined}
      accent={color()}
    >
      <div class="flex flex-col gap-4 text-sm">
        <div class="flex flex-col items-start gap-1">
          <p class="font-semibold">{when()}</p>
          <Switch>
            <Match when={isLive()}>
              <LiveBadge label="Live now" />
            </Match>
            <Match when={showCountdown()}>
              <p class="text-fg-muted text-xs">
                Starts in{' '}
                <span class="font-medium tabular-nums">
                  {countdownFormat()}
                </span>
              </p>
            </Match>
            <Match when={isOver()}>
              <p class="text-fg-muted text-xs">Ended</p>
            </Match>
          </Switch>
        </div>

        <Show when={stream().description}>
          <p class="whitespace-pre-line">
            {linkifyTwitch(stream().description as string)}
          </p>
        </Show>

        <StreamParticipants participants={stream().participants} />
        <StreamTags tags={stream().tags} />

        <Show when={props.user}>
          {(user) => (
            <section class="flex flex-col gap-1.5">
              <h3 class={sectionLabel}>Streamer</h3>
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
            </section>
          )}
        </Show>

        <Show when={showCountdown()}>
          <section class="flex flex-col gap-1.5">
            <h3 class={sectionLabel}>Add to calendar</h3>
            <div class="flex flex-wrap gap-2">
              <AddToGoogleCalendarButton stream={stream()} user={props.user} />
              <DownloadIcsButton stream={stream()} user={props.user} />
            </div>
          </section>
        </Show>
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
