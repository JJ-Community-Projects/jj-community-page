import {
  children,
  type Component,
  type JSX,
  type ParentComponent,
  Show,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'
import {
  FaSolidCircleCheck,
  FaSolidCircleExclamation,
  FaSolidCircleInfo,
  FaSolidTriangleExclamation,
} from 'solid-icons/fa'
import { cn } from './cn'

const alertTones = {
  info: {
    box: 'bg-accent-50 text-accent-800 ring-accent-200',
    icon: FaSolidCircleInfo,
  },
  success: {
    box: 'bg-success-50 text-success-800 ring-success-200',
    icon: FaSolidCircleCheck,
  },
  warning: {
    box: 'bg-warning-50 text-warning-900 ring-warning-200',
    icon: FaSolidTriangleExclamation,
  },
  danger: {
    box: 'bg-danger-50 text-danger-800 ring-danger-200',
    icon: FaSolidCircleExclamation,
  },
}

type AlertProps = {
  tone?: keyof typeof alertTones
  title?: string
  /** E.g. a retry button. */
  action?: JSX.Element
  class?: string
}

export const Alert: ParentComponent<AlertProps> = (props) => {
  const tone = () => alertTones[props.tone ?? 'info']
  const action = children(() => props.action)
  return (
    <div
      role={
        props.tone === 'danger' || props.tone === 'warning' ? 'alert' : 'status'
      }
      class={cn(
        'rounded-group flex items-start gap-2 p-3 text-sm ring-1',
        tone().box,
        props.class,
      )}
    >
      <Dynamic
        component={tone().icon}
        class="mt-0.5 size-4 shrink-0"
        aria-hidden="true"
      />
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
      <p class="font-semibold">{props.title}</p>
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
    class={cn('rounded-media animate-pulse bg-black/5', props.class)}
    aria-hidden="true"
  />
)
