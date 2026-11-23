import type { BgPreset } from '../donationMatches/presets.ts'

/** The box behind one list item: lighter on white, darker on transparent so it reads over the stream. */
export function itemBackgroundClass(theme: BgPreset) {
  const tint =
    theme === 'white'
      ? 'bg-black/10'
      : theme === 'transparent'
        ? 'bg-black/50'
        : 'bg-black/20'
  return `${tint} rounded-2xl px-3 py-2 shadow-sm`
}
