
export async function getJSON<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function putJSON(
  kv: KVNamespace,
  key: string,
  value: unknown,
  ttlSeconds: number = 60,
) {
  await kv.put(key, stringifyWithDates(value), { expirationTtl: ttlSeconds })
}

function stringifyWithDates(value: unknown) {
  return JSON.stringify(value, (_key, val) => {
    if (val instanceof Date) {
      return val.toISOString()
    }
    return val as any
  })
}
