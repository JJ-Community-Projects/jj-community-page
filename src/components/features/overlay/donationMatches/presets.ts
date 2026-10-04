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
  red: { label: 'Red', background: '#E30E50', text: 'text-white' },
  blue: { label: 'Blue', background: '#3584BF', text: 'text-white' },
  black: { label: 'Black', background: '#313131', text: 'text-white' },
  white: { label: 'White', background: '#FFFFFF', text: 'text-black' },
  transparent: {
    label: 'Transparent',
    background: 'transparent',
    text: 'text-white',
  },
}