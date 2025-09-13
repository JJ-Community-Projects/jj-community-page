import {type Component, For, Show} from "solid-js";
import type {UserDisplay} from "../../../../lib/orpc/public/schemas/UserDisplaySchema";
import {UserPillAvatar} from "../../../common/UserAvatar";
import {FaSolidUsers} from "solid-icons/fa";

interface TeamMembersSectionProps {
  members: UserDisplay[];
  teamColors?: {
    primaryColor: string | null;
    accentColor: string | null;
  };
}

export const TeamMembersSection: Component<TeamMembersSectionProps> = (props) => {
  const {members, teamColors} = props;

  // Get team colors with fallbacks to design system colors
  const primaryColor = teamColors?.primaryColor || '#E30E50';
  const accentColor = teamColors?.accentColor || '#3584BF';

  return (
    <div
      class="group w-full bg-white rounded-xl shadow-md border-2 group-hover:border-accent-200 hover:shadow-lg transition-all duration-300 p-4 md:p-6 lg:p-8"
      style={{
        "--user-primary": primaryColor,
        "--user-accent": accentColor
      }}
    >
        {/* Section Header */}
        <div class="flex items-center gap-2 text-lg font-semibold mb-4">
          <FaSolidUsers class="w-5 h-5 text-black group-hover:text-accent transition-all duration-300" />
          <h2 class="~text-xl/2xl font-babas text-black group-hover:text-accent transition-all duration-300">
            Members
          </h2>
        </div>

        <Show
          when={members && members.length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg"
                style={{
                  "background": `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                }}
              >
                <FaSolidUsers class="w-8 h-8 text-white" />
              </div>
              <h3 class="text-lg font-semibold text-neutral-700 mb-2 font-poppins">No members yet</h3>
              <p class="text-neutral-500 font-poppins">
                Team members will appear here when they join
              </p>
            </div>
          }
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            <For each={members}>
              {(member) => (
                <div
                  class="transform hover:scale-[1.02] transition-all duration-200"
                >
                  <UserPillAvatar
                    user={member}
                    primaryColor={member.primaryColor || primaryColor}
                    accentColor={member.accentColor || accentColor}
                  />
                </div>
              )}
            </For>
          </div>
        </Show>
    </div>
  );
};
