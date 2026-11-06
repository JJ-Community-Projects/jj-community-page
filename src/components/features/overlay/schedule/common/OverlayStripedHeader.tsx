import { type Component } from 'solid-js'
import { DateTime } from 'luxon'
import { useNow } from '../../../../../lib/utils/useNow.ts'
import { cn, tileSurface } from '../../../../ui/cn'

interface Props {
  title: string
  timezone: string
  theme?: 'default' | 'red' | 'blue'
}

const stripeByTheme = (theme: Props['theme']) =>
  theme === 'blue' ? 'bg-accent' : 'bg-primary'

/**
 * The striped schedule header, built like an OverlayStreamCard so the stripe lines up with the
 * slots' time blocks: the stripe holds the timezone and the current time, the title sits
 * where a stream title would.
 */
export const OverlayStripedHeader: Component<Props> = (props) => {
  const now = useNow()
  // December's name ("CET", not "CEST"): the schedule is for the Jingle Jam
  const zoneName = () =>
    DateTime.fromObject(
      { year: new Date().getFullYear(), month: 12, day: 1 },
      { locale: 'en-GB' },
    ).setZone(props.timezone).offsetNameShort
  const local = () => now().setZone(props.timezone)

  return (
    <div class={cn(tileSurface, 'flex min-h-14 w-full overflow-hidden')}>
      <span
        class={cn(
          'flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 px-0.5 py-2 leading-tight text-white tabular-nums',
          stripeByTheme(props.theme),
        )}
      >
        <span class="text-xxs whitespace-nowrap uppercase opacity-80">
          {zoneName()}
        </span>
        <span class="text-xs font-bold">{local().toFormat('HH:mm')}</span>
      </span>
      <span class="flex min-w-0 flex-1 items-center px-3 py-2">
        <h1 class="line-clamp-2 text-lg leading-tight font-extrabold">
          {props.title}
        </h1>
      </span>
    </div>
  )
}
