function _linearizeColorComponent(component: number) {
  if (component <= 0.03928) return component / 12.92
  return Math.pow((component + 0.055) / 1.055, 2.4)
}

function computeLuminance(color: string): number {
  const red = parseInt(color.slice(1, 3), 16)
  const green = parseInt(color.slice(3, 5), 16)
  const blue = parseInt(color.slice(5, 7), 16)
  const R = _linearizeColorComponent(red / 0xff)
  const G = _linearizeColorComponent(green / 0xff)
  const B = _linearizeColorComponent(blue / 0xff)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

enum Brightness {
  light,
  dark,
}

export function estimateBrightnessForColor(color: string) {
  const relativeLuminance = computeLuminance(color)
  const kThreshold = 0.15
  if ((relativeLuminance + 0.05) * (relativeLuminance + 0.05) > kThreshold) {
    return Brightness.light
  }
  return Brightness.dark
}

export function getTextColor(bgColor: string) {
  if (isColorLight(bgColor)) {
    return '#000000'
  }
  return '#ffffff'
}

/**
 * Black or white text on `bgColor`: white when it reaches the WCAG AA ratio (4.5 : 1), otherwise
 * whichever has the higher ratio. On mid-tone colours the WCAG 2 ratio overrates black; perceptual
 * contrast (APCA) reads white as clearly stronger there.
 */
export function getContrastTextColor(bgColor: string) {
  const luminance = computeLuminance(bgColor)
  const onBlack = (luminance + 0.05) / 0.05
  const onWhite = 1.05 / (luminance + 0.05)
  return onWhite >= 4.5 || onWhite > onBlack ? '#ffffff' : '#000000'
}

/** `color` (#rrggbb) with a share of black mixed in, as `color-mix(in srgb, color, black amount)`. */
export function mixWithBlack(color: string, amount: number) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color
  const channel = (i: number) =>
    Math.round(parseInt(color.slice(i, i + 2), 16) * (1 - amount))
      .toString(16)
      .padStart(2, '0')
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

export function isColorLight(bgColor: string) {
  return estimateBrightnessForColor(bgColor) == Brightness.light
}

export function getTailwindTextColor(bgColor: string) {
  if (estimateBrightnessForColor(bgColor) == Brightness.light) {
    return 'text-black'
  }
  return 'text-white'
}
