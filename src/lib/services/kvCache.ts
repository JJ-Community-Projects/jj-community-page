/**
 * Writes a cache entry to KV. A failed write (daily write cap, 1 write per second per key, a
 * transient KV error) is logged, not thrown: the cache must never fail the request it caches.
 */
export async function putCache(
  kv: KVNamespace,
  key: string,
  value: string,
  options?: KVNamespacePutOptions,
) {
  try {
    await kv.put(key, value, options)
  } catch (e) {
    console.error('KV cache put failed', key, e)
  }
}
