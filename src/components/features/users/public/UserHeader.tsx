import { type Component, For, Show } from 'solid-js'
import type { UserProfileData } from '../../../../lib/orpc/public/schemas/users'
import { SocialLink } from './SocialLink.tsx'
import { Tiltify } from './social-links/Tiltify.tsx'
import { TagChip } from './tags/TagChip'

// Tags and social links next to the avatar and name on a profile; the tile, avatar and h1 are
// rendered by the page so the name is in the server HTML.
export const UserHeaderLinks: Component<{ user: UserProfileData }> = (
  props,
) => {
  const { user: userData, tags, socials, style } = props.user
  // Tags in the user's primary colour, the site primary when unset
  const primaryColor = style.primaryColor || '#E30E50'

  return (
    <div class="flex flex-col gap-3">
      <Show when={tags.length > 0}>
        <div class="flex flex-wrap gap-1.5">
          <For each={tags}>
            {(tag) => <TagChip name={tag.name} primaryColor={primaryColor} />}
          </For>
        </div>
      </Show>
      <div class="-ml-2 flex flex-wrap gap-1">
        <Tiltify url={`https://tiltify.com/@${userData.tiltifySlug}`} />
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
  )
}
