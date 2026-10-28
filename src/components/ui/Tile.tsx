import {
  children,
  type Component,
  type JSX,
  type ParentComponent,
  Show,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { cn, focusRing, groupSurface, tileHover, tileSurface } from './cn'

const padding = {
  none: '',
  sm: 'p-2',
  md: 'p-3 sm:p-4',
}

type TileProps = {
  /** Makes the whole tile a link, with the clickable hover. */
  href?: string
  target?: string
  rel?: string
  pad?: keyof typeof padding
  class?: string
  children?: JSX.Element
}

export const Tile: ParentComponent<TileProps> = (props) => {
  const [local, link] = splitProps(props, ['pad', 'class', 'children', 'href'])
  return (
    <Dynamic
      component={local.href ? 'a' : 'div'}
      href={local.href}
      {...link}
      class={cn(
        tileSurface,
        'block',
        padding[local.pad ?? 'md'],
        local.href && [tileHover, focusRing],
        local.class,
      )}
    >
      {local.children}
    </Dynamic>
  )
}

/** A group inside a tile (white, ring, no shadow). */
export const TileGroup: ParentComponent<{
  pad?: keyof typeof padding
  class?: string
}> = (props) => (
  <div class={cn(groupSurface, padding[props.pad ?? 'sm'], props.class)}>
    {props.children}
  </div>
)

type SectionProps = {
  title: string
  icon?: JSX.Element
  /** Right side of the title row, e.g. a small button or link. */
  action?: JSX.Element
  /** Heading level of the title; 2 below a page's h1. */
  level?: 2 | 3
  pad?: keyof typeof padding
  class?: string
  children?: JSX.Element
}

/** A tile with a title row: icon, heading and an optional action. */
export const Section: Component<SectionProps> = (props) => {
  // Element props resolve once: reading `props.icon` in `when` and again as a child would create
  // the element twice and break hydration of server-rendered islands.
  const icon = children(() => props.icon)
  const action = children(() => props.action)
  return (
    <Tile pad={props.pad} class={props.class}>
      <div class="mb-3 flex min-h-8 items-center gap-2">
        <Show when={icon()}>
          <span class="text-fg-muted flex size-5 shrink-0 items-center justify-center">
            {icon()}
          </span>
        </Show>
        <Dynamic
          component={props.level === 3 ? 'h3' : 'h2'}
          class="min-w-0 flex-1 text-base font-semibold text-balance"
        >
          {props.title}
        </Dynamic>
        <Show when={action()}>
          <div class="shrink-0">{action()}</div>
        </Show>
      </div>
      {props.children}
    </Tile>
  )
}
