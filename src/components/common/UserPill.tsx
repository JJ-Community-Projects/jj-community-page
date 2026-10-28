import type { Component } from 'solid-js'
import type { UserDisplay } from '../../lib/orpc/public/schemas/UserDisplaySchema.ts'
import { Avatar } from '../ui/Avatar'
import { cn, focusRing } from '../ui/cn'

/**
 * A user as a small pill (avatar ringed in their accent colour + name) that links to their profile.
 * Friends, related users, team members and stream participants all use it, in a flex-wrap row.
 */
export const UserPill: Component<{
  user: UserDisplay
  /** Defaults to the user's profile; '' renders a plain pill without a link. */
  href?: string
  class?: string
}> = (props) => {
  const href = () => props.href ?? `/${props.user.tiltifySlug}`
  return (
    <a
      href={href() || undefined}
      class={cn(
        'bg-surface-strong text-fg ring-line inline-flex max-w-full items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-medium ring-1 transition-colors',
        href() && 'hover:bg-surface',
        focusRing,
        props.class,
      )}
    >
      <Avatar
        src={props.user.profileImage}
        alt=""
        size="xs"
        shape="circle"
        ringColor={
          props.user.accentColor ?? props.user.primaryColor ?? undefined
        }
        fallback={props.user.username[0]}
      />
      <span class="truncate">{props.user.username}</span>
    </a>
  )
}
