import { type Component, For } from 'solid-js'
import { FaSolidUserTag } from 'solid-icons/fa'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema'
import { UserPill } from '../../../common/UserPill'
import { Section } from '../../../ui/Tile'

/** Users related to this profile (the page only renders this when there are some). */
export const RelatedSection: Component<{ related: UserDisplay[] }> = (
  props,
) => (
  <Section title="Related" icon={<FaSolidUserTag />}>
    <div class="flex flex-wrap gap-2">
      <For each={props.related}>{(user) => <UserPill user={user} />}</For>
    </div>
  </Section>
)
