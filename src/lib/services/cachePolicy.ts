// How long each cached entity lives, in seconds: one table instead of per-call TTLs.
// Values follow the cache policy of the D1/KV plan (§6.3a); entities are added as their caches move here.
export const CACHE_POLICY = {
  /** Profile "related users" (tag overlap). Changes only when tags are edited. */
  relatedUsers: { ttl: 6 * 60 * 60 },
} as const satisfies Record<string, { ttl: number }>
