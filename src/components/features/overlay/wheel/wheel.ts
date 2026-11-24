// The wheel overlay: items and theme come from the URL (`item` repeated, `theme`), the overlay's
// own link (`user` + `key`) lets the dashboard's Spin reach it. Pure helpers, shared by the
// overlay page, the overlay and its configurator.

export const WHEEL_ITEM_PARAM = 'item'
export const WHEEL_MAX_ITEMS = 24
export const WHEEL_MAX_TEXT = 40
export const WHEEL_MIN_ITEMS = 2

/** Spin length on the overlay; the server ignores a new spin for 8 s (`SPIN_COOLDOWN_MS`). */
export const SPIN_MS = 7000
export const BANNER_MS = 5000
const EXTRA_TURNS = 6

export type WheelTheme = 'red' | 'blue' | 'wheelboy'

/** CSS colours (hex or theme tokens), so the SVG sets them as styles, not attributes. */
type Swatch = { fill: string; text: string }

export type WheelPalette = {
  label: string
  swatches: Swatch[]
  pointer: string
}

const WHITE = '#ffffff'
const NAVY = '#1e2b5c'

export const WHEEL_THEME_ORDER: WheelTheme[] = ['red', 'blue', 'wheelboy']

export const WHEEL_THEMES: Record<WheelTheme, WheelPalette> = {
  red: {
    label: 'Jingle Jam red',
    swatches: [
      { fill: 'var(--color-primary)', text: WHITE },
      { fill: '#f6759d', text: '#440418' },
      { fill: '#ae0b3d', text: WHITE },
      { fill: '#f44e82', text: WHITE },
    ],
    pointer: WHITE,
  },
  blue: {
    label: 'Jingle Jam blue',
    swatches: [
      { fill: 'var(--color-accent-500)', text: WHITE },
      { fill: '#8fbde0', text: '#10293b' },
      { fill: '#296693', text: WHITE },
      { fill: '#6faad7', text: '#10293b' },
    ],
    pointer: WHITE,
  },
  // Sampled from the reference wheel: yellow, red, purple, blue, red, green, indigo
  wheelboy: {
    label: 'Wheelboy',
    swatches: [
      { fill: '#f2dc4b', text: NAVY },
      { fill: '#e5482f', text: NAVY },
      { fill: '#a45cc6', text: NAVY },
      { fill: '#4ba3e3', text: NAVY },
      { fill: '#e5482f', text: NAVY },
      { fill: '#4fb548', text: NAVY },
      { fill: '#5b3fa6', text: '#f5f0e6' },
    ],
    pointer: '#e5482f',
  },
}

export function parseWheelTheme(raw: string | null | undefined): WheelTheme {
  return raw && raw in WHEEL_THEMES ? (raw as WheelTheme) : 'red'
}

export function parseWheelItems(raw: string[]): string[] {
  return raw
    .map((item) => item.trim().slice(0, WHEEL_MAX_TEXT))
    .filter((item) => item !== '')
    .slice(0, WHEEL_MAX_ITEMS)
}

export function parseWheelUser(raw: string | null | undefined): number | undefined {
  if (!raw || !/^\d{1,12}$/.test(raw)) return undefined
  const id = Number(raw)
  return id > 0 ? id : undefined
}

export function parseWheelKey(raw: string | null | undefined): string | undefined {
  return raw && /^[A-Za-z0-9_-]{1,64}$/.test(raw) ? raw : undefined
}

/**
 * Segment `index`'s swatch. Cycles the palette, except that the last segment never repeats the
 * first one's colour (they touch at the top seam).
 */
export function swatchIndex(index: number, count: number, paletteSize: number) {
  const last = index === count - 1
  if (last && count > 1 && index % paletteSize === 0) return 1 % paletteSize
  return index % paletteSize
}

export function winnerIndex(r: number, count: number) {
  return Math.min(count - 1, Math.max(0, Math.floor(r * count)))
}

/**
 * The wheel's next rotation (degrees, clockwise) so that the pointer at the top ends inside the
 * winner, away from its edges, after `EXTRA_TURNS` full turns from `current`.
 */
export function targetRotation(current: number, r: number, count: number) {
  const segment = 360 / count
  const scaled = r * count
  const winner = winnerIndex(r, count)
  // Where in the segment the pointer stops: 15–85 %, from the same random value
  const within = 0.15 + 0.7 * (scaled - Math.floor(scaled))
  const angle = (winner + within) * segment
  // The pointer sits at 0°, so the wheel must stand at -angle (mod 360)
  const delta = (((-angle - current) % 360) + 360) % 360
  return current + EXTRA_TURNS * 360 + delta
}
