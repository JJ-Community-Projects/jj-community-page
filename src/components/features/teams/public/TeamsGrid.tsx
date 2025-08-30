import { Show, For } from "solid-js";
import { TeamCard } from "./TeamCard";
import { TeamsGridSkeleton, TeamsEmptyState } from "./TeamsGridStates";

interface TeamsGridProps {
  teams: Array<{
    id: number;
    name: string;
    slug: string;
    description: string | null;
    memberCount: number;
  }>;
  loading?: boolean;
}

export function TeamsGrid(props: TeamsGridProps) {
  return (
    <div class="w-full">
      <Show
        when={!props.loading && props.teams.length > 0}
        fallback={<TeamsGridSkeleton when={props.loading} />}
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <For each={props.teams}>
            {(team) => <TeamCard team={team} />}
          </For>
        </div>
      </Show>

      <Show when={!props.loading && props.teams.length === 0}>
        <TeamsEmptyState />
      </Show>
    </div>
  );
}
