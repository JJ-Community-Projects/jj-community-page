// How long each cached entity lives, in seconds: one table instead of per-call TTLs.
// Values follow the cache policy of the D1/KV plan (§6.3a); entities are added as their caches move here.
// `negativeTtl`: how long a "not found" answer is cached, shorter so a new campaign or schedule shows up soon.
export const CACHE_POLICY = {
  /** Profile "related users" (tag overlap). Changes only when tags are edited. */
  relatedUsers: { ttl: 6 * 60 * 60 },
  /** Twitch extension overview (JJ totals): one entry per variant, the same for every channel. */
  extensionOverview: { ttl: 60 },
  /** Twitch extension: a channel's fundraiser (`userData`). */
  extensionUserData: { ttl: 60, negativeTtl: 5 * 60 },
  /** Twitch extension: a channel's schedule (`userSchedule`). */
  extensionUserSchedule: { ttl: 10 * 60, negativeTtl: 5 * 60 },
} as const satisfies Record<string, { ttl: number; negativeTtl?: number }>
