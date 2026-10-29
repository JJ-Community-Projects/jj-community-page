import { type Component, For, Show } from 'solid-js'
import { IconButton } from '../../ui/Button'
import { cn } from '../../ui/cn'
import {
  BskyIcon,
  InstagramIcon,
  TiktokIcon,
  TwitchIcon,
  TwitterIcon,
  YoutubeIcon,
} from '../../common/icons/JJIcons.tsx'

const YOGSCAST_LINKS = [
  { label: 'Yogscast on Twitch', href: 'https://twitch.tv/yogscast', icon: () => <TwitchIcon class="size-4" /> },
  { label: 'Yogscast on YouTube', href: 'https://www.youtube.com/yogscast', icon: () => <YoutubeIcon class="size-4" /> },
  { label: 'Yogscast on Bluesky', href: 'https://bsky.app/profile/yogscast.com', icon: () => <BskyIcon class="size-4" /> },
  { label: 'Yogscast on X', href: 'https://x.com/yogscast', icon: () => <TwitterIcon class="size-4" /> },
  { label: 'Yogscast on Instagram', href: 'https://www.instagram.com/officialyogscast/', icon: () => <InstagramIcon class="size-4" /> },
  { label: 'Yogscast on TikTok', href: 'https://www.tiktok.com/@yogscastofficial', icon: () => <TiktokIcon class="size-4" /> },
]

const variants = {
  /** Below the schedule, light text on the red canvas; the only one with the contact line (D8). */
  canvas: 'text-on-canvas-muted mx-auto max-w-3xl items-center text-center text-sm',
  /** Inside a tile (the schedule isn't shown yet). */
  tile: 'text-fg-muted items-center text-center text-sm',
  /** The stream dialog's fine print (Dialog `aside`). */
  compact: 'items-start',
}

/** The schedule's disclaimer and the Yogscast's social links, in one wording for every place. */
export const YogsScheduleNotice: Component<{
  variant: keyof typeof variants
  class?: string
}> = (props) => (
  <div class={cn('flex flex-col gap-1 text-pretty', variants[props.variant], props.class)}>
    <p>
      The schedule is subject to change: not all participants are confirmed, and streams can move or be
      cancelled. For news, follow the Yogscast.
    </p>
    <div class={cn('flex flex-row flex-wrap', props.variant === 'compact' ? '-ml-2' : 'justify-center')}>
      <For each={YOGSCAST_LINKS}>
        {(link) => (
          <IconButton
            variant="ghost"
            size="sm"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            class={props.variant === 'canvas' ? 'text-on-canvas hover:bg-white/10' : undefined}
          >
            {link.icon()}
          </IconButton>
        )}
      </For>
    </div>
    <Show when={props.variant !== 'compact'}>
      <p>
        This schedule is maintained by the community.{' '}
        <Show when={props.variant === 'canvas'}>
          Found an error or a missing stream? Use the contact info below or message @ostof on Discord.{' '}
        </Show>
        It's a fan project, not associated with the Jingle Jam, the Yogscast or their partners.
      </p>
    </Show>
  </div>
)
