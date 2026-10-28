import { children, type Component, For, type JSX, Show } from 'solid-js'
import type { Duration } from 'luxon'
import {
  useIsJJ,
  useJJStartCountdown,
  useNextJJStartDate,
} from '../../lib/utils/jjDates'
import { cn } from './cn'

const units = ['days', 'hours', 'minutes', 'seconds'] as const

type CountdownProps = {
  /** Time left; negative durations show as zero. */
  duration: Duration
  label?: JSX.Element
  size?: 'sm' | 'md'
  class?: string
}

/** Days · hours · minutes · seconds in boxes, for use inside a tile. */
export const Countdown: Component<CountdownProps> = (props) => {
  const parts = () => {
    const left = props.duration.shiftTo(...units)
    return units.map((unit) => ({
      unit,
      value: String(Math.max(0, Math.floor(left.get(unit)))).padStart(2, '0'),
    }))
  }
  const md = () => props.size !== 'sm'
  const label = children(() => props.label)
  return (
    <div class={cn('flex flex-col items-center gap-2', props.class)}>
      <Show when={label()}>
        <p class="text-fg-muted text-sm font-semibold">{label()}</p>
      </Show>
      <div role="timer" class="flex gap-1.5 sm:gap-2">
        <For each={parts()}>
          {(part) => (
            <div
              class={cn(
                'rounded-group bg-surface-strong ring-line flex flex-col items-center ring-1',
                md()
                  ? 'min-w-14 px-2 py-1.5 sm:min-w-16'
                  : 'min-w-11 px-1.5 py-1',
              )}
            >
              <span
                class={cn(
                  'font-bold tabular-nums',
                  md() ? 'text-2xl sm:text-3xl' : 'text-lg',
                )}
              >
                {part.value}
              </span>
              <span class="text-fg-muted text-xxs font-medium tracking-wide uppercase">
                {part.unit}
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}

/** "Jingle Jam YYYY starts in" countdown; renders nothing while the event runs. */
export const JJStartCountdown: Component<{ size?: 'sm' | 'md' }> = (props) => {
  const nextJJStartDate = useNextJJStartDate()
  const jjStartCountdown = useJJStartCountdown()
  const isJJ = useIsJJ()
  return (
    <Show when={!isJJ()}>
      <Countdown
        size={props.size}
        label={`Jingle Jam ${nextJJStartDate().year} starts in`}
        duration={jjStartCountdown()}
      />
    </Show>
  )
}

/** The next start in the viewer's time zone, plus UK time when that differs. */
export const JJStartTimes: Component<{ class?: string }> = (props) => {
  const nextJJStartDate = useNextJJStartDate()
  const isLocalTimeZoneUK = () =>
    nextJJStartDate().toLocal().zoneName === nextJJStartDate().zoneName
  const zones = () => [
    { label: 'Your local time', date: nextJJStartDate().toLocal() },
    ...(isLocalTimeZoneUK()
      ? []
      : [{ label: 'UK time', date: nextJJStartDate() }]),
  ]
  return (
    <div
      class={cn(
        'grid w-full gap-2 sm:auto-cols-fr sm:grid-flow-col',
        props.class,
      )}
    >
      <For each={zones()}>
        {(zone) => (
          // One line per zone on mobile (label · date, time), stacked from sm up
          <div class="rounded-group bg-surface-strong ring-line flex items-baseline justify-between gap-2 px-3 py-1.5 ring-1 sm:block sm:py-2 sm:text-center">
            <p class="text-fg-muted shrink-0 text-xs">{zone.label}</p>
            <p class="text-right text-sm font-semibold sm:text-center sm:text-base">
              <span class="sm:hidden">
                {zone.date.toFormat('EEE d MMM, t')}
              </span>
              <span class="hidden sm:inline">{zone.date.toFormat('DDDD')}</span>
            </p>
            <p class="text-fg-muted hidden text-sm tabular-nums sm:block">
              {zone.date.toFormat('ttt')}
            </p>
          </div>
        )}
      </For>
    </div>
  )
}
