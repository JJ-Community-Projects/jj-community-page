import { children, type Component, type JSX, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { FaSolidChevronRight } from 'solid-icons/fa'
import { cn, focusRing, groupSurface, tileHover, tileSurface } from './cn'

const density = {
  compact: { row: 'gap-2 p-2', title: 'text-sm', subline: 'text-xs' },
  regular: {
    row: 'gap-3 p-2.5 sm:p-3',
    title: 'text-base',
    subline: 'text-sm',
  },
}

const surfaces = {
  /** A card of its own, on the canvas */
  tile: tileSurface,
  /** A row inside a tile */
  group: groupSurface,
  none: '',
}

type ListRowProps = {
  title: JSX.Element
  /** One line; more info belongs here or in a details view, never in a second row. */
  subline?: JSX.Element
  /** Avatar or logo, e.g. `<Avatar size="sm" />`. */
  media?: JSX.Element
  /** Right column, e.g. `<Raised>`. */
  trailing?: JSX.Element
  /** Makes the whole row a link, with a chevron. */
  href?: string
  target?: string
  rel?: string
  'aria-label'?: string
  density?: keyof typeof density
  surface?: keyof typeof surfaces
  class?: string
}

/** One fixed-height row: media · title + subline · trailing value · chevron. */
export const ListRow: Component<ListRowProps> = (props) => {
  const d = () => density[props.density ?? 'compact']
  // Element props resolve once (see Section): no double creation, no hydration mismatch.
  const media = children(() => props.media)
  const subline = children(() => props.subline)
  const trailing = children(() => props.trailing)
  return (
    <Dynamic
      component={props.href ? 'a' : 'div'}
      href={props.href}
      target={props.target}
      rel={props.rel}
      aria-label={props['aria-label']}
      class={cn(
        'flex w-full min-w-0 items-center',
        d().row,
        surfaces[props.surface ?? 'tile'],
        props.href && [tileHover, focusRing],
        props.class,
      )}
    >
      <Show when={media()}>
        <div class="shrink-0">{media()}</div>
      </Show>
      <div class="min-w-0 flex-1">
        <p class={cn('truncate font-semibold', d().title)}>{props.title}</p>
        <Show when={subline()}>
          <p class={cn('text-fg-muted truncate', d().subline)}>{subline()}</p>
        </Show>
      </div>
      <Show when={trailing()}>
        <div class="shrink-0 self-start">{trailing()}</div>
      </Show>
      <Show when={props.href}>
        <FaSolidChevronRight
          class="text-fg-muted size-3 shrink-0"
          aria-hidden="true"
        />
      </Show>
    </Dynamic>
  )
}
