import { type Component, For, Match, Show, Switch } from 'solid-js'
import {
  FaBrandsTwitch,
  FaBrandsYoutube,
  FaRegularCalendarPlus,
  FaSolidLink,
} from 'solid-icons/fa'
import { DateTime, Duration } from 'luxon'
import ical, { ICalAlarmType } from 'ical-generator'
import { getTextColor } from '../../../lib/utils/textColors.ts'
import type {
  YogsCreator,
  YogsStream,
  YogsVOD,
} from '../../../lib/orpc/private/yogs/contract.ts'
import { YogsStreamUtils } from '../../../lib/utils/YogsStreamUtils.ts'
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
import { YogsCreatorChip } from '../creators/YogsCreatorChip.tsx'
import { Dialog } from '../../ui/Dialog'
import { Button } from '../../ui/Button'
import { LiveBadge } from '../../ui/Labels'
import { sectionLabel } from '../../features/schedules/common/StreamParticipants'

interface YogsScheduleDetailDialogProps {
  stream: YogsStream
  modalSignal: ModalSignal
}

/**
 * A stream's details, in the same layout as ScheduleStreamDetailDialog: header band in the stream
 * colour, when + live / countdown / ended, description, watch (live, VODs), creators, calendar, and
 * the schedule notice as fine print. Only rendered while open, so always after mount.
 */
export const YogsScheduleDetailDialog: Component<
  YogsScheduleDetailDialogProps
> = (props) => {
  const stream = () => props.stream
  const color = () => stream().color ?? '#ff0000'
  const { now } = useYogsSchedule()

  const start = () => DateTime.fromJSDate(stream().start)
  const end = () => DateTime.fromJSDate(stream().end)
  const isLive = () => start() < now() && end() > now()
  const isBefore = () => YogsStreamUtils.isBefore(stream(), now())
  const isOver = () => end() < now()

  const countdownFormat = () => {
    const d = start().diff(now())
    if (d.as('day') < 1) {
      return d.toFormat("hh'h' mm'm' ss's'")
    }
    return d.toFormat("dd'd' hh'h' mm'm' ss's'")
  }

  // "Mon 1 Dec · 15:00 – 18:00 GMT+1", in the viewer's timezone and locale
  const when = () => {
    const day = start().toLocaleString({
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    const time = (dt: DateTime) => dt.toLocaleString(DateTime.TIME_SIMPLE)
    return `${day} · ${time(start())} – ${time(end())} ${start().offsetNameShort ?? ''}`
  }

  const creators = () =>
    [...(stream().creators ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  const vods = () => stream().vods ?? []

  return (
    <Dialog
      open={props.modalSignal.isOpen()}
      onOpenChange={props.modalSignal.setOpen}
      title={stream().title}
      description={stream().subtitle || undefined}
      accent={{ background: color(), color: getTextColor(color()) }}
      aside={<YogsStreamDisclaimer />}
    >
      <div class="flex flex-col gap-4 text-sm">
        <div class="flex flex-col items-start gap-1">
          <p class="font-semibold">{when()}</p>
          <Switch>
            <Match when={isLive()}>
              <LiveBadge label="Live now" />
            </Match>
            <Match when={isBefore()}>
              <p class="text-fg-muted text-xs">
                Starts in{' '}
                <span class="font-medium tabular-nums">{countdownFormat()}</span>
              </p>
            </Match>
            <Match when={isOver()}>
              <p class="text-fg-muted text-xs">Ended</p>
            </Match>
          </Switch>
        </div>

        <Show
          when={stream().markdownDescription}
          fallback={
            <Show when={stream().description}>
              <p class="whitespace-pre-line">{stream().description}</p>
            </Show>
          }
        >
          <div class="prose prose-sm max-w-none">
            <SolidMarkdown
              children={stream().markdownDescription}
              renderingStrategy={'reconcile'}
              remarkPlugins={[remarkGfm]}
              linkTarget={'_blank'}
            />
          </div>
        </Show>

        <Show when={isLive() || vods().length > 0}>
          <section class="flex flex-col gap-1.5">
            <h3 class={sectionLabel}>Watch</h3>
            <div class="flex flex-wrap gap-2">
              <Show when={isLive()}>
                <Button
                  href="https://twitch.tv/yogscast"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  brand="twitch"
                >
                  <FaBrandsTwitch aria-hidden="true" /> Watch live on Twitch
                </Button>
              </Show>
              <For each={vods()}>{(vod) => <VodButton vod={vod} />}</For>
            </div>
          </section>
        </Show>

        <Show when={creators().length > 0}>
          <section class="flex flex-col gap-1.5">
            <h3 class={sectionLabel}>Creators</h3>
            <div class="flex flex-wrap gap-1.5">
              <For each={creators()}>
                {(creator) => (
                  <StreamCreator
                    creator={creator}
                    stream={stream()}
                    modalSignal={props.modalSignal}
                  />
                )}
              </For>
            </div>
          </section>
        </Show>

        <Show when={isBefore()}>
          <section class="flex flex-col gap-1.5">
            <h3 class={sectionLabel}>Add to calendar</h3>
            <div class="flex flex-wrap gap-2">
              <AddToGoogleCalendarButton stream={stream()} />
              <DownloadIcsButton stream={stream()} />
            </div>
          </section>
        </Show>
      </div>
    </Dialog>
  )
}

const VodButton: Component<{ vod: YogsVOD }> = (props) => {
  const brand = () =>
    props.vod.type === 'youtube' || props.vod.type === 'twitch'
      ? props.vod.type
      : undefined
  return (
    <Button
      href={props.vod.link}
      target="_blank"
      rel="noopener noreferrer"
      size="sm"
      brand={brand()}
    >
      <Switch fallback={<FaSolidLink aria-hidden="true" />}>
        <Match when={props.vod.type === 'youtube'}>
          <FaBrandsYoutube aria-hidden="true" />
        </Match>
        <Match when={props.vod.type === 'twitch'}>
          <FaBrandsTwitch aria-hidden="true" />
        </Match>
      </Switch>
      {props.vod.label}
    </Button>
  )
}

interface StreamCreatorProps {
  creator: YogsCreator
  stream: YogsStream
  modalSignal: ModalSignal
}

/** A creator chip that opens the creator dialog over this one. */
const StreamCreator: Component<StreamCreatorProps> = (props) => {
  const modal = createModalSignal()
  const { getCreatorStreams } = useYogsSchedule()
  const { reset, addFilter } = useCreatorFilter()

  const streamCount = getCreatorStreams(props.creator.id).length

  const onJJStreamsClick = () => {
    reset()
    modal.close()
    props.modalSignal.close()
    addFilter(props.creator.id)
    logCreatorSlotFilterClick(props.creator, props.stream)
  }

  return (
    <>
      <YogsCreatorChip
        creator={props.creator}
        onClick={() => {
          modal.open()
          logCreatorFromSlotClick(props.creator, props.stream)
        }}
      />
      <YogsCreatorDialog
        creator={props.creator}
        modalSignal={modal}
        streamCount={streamCount}
        onJJStreamsClick={streamCount > 1 ? onJJStreamsClick : undefined}
      />
    </>
  )
}

interface AddToGoogleCalendarButtonProps {
  stream: YogsStream
}

const AddToGoogleCalendarButton: Component<AddToGoogleCalendarButtonProps> = (
  props,
) => {
  const buildGoogleCalendarUrl = (stream: YogsStream) => {
    const startUtc = DateTime.fromJSDate(stream.start)
      .toUTC()
      .toFormat("yyyyLLdd'T'HHmmss'Z'")
    const endUtc = DateTime.fromJSDate(stream.end)
      .toUTC()
      .toFormat("yyyyLLdd'T'HHmmss'Z'")

    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE'

    const title = encodeURIComponent(
      (stream.title ?? 'Jingle Jam Stream') +
        ` - Yogscast JJ ${stream.start.getFullYear()}`,
    )
    const dates = `${startUtc}/${endUtc}`

    // Build details as: [DESCRIPTION or SUBTITLE]\n[WEBSITE URL]
    const descriptionText = stream.description || stream.subtitle || ''
    const detailsText = descriptionText
      ? `${descriptionText}\nhttps://twitch.tv/yogscast`
      : 'https://twitch.tv/yogscast'
    const details = `&details=${encodeURIComponent(detailsText)}`

    // No explicit location is available on stream; omit when unknown
    const url = `${base}&text=${title}&dates=${dates}${details}`
    return url
  }

  const url = () => buildGoogleCalendarUrl(props.stream)

  return (
    <Button target="_blank" rel="noreferrer noopener" size="sm" href={url()}>
      Add to Google Calendar <FaRegularCalendarPlus aria-hidden="true" />
    </Button>
  )
}

interface DownloadIcsButtonProps {
  stream: YogsStream
}

const DownloadIcsButton: Component<DownloadIcsButtonProps> = (props) => {
  const buildIcs = (stream: YogsStream) => {
    const cal = ical({ name: 'Jingle Jam Stream' })
    const start = DateTime.fromJSDate(stream.start)
    const end = DateTime.fromJSDate(stream.end)

    const detailsParts: string[] = []
    if (stream.subtitle) detailsParts.push(stream.subtitle)
    if (stream.description) detailsParts.push(stream.description)
    const description = detailsParts.join('\n\n')

    cal.createEvent({
      start,
      end,
      summary: stream.title ?? `Jingle Jam ${start.year} Stream`,
      description: description || undefined,
      url: 'https://twitch.tv/yogscast',
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
    const title = sanitize(
      (props.stream.title ?? 'Jingle_Jam_Stream') +
        ` - Yogscast JJ ${props.stream.start.getFullYear()}`,
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
