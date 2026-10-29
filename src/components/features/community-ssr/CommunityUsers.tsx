import { type Component, For, Show } from 'solid-js'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import { CommunityUserItem } from '../community/CommunityUserItem.tsx'
import { Button } from '../../ui/Button'
import { Alert, EmptyState, Spinner } from '../../ui/Status'
import { Section } from '../../ui/Tile'

export const CommunityUsers: Component = () => {
  const { users, selectedTagIds, clearSelectedTags, usersFiltered } =
    useCommunityPage()
  const anyTagsSelected = () => selectedTagIds().length > 0
  const list = () =>
    anyTagsSelected() ? usersFiltered() : users.data ? users.data : []
  return (
    <Section title="Users" level={2}>
      <p class="text-fg-muted -mt-2 mb-3 text-sm">
        Fundraisers that have an account
      </p>
      <Show when={users.isLoading}>
        <Spinner label="Loading users…" />
      </Show>
      <Show when={users.isError}>
        <Alert tone="danger">Failed to load users.</Alert>
      </Show>
      <Show when={users.isSuccess && list().length > 0}>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <For each={list()}>{(user) => <CommunityUserItem user={user} />}</For>
        </div>
      </Show>
      <Show when={users.isSuccess && list().length === 0}>
        <EmptyState
          title={
            anyTagsSelected()
              ? 'No users match the selected tags.'
              : 'No users found.'
          }
          action={
            anyTagsSelected() ? (
              <Button size="sm" onClick={() => clearSelectedTags()}>
                Clear selected tags
              </Button>
            ) : undefined
          }
        />
      </Show>
    </Section>
  )
}
