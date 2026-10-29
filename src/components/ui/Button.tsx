import { type JSX, type ParentComponent, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { cn, focusRing } from './cn'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-600',
  accent: 'bg-accent text-white hover:bg-accent-600',
  secondary:
    'bg-surface-strong text-fg ring-1 ring-line-strong hover:bg-surface',
  ghost: 'text-fg hover:bg-black/5',
  danger: 'bg-danger-600 text-white hover:bg-danger-700',
  /** White button for use directly on the red canvas. */
  canvas: 'bg-white text-fg shadow-tile hover:bg-surface',
}

// Literal class names, so Tailwind finds them
const brands = {
  twitch: 'bg-twitch text-white hover:bg-twitch-600',
  youtube: 'bg-youtube text-white hover:bg-youtube-600',
  tiltify: 'bg-tiltify text-white hover:bg-tiltify-600',
  discord: 'bg-discord text-white hover:bg-discord-600',
  bluesky: 'bg-bluesky text-white hover:bg-bluesky-600',
  // A shade darker than the brand colour, so white text stays readable
  tiktok: 'bg-tiktok-700 text-white hover:bg-tiktok-800',
  instagram: 'bg-instagram-600 text-white hover:bg-instagram-700',
  twitter: 'bg-twitter-600 text-white hover:bg-twitter-700',
}

const sizes = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
}

const iconSizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
}

type ButtonProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'class'
> & {
  variant?: keyof typeof variants
  /** A brand colour instead of `variant`. */
  brand?: keyof typeof brands
  size?: keyof typeof sizes
  /** Renders a link that looks like a button. */
  href?: string
  target?: string
  rel?: string
  class?: string
}

const base =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'

const render = (props: ButtonProps, shape: string) => {
  const [local, rest] = splitProps(props, [
    'variant',
    'brand',
    'size',
    'class',
    'type',
  ])
  return (
    <Dynamic
      component={rest.href ? 'a' : 'button'}
      type={rest.href ? undefined : (local.type ?? 'button')}
      {...rest}
      class={cn(
        base,
        focusRing,
        local.brand
          ? brands[local.brand]
          : variants[local.variant ?? 'secondary'],
        shape,
        local.class,
      )}
    />
  )
}

export const Button: ParentComponent<ButtonProps> = (props) =>
  render(props, sizes[props.size ?? 'md'])

/** Icon-only button; needs an `aria-label`. */
export const IconButton: ParentComponent<
  ButtonProps & { 'aria-label': string }
> = (props) => render(props, iconSizes[props.size ?? 'md'])
