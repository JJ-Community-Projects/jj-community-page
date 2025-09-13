import { type Component, For, Show } from 'solid-js'
import type { UserProfileData } from '../../../../lib/orpc/public/schemas/users'
import { TagChip } from './tags/TagChip'
import { SocialLink } from './SocialLink.tsx'

interface UserHeaderProps {
  user: UserProfileData;
}

export const UserHeader: Component<UserHeaderProps> = (props) => {
  const {user} = props;
  const {user: userData, tags, socials, style} = user;

  // Get user colors with fallbacks to design system colors
  const primaryColor = style.primaryColor || '#E30E50';
  const accentColor = style.accentColor || '#3584BF';

  return (
    <div
      class="w-full bg-white rounded-xl shadow-md border-2 hover:shadow-lg transition-all duration-300"
      style={{
        "--user-primary": primaryColor,
        "--user-accent": accentColor
    }}>
      <div class="p-4">
        {/* Centered Layout - Avatar, Username, Tags, Social Links */}
        <div class="flex flex-col items-center text-center">
          {/* Avatar Section - Centered */}
          <div class="relative">
            {/* Custom Avatar Implementation */}
              <div class="relative inline-block">
              <div class="relative size-24">
                <div
                  class="relative rounded-full overflow-hidden size-24 border-4"
                  style={{
                    "border-color": accentColor
                }}>
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
            <h1 class="~text-xl/2xl font-babas text-black">
              {userData.username}
            </h1>

            {/* Tags Section - Below Username */}
            <Show when={tags.length > 0}>
              <div class="flex flex-wrap gap-2 justify-center">
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
