import { extendTailwindMerge } from 'tailwind-merge'

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

/**
 * A data colour (Yogs stream, user colour) as a large fill. The colours are picked for the light
 * canvas, so dark mode mixes in black (`--data-dim` in global.css); small swatches keep the raw colour.
 */
export const dataFill = (color: string) =>
  `color-mix(in srgb, ${color}, black var(--data-dim))`
