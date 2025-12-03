import { type Component } from 'solid-js'
import { FaSolidEnvelope } from 'solid-icons/fa'
import {
  BskyIcon,
  DiscordIcon,
  RedditIcon,
} from '../../../common/icons/JJIcons.tsx'

export const UserDashboardFeedback: Component = () => {
  return (
    <div class={'flex flex-col items-start justify-start gap-1 text-black'}>
      <p class={'font-poppins font-bold text-neutral-800 '}>Send Feedback</p>
      <div class={'flex flex-row gap-4'}>
        <a
          class={
            'rounded-full transition-all hover:scale-110 hover:bg-black/10'
          }
          href={'https://discord.gg/hBdKXkB'}
        >
          <DiscordIcon class={'size-5'} />
        </a>
        <a
          class={
            'rounded-full transition-all hover:scale-110 hover:bg-black/10'
          }
          href={'https://bsky.app/profile/ostof.bsky.social'}
        >
          <BskyIcon class={'size-5'} />
        </a>
        <a
          class={
            'rounded-full transition-all hover:scale-110 hover:bg-black/10'
          }
          href={'mailto:ostof13@gmail.com'}
        >
          <FaSolidEnvelope class={'size-5'} />
        </a>
        <a
          class={
            'rounded-full transition-all hover:scale-110 hover:bg-black/10'
          }
          href={'https://old.reddit.com/message/compose/?to=Ostof'}
        >
          <RedditIcon class={'size-5'} />
        </a>
      </div>
    </div>
  )
}
