import { type Component, JSX, Show } from 'solid-js'

export type TickerHeaderProps = {
  theme?: 'default' | 'red' | 'blue'
  logoUrl?: string
  title?: string
  subtitle?: string
  children?: JSX.Element
}

const bgByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
    case 'blue':
      return 'bg-white'
    default:
      return 'bg-primary'
  }
}

const titleColorByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
    case 'blue':
      return 'text-accent'
    default:
      return 'text-white'
  }
}

const subtitleColorByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
    case 'blue':
      return 'text-primary'
    default:
      return 'text-white'
  }
}

// Generic header card for ticker marquees.
// Can represent a cause header, a JJ title card, or any interleaved header block.
// Usage examples:
//  - As a replacement for a JJTitleCard-style block:
//      <TickerHeader theme={theme} logoUrl={titleLogo} title="Jingle Jam" subtitle="Charities" />
//  - As a cause header (with logo):
//      <TickerHeader theme={theme} logoUrl={cause.logoUrl} title={cause.name} />
export const TickerHeader: Component<TickerHeaderProps> = (p) => {
  return (
    <div class={`h-full w-full rounded-2xl ${bgByTheme(p.theme)} p-2 shadow-2xl`}>
      <div class={'flex h-full w-full flex-row items-center justify-start'}>
        <Show when={p.logoUrl}>
          {(url) => (
            <img class={'h-12 w-12 rounded-lg'} alt={''} src={url()} loading={'eager'} />
          )}
        </Show>
        <div class={'flex h-full flex-1 flex-col items-start justify-center overflow-hidden truncate pl-2'}>
          <Show when={p.title}>
            {(t) => <p class={`${titleColorByTheme(p.theme)} font-bold`}>{t()}</p>}
          </Show>
          <Show when={p.subtitle}>
            {(s) => <p class={`${subtitleColorByTheme(p.theme)} font-bold`}>{s()}</p>}
          </Show>
          {/* Custom content slot if needed */}
          {p.children}
        </div>
      </div>
    </div>
  )
}

export default TickerHeader
