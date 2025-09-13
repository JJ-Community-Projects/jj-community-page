import { type Component, For, Show } from 'solid-js'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema'
import { FaSolidUser } from 'solid-icons/fa'
import { UserPillAvatar } from '../../../common/UserAvatar.tsx'

interface FriendsSectionProps {
  friends: UserDisplay[];
  userColors: {
    primaryColor: string | null;
    accentColor: string | null;
  };
}


export const FriendsSection: Component<FriendsSectionProps> = (props) => {
  // Get user colors with fallbacks to design system colors
  const primaryColor = props.userColors.primaryColor || '#E30E50';
  const accentColor = props.userColors.accentColor || '#3584BF';

  return (
    <div
      class="group w-full bg-white rounded-xl shadow-md border-2 group-hover:border-accent-200 hover:shadow-lg transition-all duration-300"
      style={{
        "--user-primary": primaryColor,
        "--user-accent": accentColor
      }}
    >
      <div class="p-4">
          <div class="flex items-center gap-2 text-lg font-semibold mb-4">
            <FaSolidUser class="w-5 h-5 text-black group-hover:text-accent transition-all duration-300"/>
            <h2 class="~text-xl/2xl font-babas text-black group-hover:text-accent transition-all duration-300">
              Friends
            </h2>
          </div>
        <Show
          when={props.friends && props.friends.length > 0}
        >
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
  );
};
