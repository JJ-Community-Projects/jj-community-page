import { type Component, createSignal, Show } from 'solid-js'
import { cn } from './cn'

const sizes = {
  xs: 'size-6 text-xxs',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-24 text-3xl',
}

type AvatarProps = {
  src?: string | null
  alt: string
  size?: keyof typeof sizes
  /** Images and logos are rounded squares; `circle` is for people where a page already uses circles. */
  shape?: 'rounded' | 'circle'
  /** Ring colour, e.g. a user's accent colour; white when unset. */
  ringColor?: string
  /** Shown without an image: usually the first letter of the name. */
  fallback?: string
  class?: string
}

export const Avatar: Component<AvatarProps> = (props) => {
  const size = () => props.size ?? 'sm'
  // An image that fails to load shows the fallback instead of its alt text
  const [failedSrc, setFailedSrc] = createSignal<string>()
  const big = () => size() === 'lg' || size() === 'xl'
  return (
    <span
      class={cn(
        'text-fg-muted inline-flex shrink-0 items-center justify-center overflow-hidden bg-neutral-200 dark:bg-neutral-700 font-semibold',
        sizes[size()],
        props.shape === 'circle'
          ? 'rounded-full'
          : big()
            ? 'rounded-group'
            : 'rounded-media',
        big() ? 'ring-4' : 'ring-1',
        !props.ringColor && 'ring-white',
        props.class,
      )}
      style={
        props.ringColor ? { '--tw-ring-color': props.ringColor } : undefined
      }
    >
      <Show
        when={props.src !== failedSrc() && props.src}
        fallback={
          <span aria-label={props.alt}>
            {props.fallback ?? props.alt.charAt(0)}
          </span>
        }
      >
        {(src) => (
          <img
            src={src()}
            alt={props.alt}
            loading="lazy"
            onError={() => setFailedSrc(src())}
            class="size-full object-cover"
          />
        )}
      </Show>
    </span>
  )
}
