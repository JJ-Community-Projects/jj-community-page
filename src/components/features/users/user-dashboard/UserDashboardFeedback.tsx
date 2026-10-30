import { type Component } from 'solid-js'
import { FaSolidEnvelope } from 'solid-icons/fa'
import {
  BskyIcon,
  DiscordIcon,
  RedditIcon,
} from '../../../common/icons/JJIcons.tsx'
import { cn, focusRing } from '../../../ui/cn'

const links = [
  {
    href: 'https://discord.gg/hBdKXkB',
    label: 'Feedback on Discord',
    Icon: DiscordIcon,
  },
  {
    href: 'https://bsky.app/profile/ostof.bsky.social',
    label: 'Feedback on Bluesky',
    Icon: BskyIcon,
  },
  {
    href: 'mailto:ostof13@gmail.com',
    label: 'Feedback by email',
    Icon: FaSolidEnvelope,
  },
  {
    href: 'https://old.reddit.com/message/compose/?to=Ostof',
    label: 'Feedback on Reddit',
    Icon: RedditIcon,
  },
]

/** The one feedback spot in the dashboard (on the dashboard home). */
export const UserDashboardFeedback: Component = () => (
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
    <p class="text-fg-muted text-sm font-semibold">Send Feedback</p>
    <div class="text-fg-muted flex gap-1">
      {links.map(({ href, label, Icon }) => (
        <a
          href={href}
          aria-label={label}
          class={cn(
            'hover:text-fg rounded-full p-1.5 transition-colors hover:bg-black/5',
            focusRing,
          )}
        >
          <Icon class="size-4" />
        </a>
      ))}
    </div>
  </div>
)
