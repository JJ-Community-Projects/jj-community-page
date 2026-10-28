import { type Component, For, Match, Show, Switch } from 'solid-js'
import { ConfirmDialog } from '../../../../../ui/Dialog'
import { useAdminTeamDetail } from './AdminTeamDetailsProvider.tsx'
import { AdminTeamInviteSearchInput } from './AdminTeamInviteSearchInput.tsx'
import { AdminHeading } from './AdminTeamMembersSection.tsx'
import { Tile } from '../../../../../ui/Tile'
import { IconButton } from '../../../../../ui/Button'
import { Chip } from '../../../../../ui/Labels'
import { Alert, EmptyState, Skeleton } from '../../../../../ui/Status'
import { createConfirm, type ListUser, UserRow } from '../../common/UserList.tsx'
import { FaSolidClock, FaSolidEnvelope, FaSolidXmark } from 'solid-icons/fa'

/** Invite search, then the pending invites (each can be withdrawn). */
export const AdminTeamInvitesSection: Component = () => {
  const { invites, cancelInvite, cancelInviteMutation } = useAdminTeamDetail()
  const confirm = createConfirm<ListUser>()

  const invitesList = () => invites.data?.invites ?? []

  return (
    <>
      <Tile>
        <AdminTeamInviteSearchInput />
      </Tile>

      <Tile>
        <div>
          <AdminHeading title="Pending Invites" icon={FaSolidEnvelope} />
          <div class="flex flex-col gap-2">
            <Show when={cancelInviteMutation.isError}>
              <Alert tone="danger">
                {cancelInviteMutation.failureReason?.message ||
                  'Failed to cancel invitation'}
              </Alert>
            </Show>
            <Switch>
              <Match when={invites.isLoading}>
                <Skeleton class="h-14" />
                <Skeleton class="h-14" />
              </Match>
              <Match when={invites.error}>
                <Alert tone="danger" title="Error loading invites">
                  {invites.error?.message || 'Unknown error occurred'}
                </Alert>
              </Match>
              <Match when={invitesList().length === 0}>
                <EmptyState title="No pending invites">
                  Use the search above to invite users to your team.
                </EmptyState>
              </Match>
              <Match when={invitesList().length > 0}>
                <For each={invitesList()}>
                  {(invite) => (
                    <UserRow
                      user={invite}
                      badge={
                        <Chip
                          size="sm"
                          icon={
                            <FaSolidClock class="size-2.5" aria-hidden="true" />
                          }
                        >
                          Pending
                        </Chip>
                      }
                      actions={
                        <IconButton
                          variant="ghost"
                          size="sm"
                          class="text-danger-600"
                          disabled={cancelInviteMutation.isPending}
                          aria-label={`Cancel invitation for ${invite.username}`}
                          title="Cancel invitation"
                          onClick={() => confirm.ask(invite)}
                        >
                          <FaSolidXmark class="size-4" aria-hidden="true" />
                        </IconButton>
                      }
                    />
                  )}
                </For>
              </Match>
            </Switch>
          </div>
        </div>
      </Tile>

      <ConfirmDialog
        open={confirm.isOpen()}
        onOpenChange={confirm.onOpenChange}
        title="Cancel Invitation"
        text={`Are you sure you want to cancel the invitation for ${confirm.target()?.username}? They will no longer be able to join the team using this invitation.`}
        pending={cancelInviteMutation.isPending}
        onConfirm={() => confirm.run((row) => cancelInvite(row.userId))}
      />
    </>
  )
}
