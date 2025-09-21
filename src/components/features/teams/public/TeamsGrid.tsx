import { For } from 'solid-js'
import { TeamCard } from './TeamCard'

interface TeamsGridProps {
  teams: {
    id: number
    name: string
    slug: string
    description: string | null
    memberCount: number
  }[]
}

export function TeamsGrid(props: TeamsGridProps) {
  return (
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <For each={props.teams}>{(team) => <TeamCard team={team} />}</For>
    </div>
  )
}
