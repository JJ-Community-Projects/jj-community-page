export type BgPreset = 'red' | 'blue' | 'black' | 'white' | 'transparent'

export const BG_PRESET_ORDER: BgPreset[] = [
  'red',
  'blue',
  'black',
  'white',
  'transparent',
]

export const BG_PRESETS: Record<
  BgPreset,
  { label: string; background: string; text: string }
> = {
  red: { label: 'Red', background: 'var(--color-primary)', text: 'text-white' },
  blue: { label: 'Blue', background: 'var(--color-accent)', text: 'text-white' },
  black: { label: 'Black', background: 'var(--color-ink)', text: 'text-white' },
  white: { label: 'White', background: 'white', text: 'text-black' },
  transparent: {
    label: 'Transparent',
    background: 'transparent',
    text: 'text-white',
  },
}