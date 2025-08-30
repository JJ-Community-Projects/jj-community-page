import { Show } from "solid-js";
import { FaSolidUsers, FaSolidArrowRight } from "solid-icons/fa";

interface TeamCardProps {
  team: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    memberCount: number;
  };
}

export function TeamCard(props: TeamCardProps) {
  return (
    <a
      href={`/teams/${props.team.slug}`}
      class="
        group relative overflow-hidden rounded-xl px-4 py-3
        shadow-md hover:shadow-lg hover:scale-[1.02]
        transition-all duration-300 ease-out transform
        focus:ring-2 focus:ring-accent focus:ring-offset-2
        active:scale-[0.98] border-2 border-accent-100 hover:border-accent-200
        bg-white
      "
    >
      <div class="space-y-3">
        <h2 class="~text-lg/xl font-semibold font-poppins text-neutral-800 group-hover:text-accent-700 transition-colors">
          {props.team.name}
        </h2>

        <Show when={props.team.description}>
          <p class="text-neutral-600 ~text-sm/base font-poppins line-clamp-2 leading-relaxed">
            {props.team.description!.length > 100
              ? props.team.description!.substring(0, 100) + '...'
              : props.team.description
            }
          </p>
        </Show>

        <div class="flex items-center justify-between pt-2 border-t border-accent-100">
          <span class="inline-flex items-center gap-1 px-2 py-1 bg-accent-50 text-accent-700 rounded-full ~text-xs/sm font-medium">
            <FaSolidUsers class="w-3 h-3" />
            {props.team.memberCount} {props.team.memberCount === 1 ? 'member' : 'members'}
          </span>
          <FaSolidArrowRight class="w-4 h-4 text-accent-500 group-hover:text-accent-600 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </a>
  );
}
