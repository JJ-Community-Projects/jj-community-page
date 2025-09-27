import { type Component, Show } from 'solid-js'
import type { Team } from '../../../../lib/orpc/public/schemas/teams'
import { FaSolidUsers } from 'solid-icons/fa'

interface TeamHeaderProps {
  team: Team
  memberCount: number
  teamColors?: {
    primaryColor: string | null
    accentColor: string | null
  }
}

export const TeamHeader: Component<TeamHeaderProps> = (props) => {
  const { team } = props

  return (
    <div class="rounded-xl border-2 bg-white shadow-md transition-all duration-300 hover:shadow-lg">
      <div class="p-4 md:p-6 lg:p-8">
        {/* Horizontal Layout - Team Icon next to Name */}
        <div class="flex flex-col items-center text-center">
          {/* Team Icon and Name Section - Horizontal */}
          <div class="mb-4 flex items-center gap-3">
            <FaSolidUsers class="h-8 w-8 text-neutral-600" />
            <h1 class="font-babas text-black ~text-2xl/4xl">{team.name}</h1>
          </div>

          {/* Team Description Section - Below Name */}
          <Show when={team.description}>
            <p class="mb-4 max-w-2xl font-poppins text-neutral-600 ~text-base/lg">
              {team.description}
            </p>
          </Show>
        </div>
      </div>
    </div>
  )
}
