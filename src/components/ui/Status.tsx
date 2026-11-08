import {
  children,
  type Component,
  type JSX,
  type ParentComponent,
  Show,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'
import {
  FaSolidCheck,
  FaSolidCircleExclamation,
  FaSolidTriangleExclamation,
} from 'solid-icons/fa'
import { cn } from './cn'

// Only the icon carries the tone; an info alert is a plain note without one
const alertTones = {
  info: { icon: null, iconColor: '' },
  success: { icon: FaSolidCheck, iconColor: 'text-success-text' },
  warning: {
    icon: FaSolidTriangleExclamation,
    iconColor: 'text-warning-700 dark:text-warning-300',
  },
  danger: { icon: FaSolidCircleExclamation, iconColor: 'text-danger-text' },
}

type AlertProps = {
  tone?: keyof typeof alertTones
  title?: string
  /** E.g. a retry button. */
  action?: JSX.Element
  /** Overrides the tone's role, e.g. a warning that is a passive status rather than an interruption. */
  role?: 'alert' | 'status'
  class?: string
}

export const Alert: ParentComponent<AlertProps> = (props) => {
  const tone = () => alertTones[props.tone ?? 'info']
  const action = children(() => props.action)
  return (
    <div
      role={
        props.role ??
        (props.tone === 'danger' || props.tone === 'warning'
          ? 'alert'
          : 'status')
      }
      class={cn(
        'rounded-group bg-surface-2 text-fg flex items-start gap-2 p-3 text-sm',
        props.class,
      )}
    >
      <Show when={tone().icon}>
        {(icon) => (
          <Dynamic
            component={icon()}
            class={cn('mt-0.5 size-4 shrink-0', tone().iconColor)}
            aria-hidden="true"
          />
        )}
      </Show>
      <div class="min-w-0 flex-1">
        <Show when={props.title}>
          <p class="font-semibold">{props.title}</p>
        </Show>
        <div>{props.children}</div>
      </div>
      <Show when={action()}>
        <div class="shrink-0">{action()}</div>
      </Show>
    </div>
  )
}

type EmptyStateProps = {
  icon?: JSX.Element
  title: string
  /** Renders the title as a heading, for empty states that stand in for a list's content. */
  level?: 3 | 4
  action?: JSX.Element
  class?: string
  children?: JSX.Element
}

export const EmptyState: Component<EmptyStateProps> = (props) => {
  const icon = children(() => props.icon)
  const action = children(() => props.action)
  const content = children(() => props.children)
  return (
    <div
      class={cn(
        'flex flex-col items-center gap-2 px-4 py-6 text-center',
        props.class,
      )}
    >
      <Show when={icon()}>
        <div class="text-fg-muted text-2xl">{icon()}</div>
      </Show>
      <Dynamic
        component={props.level ? `h${props.level}` : 'p'}
        class="font-semibold"
      >
        {props.title}
      </Dynamic>
      <Show when={content()}>
        <div class="text-fg-muted max-w-prose text-sm">{content()}</div>
      </Show>
      <Show when={action()}>
        <div class="mt-1">{action()}</div>
      </Show>
    </div>
  )
}

const spinnerSizes = { sm: 'size-4', md: 'size-6' }

type SpinnerProps = {
  size?: keyof typeof spinnerSizes
  /** Visible text next to the spinner; screen readers get "Loading" without it. */
  label?: string
  class?: string
}

export const Spinner: Component<SpinnerProps> = (props) => (
  <span
    role="status"
    class={cn('inline-flex items-center gap-2 text-sm', props.class)}
  >
    <svg
      class={cn('animate-spin', spinnerSizes[props.size ?? 'sm'])}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3"
        class="opacity-25"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
    <Show when={props.label} fallback={<span class="sr-only">Loading</span>}>
      <span>{props.label}</span>
    </Show>
  </span>
)

/** Placeholder block; size it with `class` (e.g. `h-4 w-32`). */
export const Skeleton: Component<{ class?: string }> = (props) => (
  <div
    class={cn('rounded-media bg-tint animate-pulse', props.class)}
    aria-hidden="true"
  />
)
