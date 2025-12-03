import { type Component } from 'solid-js'
import { DiscordIcon, RedditIcon } from '../../common/icons/JJIcons.tsx'
import { FaRegularEnvelope } from 'solid-icons/fa'

export const FeedbackButtons: Component = (props) => {
  return (
    <div class={'flex flex-row gap-4 p-2 text-white'}>
      <a
        class={
          'rounded-full transition-all hover:scale-110 hover:bg-primary hover:text-accent'
        }
        href={'mailto:ostof13@gmail.com'}
      >
        <FaRegularEnvelope />
      </a>
      <a
        class={
          'rounded-full transition-all hover:scale-110 hover:bg-white hover:text-discord'
        }
        href={'https://discord.gg/hBdKXkB'}
      >
        <DiscordIcon />
      </a>
      <a
        class={
          'rounded-full transition-all hover:scale-110 hover:bg-white hover:text-reddit'
        }
        href={'https://old.reddit.com/message/compose/?to=Ostof'}
      >
        <RedditIcon />
      </a>
      <a
        class={
          'rounded-full transition-all hover:scale-110 hover:bg-white hover:text-reddit'
        }
        href={'https://old.reddit.com/message/compose/?to=Ostof'}
      >
        <RedditIcon />
      </a>
    </div>
  )
}
