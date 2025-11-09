import type { Component } from 'solid-js'
import {
  InstagramIcon,
  TiktokIcon,
  TwitchIcon,
  TwitterIcon,
  YoutubeIcon,
} from '../../common/icons/JJIcons.tsx'

export const YogsScheduleDisclaimer: Component = () => {
  return (
    <div class={'max-w-[30rem] text-pretty text-center text-white'}>
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

export const YogsStreamDisclaimer: Component = () => {
  return (
    <div class={'max-w-[30rem] text-pretty text-center text-xs'}>
      <p>
        The schedule is subject to change and not all participants are
        confirmed. For more information visit the Yogscast's social media.
      </p>
      <ExternalLinks />
    </div>
  )
}

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
