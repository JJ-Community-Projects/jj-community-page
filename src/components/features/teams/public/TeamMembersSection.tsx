import { type Component, For, Show } from 'solid-js'
import { FaSolidUsers } from 'solid-icons/fa'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema'
import { UserPill } from '../../../common/UserPill'
import { Chip } from '../../../ui/Labels'
import { EmptyState } from '../../../ui/Status'
import { Section } from '../../../ui/Tile'

/** Team members as pills, with the count next to the title (tests find the h2 "Members"). */
export const TeamMembersSection: Component<{ members: UserDisplay[] }> = (
  props,
) => (
  <Section
    title="Members"
    icon={<FaSolidUsers />}
    action={
      <Chip size="sm">
        {props.members.length}{' '}
        {props.members.length === 1 ? 'member' : 'members'}
      </Chip>
    }
  >
    <Show
      when={props.members.length > 0}
      fallback={
        <EmptyState title="No members yet">
          Team members will appear here when they join.
        </EmptyState>
      }
    >
      <div class="flex flex-wrap gap-2">
        <For each={props.members}>{(member) => <UserPill user={member} />}</For>
      </div>
    </Show>
  </Section>
)
