import { StandardRPCJsonSerializer } from '@orpc/client/standard'
import { type CachePolicy, ttlFor } from './cachePolicy.ts'

// Read-through cache on the Cache API (`caches.default`): free, per data center, no KV writes.
// Freshness is decided here from headers written at put time, not by the Cache API's own expiry
// (which only caps how long an entry is kept): fresh for the policy's TTL, then served stale for
// `swr` more seconds while one background refresh runs, then a miss.
// Values go through oRPC's serializer, so Dates, Maps, Sets and undefined come back as they went in.
// Note: the Cache API is a no-op on *.workers.dev; it works on the custom domains.

// `forbidden` (a private schedule or team) is never stored; see put().
export type EdgeEntry<T> =
  | { value: T }
  | { notFound: true; message?: string }
  | { forbidden: true; message?: string }

const STORED_AT = 'x-edge-stored-at'
const TTL = 'x-edge-ttl'
const SWR = 'x-edge-swr'

// The built-in serializer drops object properties that are `undefined` (as JSON does); this keeps
// them, so a cached answer has the same keys as a fresh one (Astro renders island props by key).
const serializer = new StandardRPCJsonSerializer({
  customJsonSerializers: [
    {
      type: 100,
      condition: (data) => data === undefined,
      serialize: () => null,
      deserialize: () => undefined,
    },
  ],
})

// The tsconfig's DOM lib types `caches` without the Workers-only `default`.
const edgeCache = () => (caches as unknown as { default: Cache }).default

// Keys whose background refresh is running in this isolate, so a burst of stale hits refreshes once.
const refreshing = new Set<string>()

type Options<T> = {
  /** Absolute URL of the entry; build it with edgeCacheKey. */
  key: string
  policy: CachePolicy
  load: () => Promise<EdgeEntry<T>>
  /** The request's waitUntil. Without it, puts are awaited and stale entries count as misses. */
  waitUntil?: (promise: Promise<unknown>) => void
  /** Skip the read: always load, then store the result (or drop the entry if it can't be stored). */
  refresh?: boolean
}

/** Cache URL for `parts` on the request's own host (`/__edge-cache/…`, never served to visitors). */
export function edgeCacheKey(requestUrl: string, parts: string[]) {
  const path = parts.map(encodeURIComponent).join('/')
  return new URL(`/__edge-cache/v1/${path}`, requestUrl).toString()
}

/** Key from the whole input (object keys sorted), for answers that depend on every field. */
export const byInput = (input: unknown) => stableJson(input) ?? ''

function stableJson(value: unknown): string | undefined {
  return JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : v,
  )
}

/** Deletes the entries (in this data center only: the Cache API has no global delete). Never throws. */
export async function forgetEdgeCached(keys: string[]) {
  await Promise.all(keys.map(forget))
}

export async function edgeCached<T>({
  key,
  policy,
  load,
  waitUntil,
  refresh = false,
}: Options<T>): Promise<EdgeEntry<T>> {
  const now = Date.now()
  const hit = refresh ? undefined : await match(key)
  if (hit) {
    const storedAt = Number(hit.headers.get(STORED_AT))
    const ttl = Number(hit.headers.get(TTL))
    const swr = Number(hit.headers.get(SWR))
    const age = (now - storedAt) / 1000
    // A negative age (stored "in the future" by a skewed clock) counts as a miss.
    if (age >= 0 && age < ttl) return read<T>(hit)
    if (age >= 0 && age < ttl + swr && waitUntil) {
      if (!refreshing.has(key)) {
        refreshing.add(key)
        waitUntil(
          load()
            .then((entry) => put(key, entry, policy, true))
            .catch((e) => console.error('edge cache refresh failed', key, e))
            .finally(() => refreshing.delete(key)),
        )
      }
      return read<T>(hit)
    }
  }

  const entry = await load()
  const stored = put(key, entry, policy, refresh)
  if (waitUntil) waitUntil(stored)
  else await stored
  return entry
}

async function match(key: string) {
  try {
    return await edgeCache().match(key)
  } catch (e) {
    console.error('edge cache match failed', key, e)
    return undefined
  }
}

async function read<T>(response: Response): Promise<EdgeEntry<T>> {
  const { json, meta } = (await response.json()) as {
    json: unknown
    meta: Parameters<StandardRPCJsonSerializer['deserialize']>[1]
  }
  return serializer.deserialize(json, meta) as EdgeEntry<T>
}

/**
 * Stores `entry`; a NOT_FOUND only when the policy has a negativeTtl, a FORBIDDEN never. On a refresh
 * (a logged-in request, or the background refresh of a stale entry), an answer that can't be stored
 * deletes the entry instead, so an older answer isn't served on (a hidden schedule). Never throws.
 */
async function put<T>(
  key: string,
  entry: EdgeEntry<T>,
  policy: CachePolicy,
  refresh = false,
) {
  const isNotFound = 'notFound' in entry
  if ('forbidden' in entry || (isNotFound && policy.negativeTtl === undefined)) {
    if (refresh) await forget(key)
    return
  }
  const ttl = isNotFound ? policy.negativeTtl! : ttlFor(policy, new Date())
  const swr = isNotFound ? 0 : (policy.swr ?? 0)
  const [json, meta] = serializer.serialize(entry)
  try {
    await edgeCache().put(
      key,
      new Response(JSON.stringify({ json, meta }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `max-age=${ttl + swr}`,
          [STORED_AT]: String(Date.now()),
          [TTL]: String(ttl),
          [SWR]: String(swr),
        },
      }),
    )
  } catch (e) {
    console.error('edge cache put failed', key, e)
  }
}

async function forget(key: string) {
  try {
    await edgeCache().delete(key)
  } catch (e) {
    console.error('edge cache delete failed', key, e)
  }
}
