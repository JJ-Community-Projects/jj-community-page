import { type Component, type JSX, type ParentComponent, Show } from 'solid-js'
import { cn } from './cn'

const chipTones = {
  neutral: 'bg-neutral-100 text-fg ring-1 ring-line-strong',
  accent: 'bg-accent-50 text-accent-700 ring-1 ring-accent-200',
  primary: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200',
  /** On the red canvas */
  canvas: 'bg-white text-fg shadow-tile',
}

const chipSizes = {
  sm: 'gap-1 px-2 py-0.5 text-xxs',
  md: 'gap-1.5 px-2.5 py-1 text-xs',
}

type ChipProps = {
  tone?: keyof typeof chipTones
  size?: keyof typeof chipSizes
  /** A data colour (tag category, day, user colour), shown as a dot so the text stays readable. */
  color?: string
  icon?: JSX.Element
  class?: string
}

export const Chip: ParentComponent<ChipProps> = (props) => (
  <span
    class={cn(
      'inline-flex max-w-full items-center rounded-full font-semibold whitespace-nowrap',
      chipTones[props.tone ?? 'neutral'],
      chipSizes[props.size ?? 'md'],
      props.class,
    )}
  >
    <Show when={props.color}>
      <span
        class="size-2 shrink-0 rounded-full bg-(--chip-color) ring-1 ring-black/10"
        style={{ '--chip-color': props.color }}
      />
    </Show>
    {props.icon}
    <span class="truncate">{props.children}</span>
  </span>
)

/** The one LIVE indicator. */
export const LiveBadge: Component<{ class?: string; label?: string }> = (
  props,
) => (
  <span
    class={cn(
      'bg-primary text-xxs inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold tracking-wide text-white uppercase',
      props.class,
    )}
  >
    <span class="size-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
    {props.label ?? 'Live'}
  </span>
)

type DateDividerProps = {
  /** `canvas`: white pill on the red background; `tile`: inside a tile. */
  tone?: 'canvas' | 'tile'
  class?: string
  children: JSX.Element
}

/** Pill label plus a hairline: date groups and section labels in lists. */
export const DateDivider: Component<DateDividerProps> = (props) => {
  const onCanvas = () => props.tone !== 'tile'
  return (
    <div class={cn('flex items-center gap-2', props.class)}>
      <span
        class={cn(
          'text-xxs shrink-0 rounded-full px-2 py-0.5 font-bold',
          onCanvas()
            ? 'text-fg shadow-tile bg-white'
            : 'text-fg-muted ring-line bg-neutral-100 ring-1',
        )}
      >
        {props.children}
      </span>
      <span
        class={cn(
          'h-px flex-1 rounded-full',
          onCanvas() ? 'bg-white/70' : 'bg-black/10',
        )}
      />
    </div>
  )
}

/** "Raised" over an amount; the caller formats the amount (currency, locale). */
export const Raised: ParentComponent<{
  label?: string
  size?: 'sm' | 'md'
  class?: string
}> = (props) => (
  <div
    class={cn(
      'text-raised flex flex-col items-end leading-tight font-bold',
      props.class,
    )}
  >
    <span class="text-xxs">{props.label ?? 'Raised'}</span>
    <span class={props.size === 'md' ? 'text-base' : 'text-sm'}>
      {props.children}
    </span>
  </div>
)
