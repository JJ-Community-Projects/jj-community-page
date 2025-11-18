import { type Component, Show } from 'solid-js'

export type CharityItem = {
  id: string
  name: string
  description?: string
  logoUrl?: string
  websiteUrl?: string
  raised?: number
  raisedFormatted?: string
  currency?: string
}

export type CharityTickerChildProps = {
  item: CharityItem
  theme?: 'default' | 'red' | 'blue'
  showRaised?: boolean
}

const bgByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
      return 'bg-primary'
    case 'blue':
      return 'bg-accent'
    default:
      return 'bg-white'
  }
}

const nameColorByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
    case 'blue':
      return 'text-white'
    default:
      return 'text-accent'
  }
}

const raisedColorByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
    case 'blue':
      return 'text-white'
    default:
      return 'text-primary'
  }
}

function formatGBP(n: number) {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `£${String(n)}`
  }
}

// Reusable ticker child for charity items
// Usage example in overlays:
//   <CharityTickerChild item={d} theme={props.theme} showRaised={props.showRaised} />
export const CharityTickerChild: Component<CharityTickerChildProps> = (p) => {
  const value = () => p.item.raised ?? 0
  return (
    <div class={`h-full w-full rounded-2xl ${bgByTheme(p.theme)} p-2 shadow-2xl`}>
      <div class={'flex h-full w-full flex-row items-center justify-start'}>
        <Show when={p.item.logoUrl}>
          {(url) => (
            <img class={'h-12 w-12 rounded-lg'} alt={''} src={url()} loading={'eager'} />
          )}
        </Show>
        <div class={'flex h-full flex-1 flex-col items-start justify-center overflow-hidden truncate pl-2'}>
          <p class={`${nameColorByTheme(p.theme)} font-bold`}>{p.item.name}</p>
          <Show when={p.showRaised}>
            <p class={`${raisedColorByTheme(p.theme)} font-bold`}>
              Raised {p.item.raisedFormatted}
            </p>
          </Show>
        </div>
      </div>
    </div>
  )
}

export default CharityTickerChild
