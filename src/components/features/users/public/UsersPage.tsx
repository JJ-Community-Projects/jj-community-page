import { type Component, For, Show } from 'solid-js'
import UserListItem from './UserListItem'
import type { UserDisplayWithTags } from '../../../../lib/orpc/public/schemas/users.ts'

interface UsersPageProps {
  data: UserDisplayWithTags[]
}

const UsersPage: Component<UsersPageProps> = (props) => {
  return (
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <For each={props.data}>
        {(user) => (
          <Show when={user}>
            <UserListItem user={user} />
          </Show>
        )}
      </For>
    </div>
  )
}

export default UsersPage
