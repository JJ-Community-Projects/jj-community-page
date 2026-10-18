// How long each cached entity lives, in seconds: one table instead of per-call TTLs.
// Values follow the cache policy of the D1/KV plan (§6.3a); entities are added as their caches move here.
// `negativeTtl`: how long a "not found" answer is cached, shorter so a new campaign or schedule shows up soon.
// `eventTtl`: the TTL during the event (see isEventSeason); `ttl` applies the rest of the year.
// `swr`: how long after the TTL a stale copy may still be served while one refresh runs in the background.
export type CachePolicy = {
  ttl: number
  eventTtl?: number
  swr?: number
  negativeTtl?: number
}

export const CACHE_POLICY = {
  /** Donation totals, campaigns, causes, overview, donation matches. */
  jjLive: { ttl: 60 * 60, eventTtl: 30, swr: 30 },
  /** "Next / live now" stream lists (time-dependent). */
  upcoming: { ttl: 15 * 60, eventTtl: 60, swr: 60 },
  /** Public schedule (page, overlays). */
  schedule: {
    ttl: 15 * 60,
    eventTtl: 5 * 60,
    swr: 5 * 60,
    negativeTtl: 5 * 60,
  },
  /** Team page, members, team overlays. */
  team: { ttl: 15 * 60, swr: 15 * 60, negativeTtl: 5 * 60 },
  /** Public profile (display, socials, tags). */
  profile: { ttl: 15 * 60, swr: 15 * 60, negativeTtl: 10 * 60 },
  /** Profile "related users" (tag overlap). Changes only when tags are edited. */
  relatedUsers: { ttl: 6 * 60 * 60, swr: 60 * 60 },
  /** Community cards (`getAllUsersWithInfo`). */
  userDirectory: { ttl: 30 * 60, eventTtl: 10 * 60, swr: 10 * 60 },
  tagCatalog: { ttl: 30 * 60, swr: 30 * 60 },
  /** Extension config, yogs config, content visibility. */
  config: { ttl: 10 * 60, swr: 10 * 60 },
  /** Deploy-only content (yogs schedule); the key must include the build. */
  staticContent: { ttl: 24 * 60 * 60 },
  /** Twitch channel id → user. */
  channelMap: { ttl: 60 * 60, negativeTtl: 10 * 60 },
  liveStatus: { ttl: 60 },
  /** The logged-in user kept inside the KV session value; D1 is read again when it is older. */
  sessionUser: { ttl: 60 * 60 },
  /** Twitch extension overview (JJ totals) in KV: one entry per variant, the same for every channel. */
  extensionOverview: { ttl: 60 },
  /** Twitch extension: a channel's fundraiser (`userData`) in KV. */
  extensionUserData: { ttl: 60, negativeTtl: 5 * 60 },
  /** Twitch extension: a channel's schedule (`userSchedule`) in KV. */
  extensionUserSchedule: { ttl: 10 * 60, negativeTtl: 5 * 60 },
} as const satisfies Record<string, CachePolicy>

export type CacheEntity = keyof typeof CACHE_POLICY

/** Dec 1–21 (UTC): the event weeks, when `eventTtl` applies. */
export function isEventSeason(now: Date) {
  return now.getUTCMonth() === 11 && now.getUTCDate() <= 21
}

/** The TTL of `policy` at `now`: `eventTtl` during the event, else `ttl`. */
export function ttlFor(policy: CachePolicy, now: Date) {
  return isEventSeason(now) ? (policy.eventTtl ?? policy.ttl) : policy.ttl
}
