import { type Component, For, Show } from 'solid-js'
import type { UserProfileData } from '../../../../lib/orpc/public/schemas/users'
import { TagChip } from './tags/TagChip'
import { SocialLink } from './SocialLink.tsx'
import { Tiltify } from './social-links/Tiltify.tsx'

interface UserHeaderProps {
  user: UserProfileData
}

export const UserHeader: Component<UserHeaderProps> = (props) => {
  const { user } = props
  const { user: userData, tags, socials, style } = user

  // Get user colors with fallbacks to design system colors
  const primaryColor = style.primaryColor || '#E30E50'
  const accentColor = style.accentColor || '#3584BF'

  return (
    <div
      class="w-full rounded-xl border-2 bg-white shadow-md transition-all duration-300 hover:shadow-lg"
      style={{
        '--user-primary': primaryColor,
        '--user-accent': accentColor,
      }}
    >
      <div class="p-4">
        {/* Centered Layout - Avatar, Username, Tags, Social Links */}
        <div class="flex flex-col items-center text-center">
          {/* Avatar Section - Centered */}
          <div
            class="relative size-24 overflow-hidden rounded-full border-4"
            style={{
              'border-color': accentColor,
            }}
          >
            <img
              src={userData.profileImage}
              alt={`${userData.username}'s profile`}
              class="h-full w-full object-cover"
            />
          </div>

          {/* Username Section - Below Avatar */}
          <h1 class="font-babas text-black ~text-xl/2xl">
            {userData.username}
          </h1>

          <div class="flex flex-col items-center gap-1 py-2 text-center">
            {/* Tags Section - Below Username */}
            <Show when={tags.length > 0}>
              <div class="flex flex-wrap justify-center gap-2">
                <For each={tags}>
                  {(tag) => (
                    <TagChip name={tag.name} primaryColor={primaryColor} />
                  )}
                </For>
              </div>
            </Show>

            {/* Social Links Section - Below Tags */}
            <div class="w-full">
              <div class="flex flex-wrap justify-center gap-4">
                <Tiltify url={`https://tiltify.com/@${props.user.user.tiltifySlug}`}/>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
