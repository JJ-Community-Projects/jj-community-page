import { type Component, For, Match, Show, Switch } from 'solid-js'
import { useAdminTeamDetail } from './AdminTeamDetailsProvider.tsx'
import { ConfirmDialog } from '../../../../../ui/Dialog'
import { IconButton } from '../../../../../ui/Button'
import { Chip } from '../../../../../ui/Labels'
import { Alert, EmptyState, Skeleton } from '../../../../../ui/Status'
import { createConfirm, type ListUser, UserRow } from '../../common/UserList.tsx'
import { FaSolidCrown, FaSolidUsers, FaSolidXmark } from 'solid-icons/fa'

/** Section header with an h4: the tests scope a part by the heading's grandparent. */
export const AdminHeading: Component<{ title: string; icon: Component<{ class?: string }> }> = (
  props,
) => (
  <div class="mb-3 flex min-h-8 items-center gap-2">
    <props.icon class="text-fg-muted size-4" aria-hidden="true" />
    <h4 class="text-base font-semibold">{props.title}</h4>
  </div>
)

/** The members, each removable except the owner. */
export const AdminTeamMembersSection: Component = () => {
  const { team, members, removeUser, removeUserMutation } = useAdminTeamDetail()
  const confirm = createConfirm<ListUser>()

  const membersList = () => members.data?.members ?? []

  return (
    <div>
      <AdminHeading title="Team Members" icon={FaSolidUsers} />
      <div class="flex flex-col gap-2">
        <Show when={removeUserMutation.isError}>
          <Alert tone="danger">
            {removeUserMutation.failureReason?.message ||
              'Failed to remove member'}
          </Alert>
        </Show>
        <Switch>
          <Match when={members.isLoading}>
            <Skeleton class="h-14" />
            <Skeleton class="h-14" />
          </Match>
          <Match when={members.error}>
            <Alert tone="danger" title="Error loading members">
              {members.error?.message || 'Unknown error occurred'}
            </Alert>
          </Match>
          <Match when={membersList().length === 0}>
            <EmptyState title="No members yet">
              Invite other users to build your team.
            </EmptyState>
          </Match>
          <Match when={membersList().length > 0}>
            <For each={membersList()}>
              {(member) => {
                const isOwner = () => member.userId === team.data?.ownerId
                return (
                  <UserRow
                    user={member}
                    badge={
                      <Show when={isOwner()}>
                        <Chip
                          tone="accent"
                          size="sm"
                          icon={<FaSolidCrown class="size-2.5" aria-hidden="true" />}
                        >
                          Owner
                        </Chip>
                      </Show>
                    }
                    actions={
                      <Show when={!isOwner()}>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          class="text-danger-600"
                          disabled={removeUserMutation.isPending}
                          aria-label={`Remove ${member.username} from team`}
                          title="Remove member"
                          onClick={() => confirm.ask(member)}
                        >
                          <FaSolidXmark class="size-4" aria-hidden="true" />
                        </IconButton>
                      </Show>
                    }
                  />
                )
              }}
            </For>
          </Match>
        </Switch>
      </div>

      <ConfirmDialog
        open={confirm.isOpen()}
        onOpenChange={confirm.onOpenChange}
        title="Remove Team Member"
        text={`Are you sure you want to remove ${confirm.target()?.username} from the team? This action cannot be undone.`}
        pending={removeUserMutation.isPending}
        onConfirm={() => confirm.run((row) => removeUser(row.userId))}
      />
    </div>
  )
}
