import type {
  YogsSchedule,
  YogsStream,
} from '../lib/orpc/private/yogs/contract.ts'
import { canonicalUrl } from '../lib/utils/canonical.ts'

/** The Yogscast channel, where the Jingle Jam streams run unless a stream names its own channel. */
const YOGSCAST_CHANNEL = 'https://www.twitch.tv/yogscast'
const ONLINE = 'https://schema.org/OnlineEventAttendanceMode'

export type JsonLd = Record<string, unknown>

/**
 * schema.org EventSeries for one Jingle Jam year, with every stream as an online `Event` in
 * `subEvent`. `pageUrl` is the canonical URL of the page that shows the schedule (`/yogs` for the
 * current year, `/yogs/archive/<year>`); the `@id`s are fragments of it.
 * Returns undefined when the schedule has no streams.
 */
export function getJingleJamEventSeries(
  schedule: YogsSchedule,
  pageUrl: string,
): JsonLd | undefined {
  if (schedule.streams.length === 0) return undefined

  const subEvent = schedule.streams.map((stream, index) =>
    streamEvent(stream, `${pageUrl}#stream-${index + 1}`),
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'EventSeries',
    '@id': `${pageUrl}#event-series`,
    name: schedule.title,
    url: pageUrl,
    startDate: schedule.start.toISOString(),
    endDate: schedule.end.toISOString(),
    eventAttendanceMode: ONLINE,
    location: virtualLocation(YOGSCAST_CHANNEL),
    subEvent,
  }
}

function streamEvent(stream: YogsStream, id: string): JsonLd {
  const description = stream.description || stream.subtitle
  const performer = (stream.creators ?? []).map((creator) => ({
    '@type': 'Person',
    name: creator.name,
    ...(creator.url && { url: creator.url }),
  }))
  return {
    '@type': 'Event',
    '@id': id,
    name: stream.title,
    ...(description && { description }),
    startDate: stream.start.toISOString(),
    endDate: stream.end.toISOString(),
    eventAttendanceMode: ONLINE,
    location: virtualLocation(stream.owner?.url || YOGSCAST_CHANNEL),
    ...(performer.length > 0 && { performer }),
  }
}

function virtualLocation(url: string) {
  return { '@type': 'VirtualLocation', url }
}

/** schema.org BreadcrumbList; a `url` that is a path (`/yogs`) becomes its canonical URL. */
export function getBreadcrumbList(
  items: { name: string; url: string }[],
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('/') ? canonicalUrl(item.url) : item.url,
    })),
  }
}

/** JSON for a `<script type="application/ld+json">`: `<` is escaped so no value can close the tag. */
export function jsonLdScript(data: JsonLd) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
