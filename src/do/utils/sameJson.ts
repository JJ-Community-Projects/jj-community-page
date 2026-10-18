// Deep equality of two parsed JSON values; object key order is ignored.
export function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const x = a as Record<string, unknown>
  const y = b as Record<string, unknown>
  const keys = Object.keys(x)
  return (
    keys.length === Object.keys(y).length &&
    keys.every((key) => Object.hasOwn(y, key) && sameJson(x[key], y[key]))
  )
}
