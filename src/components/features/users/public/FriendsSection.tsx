import { type Component, For, Show } from 'solid-js'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema'
import { FaSolidUserGroup } from 'solid-icons/fa'
import { UserPillAvatar } from '../../../common/UserAvatar.tsx'

interface FriendsSectionProps {
  friends: UserDisplay[]
  userColors: {
    primaryColor: string | null
    accentColor: string | null
  }
}

export const FriendsSection: Component<FriendsSectionProps> = (props) => {
  // Get user colors with fallbacks to design system colors
  const primaryColor = props.userColors.primaryColor || '#E30E50'
  const accentColor = props.userColors.accentColor || '#3584BF'

  return (
    <div
      class="group w-full rounded-xl border-2 bg-white shadow-md transition-all duration-300 group-hover:border-accent-200 hover:shadow-lg"
      style={{
        '--user-primary': primaryColor,
        '--user-accent': accentColor,
      }}
    >
      <div class="p-4">
        <div class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <FaSolidUserGroup class="h-5 w-5 text-black transition-all duration-300 group-hover:text-accent" />
          <h2 class="font-babas text-black transition-all duration-300 ~text-xl/2xl group-hover:text-accent">
            Friends
          </h2>
        </div>
        <Show when={props.friends && props.friends.length > 0}>
          <div class="flex flex-wrap gap-4">
            <For each={props.friends}>
              {(friend) => (
                <div class="min-w-24">
                  <UserPillAvatar
                    user={friend}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                  />
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  )
}
