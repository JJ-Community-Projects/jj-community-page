// Shared by the milestones and incentives overlays: a list of amount + text
// items carried in the overlay URL as repeated `item=<amount>~<text>` params.

export type GoalItem = { value: number; text: string }
export type GoalOrder = 'asc' | 'desc'
/** How many items the overlay shows at a time. */
export type ShowCount = number | 'all'

export const ITEM_PARAM = 'item'
export const MAX_ITEMS = 30
export const MAX_TEXT = 100
const SEPARATOR = '~'

export const encodeItem = (item: GoalItem) =>
  `${item.value}${SEPARATOR}${item.text}`

export function parseAmount(raw: string): number | undefined {
  const trimmed = raw.trim()
  if (trimmed === '') return undefined
  const value = Number(trimmed)
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

export function parseItems(raw: string[]): GoalItem[] {
  const items: GoalItem[] = []
  for (const entry of raw) {
    if (items.length >= MAX_ITEMS) break
    const at = entry.indexOf(SEPARATOR)
    const value = parseAmount(at === -1 ? entry : entry.slice(0, at))
    if (value === undefined) continue
    const text =
      at === -1
        ? ''
        : entry
            .slice(at + 1)
            .trim()
            .slice(0, MAX_TEXT)
    items.push({ value, text })
  }
  return sortItems(items)
}

/** Equal amounts keep their entry order (stable sort). */
export const sortItems = (items: GoalItem[]) =>
  [...items].sort((a, b) => a.value - b.value)

export function parseShowCount(raw: string | null): ShowCount {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 ? Math.min(n, MAX_ITEMS) : 'all'
}

export const parseOrder = (raw: string | null): GoalOrder =>
  raw === 'desc' ? 'desc' : 'asc'

export function parseFlag(raw: string | null, fallback: boolean): boolean {
  if (raw === '1' || raw === 'true') return true
  if (raw === '0' || raw === 'false') return false
  return fallback
}

export const reachedCount = (items: GoalItem[], raised: number) =>
  items.filter((item) => raised >= item.value).length

/**
 * The milestones on screen, as indices into the items sorted lowest first:
 * the last reached one and the next `show - 1`. Before the first is reached
 * that's the first `show`; once all are reached, the last `show`.
 */
export function milestoneWindow(
  count: number,
  reached: number,
  show: ShowCount,
): { start: number; end: number } {
  if (show === 'all' || show >= count) return { start: 0, end: count }
  const start = Math.min(Math.max(0, reached - 1), count - show)
  return { start, end: start + show }
}

export function fillBetween(from: number, to: number, raised: number) {
  if (to <= from) return raised >= to ? 1 : 0
  return Math.min(1, Math.max(0, (raised - from) / (to - from)))
}

/** A rendered milestone row and its dot, in px from the top of the list. */
export type RowBox = {
  top: number
  bottom: number
  dotTop: number
  dotBottom: number
}

/** The goal bar: one track from `top` over `height` px, filled `fill` (0–1) from its low end. */
export type BarGeometry = { top: number; height: number; fill: number }

/**
 * One continuous goal bar beside the list. Amounts map to positions through the
 * dot (marker) centres: each milestone sits at its marker, and amounts in between
 * fall proportionally between the two. The bar always runs the full height of the
 * items shown: from the outer edge of the lowest (at halfway to the milestone below
 * it, at 0 for the first) to the outer edge of the highest (at halfway to the next
 * milestone; when it's the last milestone, that last stretch fills once it's reached).
 * `indices` (into the items, lowest first) and `boxes` are in display order; the
 * bar fills from its low end, which is the bottom when the highest is on top.
 */
export function barGeometry(
  items: GoalItem[],
  indices: number[],
  boxes: RowBox[],
  order: GoalOrder,
  raised: number,
): BarGeometry | undefined {
  if (indices.length === 0 || boxes.length !== indices.length) return undefined
  const rows = indices.map((index, k) => ({ index, box: boxes[k] }))
  if (order === 'desc') rows.reverse() // now lowest first

  const centre = (b: RowBox) => (b.dotTop + b.dotBottom) / 2
  // Lowest first on screen puts lower amounts above: a row's low edge is its top
  const lowEdge = (b: RowBox) => (order === 'asc' ? b.top : b.bottom)
  const highEdge = (b: RowBox) => (order === 'asc' ? b.bottom : b.top)

  // (amount, position) points along the bar, lowest amount first
  const first = rows[0]
  const last = rows[rows.length - 1]
  const below = items[first.index - 1]?.value
  const above = items[last.index + 1]?.value
  const points = [
    {
      value: below === undefined ? 0 : (below + items[first.index].value) / 2,
      y: lowEdge(first.box),
    },
    ...rows.map((r) => ({ value: items[r.index].value, y: centre(r.box) })),
  ]
  points.push({
    value:
      above === undefined
        ? items[last.index].value
        : (items[last.index].value + above) / 2,
    y: highEdge(last.box),
  })

  let tip = points[0].y
  for (let k = 0; k + 1 < points.length; k++) {
    const a = points[k]
    const b = points[k + 1]
    if (raised < a.value) break
    tip = a.y + (b.y - a.y) * fillBetween(a.value, b.value, raised)
  }

  const start = points[0].y
  const end = points[points.length - 1].y
  const length = Math.abs(end - start)
  return {
    top: Math.min(start, end),
    height: length,
    fill: length === 0 ? 0 : Math.abs(tip - start) / length,
  }
}

export const pageCount = (count: number, show: ShowCount) =>
  show === 'all' ? 1 : Math.max(1, Math.ceil(count / show))

export function pageOf<T>(items: T[], show: ShowCount, page: number): T[] {
  if (show === 'all') return items
  return items.slice(page * show, page * show + show)
}

export function formatAmount(value: number, currency: string) {
  const whole = Number.isInteger(value)
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(value)
}
