import { Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { FaSolidChevronRight, FaSolidUsers } from 'solid-icons/fa'
import { Tile } from '../../../ui/Tile'
import { Chip } from '../../../ui/Labels'

interface TeamCardProps {
  team: {
    name: string
    slug: string
    description: string | null
    /** Shown as a chip when known (the profile's team list has no counts). */
    memberCount?: number
  }
  /** Heading level of the team name: 2 on /teams, 3 inside a profile section. */
  level?: 2 | 3
}

/** A team as a clickable tile: name, two lines of description, member count. */
export function TeamCard(props: TeamCardProps) {
  return (
    <Tile
      href={`/teams/${props.team.slug}`}
      pad="sm"
      class="flex flex-col gap-1.5 p-3"
    >
      <div class="flex items-center gap-2">
        <Dynamic
          component={props.level === 3 ? 'h3' : 'h2'}
          class="min-w-0 flex-1 truncate font-semibold"
        >
          {props.team.name}
        </Dynamic>
        <FaSolidChevronRight
          class="text-fg-muted size-3 shrink-0"
          aria-hidden="true"
        />
      </div>
      <Show when={props.team.description}>
        <p class="text-fg-muted line-clamp-2 text-sm">
          {props.team.description}
        </p>
      </Show>
      <Show when={props.team.memberCount !== undefined}>
        <div>
          <Chip size="sm" icon={<FaSolidUsers class="size-2.5" />}>
            {props.team.memberCount}{' '}
            {props.team.memberCount === 1 ? 'member' : 'members'}
          </Chip>
        </div>
      </Show>
    </Tile>
  )
}
