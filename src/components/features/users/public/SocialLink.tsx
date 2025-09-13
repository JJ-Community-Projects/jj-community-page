import { type Component, Match, Switch } from 'solid-js'
import { TwitchLive } from './social/TwitchLive'
import { YouTube } from './social-links/YouTube'
import { Twitter } from './social-links/Twitter'
import { Instagram } from './social-links/Instagram'
import { TikTok } from './social-links/TikTok'
import { BlueSky } from './social-links/BlueSky'
import { FaSolidGlobe } from 'solid-icons/fa'

interface SocialLinkProps {
  provider: string;
  url: string;
  userId: number;
}

export const SocialLink: Component<SocialLinkProps> = (props) => {
  const provider = props.provider.toLowerCase();

  return (
    <Switch>
      <Match when={provider === 'twitch'}>
        <TwitchLive url={props.url} userId={props.userId}/>
      </Match>
      <Match when={provider === 'youtube'}>
        <YouTube url={props.url}/>
      </Match>
      <Match when={provider === 'twitter' || provider === 'x'}>
        <Twitter url={props.url} name="Twitter"/>
      </Match>
      <Match when={provider === 'instagram'}>
        <Instagram url={props.url}/>
      </Match>
      <Match when={provider === 'tiktok'}>
        <TikTok url={props.url}/>
      </Match>
      <Match when={provider === 'bluesky' || provider === 'bsky'}>
        <BlueSky url={props.url} name="BlueSky"/>
      </Match>
      <Match when={true}>
        <a
          href={props.url}
          target="_blank"
          rel="noopener noreferrer"
          class="flex flex-col items-center justify-center hover:scale-105 transition-all rounded-full p-2 hover:text-neutral-600 hover:bg-neutral-100"
        >
          <FaSolidGlobe class="size-6"/>
          <p class="text-xxs">{provider.charAt(0).toUpperCase() + provider.slice(1)}</p>
        </a>
      </Match>
    </Switch>
  );
};
