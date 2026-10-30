import { type Component, For } from 'solid-js'
import { FaSolidUserGroup } from 'solid-icons/fa'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema'
import { UserPill } from '../../../common/UserPill'
import { Section } from '../../../ui/Tile'

/** Friends on a profile (the page only renders this when there are some). */
export const FriendsSection: Component<{ friends: UserDisplay[] }> = (
  props,
) => (
  <Section title="Friends" icon={<FaSolidUserGroup />}>
    <div class="flex flex-wrap gap-2">
      <For each={props.friends}>{(friend) => <UserPill user={friend} />}</For>
    </div>
  </Section>
)
