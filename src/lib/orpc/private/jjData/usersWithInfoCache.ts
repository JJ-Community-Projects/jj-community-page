import type { UserWithInfo } from './contract.ts'

/**
 * Store an array of UserWithInfo objects in KV, preserving Date values.
 */
export async function storeUsersWithInfo(
  kv: KVNamespace,
  key: string,
  users: UserWithInfo[],
  ttlSeconds: number = 300,
) {
  // Dates stringify to ISO by default
  const json = JSON.stringify(users)
  await kv.put(key, json, { expirationTtl: ttlSeconds })
}

/**
 * Load an array of UserWithInfo objects from KV, reviving Date values.
 * Returns null when not present or on parse error.
 */
export async function loadUsersWithInfo(
  kv: KVNamespace,
  key: string,
): Promise<UserWithInfo[] | null> {
  const raw = await kv.get(key)
  if (!raw) return null
  try {
    const revived = JSON.parse(raw, (k, v) => reviveUserWithInfoDates(k, v))
    return revived as UserWithInfo[]
  } catch {
    return null
  }
}

function reviveUserWithInfoDates(key: string, value: unknown) {
  // Only revive known date fields for this type
  if (key === 'createdAt' && typeof value === 'string' && isISODate(value)) {
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d
  }
  return value as any
}

// Simple ISO-8601 date-time check (e.g., 2025-11-29T12:34:56.789Z)
function isISODate(s: string): boolean {
  // Quick length/character checks to avoid expensive regex on arbitrary strings
  if (s.length < 20 || s.length > 40) return false
  // Basic pattern test
  return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/.test(s)
}
