import { formatAmount, type GoalItem, type ShowCount } from './goalItems.ts'

// Rough browser source size for the milestones / incentives panels. Deliberately simple:
// a fixed width, and a height from how many lines the longest visible items wrap to.
// The px figures follow the overlay's classes (text-lg rows, text-3xl title, p-4).

export const ESTIMATE_WIDTH = 400
const PAGE_PADDING = 32
const TITLE = 36 + 12
const LINE = 28
const CHAR = 9
const AMOUNT_CHAR = 10
const PAGE_DOTS = 8 + 12

export type SizeOptions = {
  items: GoalItem[]
  show: ShowCount
  currency: string
  title: boolean
  itemBg: boolean
  bar?: boolean
  pageDots?: boolean
}

export function estimateSize(o: SizeOptions): {
  width: number
  height: number
} {
  const shown =
    o.show === 'all' ? o.items.length : Math.min(o.show, o.items.length)
  const textWidth =
    ESTIMATE_WIDTH - PAGE_PADDING - (o.bar ? 28 : 0) - (o.itemBg ? 24 : 0)
  // Padding plus the gap between rows; a plain list without the bar has a small gap
  const rowExtra = o.itemBg ? 24 : o.bar ? 12 : 16

  // Height of each item's row; the tallest `shown` of them may be on screen together
  const rows = o.items
    .map((item) => {
      const amountWidth =
        formatAmount(item.value, o.currency).length * AMOUNT_CHAR + 8
      const perLine = Math.max(40, textWidth - amountWidth)
      const lines = Math.max(1, Math.ceil((item.text.length * CHAR) / perLine))
      return lines * LINE + rowExtra
    })
    .sort((a, b) => b - a)
    .slice(0, shown)

  const height =
    PAGE_PADDING +
    (o.title ? TITLE : 0) +
    (rows.length ? rows.reduce((sum, h) => sum + h, 0) : LINE) +
    (o.pageDots ? PAGE_DOTS : 0)
  return { width: ESTIMATE_WIDTH, height: Math.ceil(height / 10) * 10 }
}
