import { waitUntil } from 'cloudflare:workers'

// Per-isolate stale-while-revalidate for small values that rarely change (config year, visibility
// flag). Only an isolate's first request waits for the source; later ones get the kept value at
// once, and one past its TTL is refreshed in the background, so a change shows up one request later.
type Entry<T> = { value: T; until: number; refreshing: boolean }

const entries = new Map<string, Entry<unknown>>()

export async function isolateCached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<T> {
  const entry = entries.get(key) as Entry<T> | undefined
  if (!entry) {
    const value = await load()
    entries.set(key, { value, until: Date.now() + ttlMs, refreshing: false })
    return value
  }
  if (entry.until <= Date.now() && !entry.refreshing) {
    entry.refreshing = true
    waitUntil(
      load()
        .then((value) => {
          entries.set(key, { value, until: Date.now() + ttlMs, refreshing: false })
        })
        .catch((e) => {
          console.error('isolate cache refresh failed', key, e)
          entry.refreshing = false
        }),
    )
  }
  return entry.value
}
