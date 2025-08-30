import {type Component, For, Match, Show, Switch} from "solid-js";
import type {UserProfileData} from "../../../../lib/orpc/public/schemas/users";
import {TwitchLive} from "./social/TwitchLive";
import {YouTube} from "./social-links/YouTube";
import {Twitter} from "./social-links/Twitter";
import {Instagram} from "./social-links/Instagram";
import {TikTok} from "./social-links/TikTok";
import {BlueSky} from "./social-links/BlueSky";
import {TagChip} from "./tags/TagChip";
import {FaSolidGlobe} from "solid-icons/fa";

interface UserHeaderProps {
  user: UserProfileData;
}

interface SocialLinkProps {
  provider: string;
  url: string;
  userId: number;
}

const SocialLink: Component<SocialLinkProps> = (props) => {
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

export const UserHeader: Component<UserHeaderProps> = (props) => {
  const {user} = props;
  const {user: userData, tags, socials, style} = user;

  // Get user colors with fallbacks to design system colors
  const primaryColor = style.primaryColor || '#E30E50';
  const accentColor = style.accentColor || '#3584BF';

  return (
    <div
      class="bg-white rounded-xl shadow-md border-2 border-primary-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 mb-6"
      style={{
        "--user-primary": primaryColor,
        "--user-accent": accentColor
      }}
    >
      <div class="p-4 md:p-6 lg:p-8">
        {/* Centered Layout - Avatar, Username, Tags, Social Links */}
        <div class="flex flex-col items-center text-center">
          {/* Avatar Section - Centered */}
          <div class="relative mb-1">
            {/* Custom Avatar Implementation */}
            <div class="relative inline-block">
              <div class="relative size-24">
                <div
                  class="relative rounded-full overflow-hidden size-24 border-4"
                  style={{
                    "border-color": accentColor
                  }}
                >
                  <img
                    src={userData.profileImage}
                    alt={`${userData.username}'s profile`}
                    class="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Username Section - Below Avatar */}
          <h1 class="~text-xl/2xl font-babas mb-4 text-black">
            {userData.username}
          </h1>

          {/* Tags Section - Below Username */}
          <Show when={tags.length > 0}>
            <div class="flex flex-wrap gap-2 justify-center mb-6">
              <For each={tags}>
                {(tag) => (
                  <TagChip name={tag.name} primaryColor={primaryColor}/>
                )}
              </For>
            </div>
          </Show>

          {/* Social Links Section - Below Tags */}
          <div class="w-full">
            <Show when={socials && socials.length > 0}>
              <div class="flex flex-wrap justify-center gap-4">
                <For each={socials}>
                  {(social) => (
                    <SocialLink
                      provider={social.provider}
                      url={social.url}
                      userId={userData.userId}
                    />
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};
