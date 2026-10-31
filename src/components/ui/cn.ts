import { extendTailwindMerge } from 'tailwind-merge'
import {
  getContrastTextColor,
  getTextColor,
  mixWithBlack,
} from '../../lib/utils/textColors'

/**
 * twMerge that knows the theme's custom sizes from global.css. Plain twMerge reads `text-xxs` as a
 * colour and drops it next to `text-white`, and doesn't know `rounded-tile` / `shadow-tile`.
 */
export const cn = extendTailwindMerge({
  extend: {
    theme: {
      text: ['xxs', 'xxxs'],
      radius: ['tile', 'group', 'media'],
      shadow: ['tile', 'tile-hover'],
    },
  },
})

/** The neutral tile: the one content surface on the red canvas. */
export const tileSurface =
  'rounded-tile bg-linear-to-b from-surface to-surface-2 text-fg shadow-tile ring-1 ring-line'

/** A group inside a tile: no shadow, so tiles never stack shadows. */
export const groupSurface =
  'rounded-group bg-surface-strong text-fg ring-1 ring-line'

/** Hover for clickable tiles and rows only. */
export const tileHover =
  'transition-all duration-200 hover:scale-101 hover:shadow-tile-hover hover:brightness-105 active:brightness-[0.98]'

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

// Share of black mixed into data colours in dark mode, so large fills don't glare on the dark canvas.
// At 33 % white text reaches 4.5 : 1 on every Yogs stream colour (2020–2025).
const DATA_DIM = 0.33

/**
 * A data colour (Yogs stream, user colour) as a large fill: sets the CSS variables for one of the
 * classes below, on the element or a parent. Light mode shows the colour with its usual text colour;
 * dark mode a dimmed colour with whichever of black and white contrasts more with it. Small swatches
 * keep the raw colour.
 */
export const dataColors = (color: string) => {
  const dim = mixWithBlack(color, DATA_DIM)
  return {
    '--data': color,
    '--data-fg': getTextColor(color),
    '--data-dim': dim,
    '--data-fg-dim': getContrastTextColor(dim),
  }
}

/** Fill in the data colour with its text colour (see dataColors). */
export const dataFill =
  'bg-(--data) text-(--data-fg) dark:bg-(--data-dim) dark:text-(--data-fg-dim)'

/** Inverted: a label in the text colour inside a data fill (LIVE). */
export const dataFillInverted =
  'bg-(--data-fg) text-(--data) dark:bg-(--data-fg-dim) dark:text-(--data-dim)'

/** Border in the data colour (see dataColors). */
export const dataBorder = 'border-(--data) dark:border-(--data-dim)'
