import {type Component, For, Show} from "solid-js";
import type {UserDisplay} from "../../../../lib/orpc/public/schemas/UserDisplaySchema";
import {FaSolidUserGroup} from "solid-icons/fa";
import {UserPillAvatar} from "../../../common/UserAvatar.tsx";

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
      class="bg-white rounded-xl shadow-md border-2 border-primary-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 mb-6"
      style={{
        "--user-primary": primaryColor,
        "--user-accent": accentColor
      }}
    >
      <div class="p-4 md:p-6 lg:p-8">
        <div class="flex flex-col items-center text-center mb-6">
          <div class="flex items-center gap-3 mb-2">
            <FaSolidUserGroup class="w-5 h-5 text-black"/>
            <h2 class="~text-xl/2xl font-babas text-black">
              Friends
            </h2>
          </div>
        </div>

        <Show
          when={props.friends && props.friends.length > 0}
        >
          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6">
            <For each={props.friends}>
              {(friend) => (
                <UserPillAvatar
                  user={friend}
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                />
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};
