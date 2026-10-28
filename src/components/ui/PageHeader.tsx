import { children, type Component, type JSX, Show } from 'solid-js'
import { FaSolidArrowLeft } from 'solid-icons/fa'
import { cn, focusRing } from './cn'

type PageHeaderProps = {
  title: string
  subtitle?: JSX.Element
  back?: { href: string; label: string }
  /** Buttons next to the title (end of the row, below the title on mobile). */
  actions?: JSX.Element
  /** Below the subtitle, e.g. a countdown. */
  children?: JSX.Element
  align?: 'start' | 'center'
  class?: string
}

/** The page title on the red canvas: the only large text outside a tile. */
export const PageHeader: Component<PageHeaderProps> = (props) => {
  const centered = () => props.align !== 'start'
  const subtitle = children(() => props.subtitle)
  const actions = children(() => props.actions)
  return (
    <header
      class={cn(
        'text-on-canvas flex w-full flex-col gap-1',
        centered() && 'items-center text-center',
        props.class,
      )}
    >
      <Show when={props.back}>
        {(back) => (
          <a
            href={back().href}
            class={cn(
              'text-on-canvas-muted hover:text-on-canvas inline-flex items-center gap-1.5 rounded-full text-sm',
              focusRing,
            )}
          >
            <FaSolidArrowLeft class="size-3" aria-hidden="true" />
            {back().label}
          </a>
        )}
      </Show>
      <div
        class={cn(
          'flex w-full flex-col gap-2 sm:flex-row sm:items-center',
          centered() && 'items-center sm:justify-center',
        )}
      >
        <h1 class="min-w-0 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {props.title}
        </h1>
        <Show when={actions()}>
          <div
            class={cn(
              'flex shrink-0 flex-wrap gap-2',
              !centered() && 'sm:ml-auto',
            )}
          >
            {actions()}
          </div>
        </Show>
      </div>
      <Show when={subtitle()}>
        <p class="text-on-canvas-muted max-w-prose text-sm sm:text-base">
          {subtitle()}
        </p>
      </Show>
      {props.children}
    </header>
  )
}
