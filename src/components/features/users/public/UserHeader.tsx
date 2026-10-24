import { type Component, For, Show } from 'solid-js'
import type { UserProfileData } from '../../../../lib/orpc/public/schemas/users'
import { TagChip } from './tags/TagChip'
import { SocialLink } from './SocialLink.tsx'
import { Tiltify } from './social-links/Tiltify.tsx'

interface UserHeaderProps {
  user: UserProfileData
}

// Tags and social links under the avatar and name on a profile; the card, avatar and h1 are
// rendered by the page so the name is in the server HTML.
export const UserHeaderLinks: Component<UserHeaderProps> = (props) => {
  const { user } = props
  const { user: userData, tags, socials, style } = user

  // Get user colors with fallbacks to design system colors
  const primaryColor = style.primaryColor || '#E30E50'

  return (
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
  )
}
