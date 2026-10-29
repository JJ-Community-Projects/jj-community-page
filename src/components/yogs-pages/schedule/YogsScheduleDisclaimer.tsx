import { type Component, For } from 'solid-js'
import { IconButton } from '../../ui/Button'
import {
  InstagramIcon,
  TiktokIcon,
  TwitchIcon,
  TwitterIcon,
  YoutubeIcon,
} from '../../common/icons/JJIcons.tsx'

export const YogsScheduleDisclaimer: Component = () => {
  return (
    <div class={'max-w-120 text-pretty text-center text-white'}>
      <p>
        This site <strong>is maintained by the community</strong>.
      </p>
      <p>
        If you find errors or see that a stream is missing use the contact info
        below or message @ostof on discord.
      </p>
      <p>
        The schedule is subject to change. Not all participants are confirmed
        and some streams might be moved or cancelled.
      </p>
      <p>For more information visit the Yogscast's social media.</p>
      <ExternalLinks />
      <p>
        This site is a{' '}
        <strong>
          fan Project and not associated with the Jingle Jam, the Yogscast or
          their partners.
        </strong>
      </p>
    </div>
  )
}

/** The stream dialog's fine print (Dialog `aside`): one line of text, the Yogscast links after it. */
export const YogsStreamDisclaimer: Component = () => {
  return (
    <div class={'flex flex-col gap-1 text-pretty'}>
      <p>
        The schedule is subject to change and not all participants are
        confirmed. For more information visit the Yogscast's social media.
      </p>
      <div class={'-ml-2 flex flex-row items-center'}>
        <For each={YOGSCAST_LINKS}>
          {(link) => (
            <IconButton
              variant="ghost"
              size="sm"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
            >
              {link.icon()}
            </IconButton>
          )}
        </For>
      </div>
    </div>
  )
}

const YOGSCAST_LINKS = [
  { label: 'Yogscast on YouTube', href: 'https://www.youtube.com/yogscast', icon: () => <YoutubeIcon class={'size-4'} /> },
  { label: 'Yogscast on Twitch', href: 'https://twitch.tv/yogscast', icon: () => <TwitchIcon class={'size-4'} /> },
  { label: 'Yogscast on X', href: 'https://x.com/yogscast', icon: () => <TwitterIcon class={'size-4'} /> },
  { label: 'Yogscast on Instagram', href: 'https://www.instagram.com/officialyogscast/', icon: () => <InstagramIcon class={'size-4'} /> },
  { label: 'Yogscast on TikTok', href: 'https://www.tiktok.com/@yogscastofficial', icon: () => <TiktokIcon class={'size-4'} /> },
]

const ExternalLinks = () => {
  return (
    <div class={'flex w-full flex-row items-center justify-center gap-4 p-2'}>
      <a
        class={'transition-all hover:scale-110'}
        href={'https://www.youtube.com/yogscast'}
        target={'_blank'}
        aria-label={'Yogscast Youtube channel'}
      >
        <YoutubeIcon class={'size-4'} />
      </a>
      <a
        class={'transition-all hover:scale-110'}
        href={'https://twitch.tv/yogscast'}
        target={'_blank'}
        aria-label={'Yogscast Twitch channel'}
      >
        <TwitchIcon class={'size-4'} />
      </a>
      <a
        class={'transition-all hover:scale-110'}
        target={'_blank'}
        href={'https://x.com/yogscast'}
        aria-label={'Yogscast Twitter'}
      >
        <TwitterIcon class={'size-4'} />
      </a>
      <a
        class={'transition-all hover:scale-110'}
        target={'_blank'}
        href={'https://www.instagram.com/officialyogscast/'}
        aria-label={'Yogscast Instagram'}
      >
        <InstagramIcon class={'size-4'} />
      </a>
      <a
        class={'transition-all hover:scale-110'}
        target={'_blank'}
        href={'https://www.tiktok.com/@yogscastofficial'}
        aria-label={'Jingle Jam Tiktok'}
      >
        <TiktokIcon class={'size-4'} />
      </a>
    </div>
  )
}
