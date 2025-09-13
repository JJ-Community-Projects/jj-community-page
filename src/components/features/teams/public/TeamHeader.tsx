import { type Component, Show } from 'solid-js'
import type { Team } from '../../../../lib/orpc/public/schemas/teams'
import { FaSolidUserGroup, FaSolidUsers } from 'solid-icons/fa'

interface TeamHeaderProps {
  team: Team;
  memberCount: number;
  teamColors?: {
    primaryColor: string | null;
    accentColor: string | null;
  };
}

export const TeamHeader: Component<TeamHeaderProps> = (props) => {
  const {team, memberCount} = props;

  return (
    <div
      class="bg-white rounded-xl shadow-md border-2 hover:shadow-lg transition-all duration-300"
    >
      <div class="p-4 md:p-6 lg:p-8">
        {/* Horizontal Layout - Team Icon next to Name */}
        <div class="flex flex-col items-center text-center">
          {/* Team Icon and Name Section - Horizontal */}
          <div class="flex items-center gap-3 mb-4">
            <FaSolidUserGroup class="w-8 h-8 text-neutral-600" />
            <h1 class="~text-2xl/4xl font-babas text-black">
              {team.name}
            </h1>
          </div>

          {/* Team Description Section - Below Name */}
          <Show when={team.description}>
            <p class="~text-base/lg font-poppins text-neutral-600 mb-4 max-w-2xl">
              {team.description}
            </p>
          </Show>

          {/* Team Stats Section - Member Count */}
          <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100">
            <FaSolidUsers class="w-4 h-4 text-neutral-600" />
            <span class="font-medium font-poppins text-neutral-700">
              {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
