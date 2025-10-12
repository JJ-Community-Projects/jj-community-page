import { type Component, For, Match, Show, Switch } from 'solid-js'
import { createModalSignal } from '../../../../../../lib/createModalSignal.ts'
import { ConfirmationDialog } from '../../../../../common/dialogs/ConfirmationDialog.tsx'
import { useAdminTeamDetail } from './AdminTeamDetailsProvider.tsx'
import { AdminTeamInviteSearchInput } from './AdminTeamInviteSearchInput.tsx'
import {
  FaSolidArrowUpRightFromSquare,
  FaSolidCircleExclamation,
  FaSolidClock,
  FaSolidEnvelope,
  FaSolidXmark,
} from 'solid-icons/fa'

interface Invite {
  userId: number
  username: string
  tiltifySlug: string
}

interface InviteListItemProps {
  invite: Invite
}

const InviteListItem: Component<InviteListItemProps> = (props) => {
  const { cancelInvite, cancelInviteMutation } = useAdminTeamDetail()
  const cancelInviteDialog = createModalSignal()

  const handleCancelClick = () => {
    cancelInviteDialog.open()
  }

  const handleConfirmCancel = async () => {
    try {
      await cancelInvite(props.invite.userId)
      cancelInviteDialog.close()
    } catch (error) {
      console.error('Failed to cancel invite:', error)
    }
  }

  return (
    <>
      <div class="group flex flex-col gap-4 rounded-xl border-2 bg-white p-2 shadow-md transition-all duration-300 hover:border-warning-100">
        <div class="flex flex-1 items-center gap-3">
          {/* Avatar placeholder */}
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-warning-400 to-warning-500 shadow-sm">
            <span class="text-sm font-semibold text-white">
              {(props.invite.username || 'U')[0].toUpperCase()}
            </span>
          </div>

          {/* Invite info */}
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="block truncate text-sm font-semibold text-gray-800">
                {props.invite.username || 'Unknown User'}
              </p>
              <div class="flex items-center gap-1 rounded-full bg-warning-100 px-2 py-1 text-warning-700">
                <FaSolidClock class="h-3 w-3" />
                <span class="text-xs font-medium">Pending</span>
              </div>
            </div>
          </div>

          {/* Cancel button */}
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={cancelInviteMutation.isPending}
            class="flex-shrink-0 rounded-full p-2 opacity-70 outline-none transition-all duration-200 group-hover:opacity-100 hover:scale-110 hover:bg-danger-100 focus:bg-danger-100 focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 focus:ring-offset-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Cancel invitation for ${props.invite.username}`}
            title="Cancel invitation"
          >
            <FaSolidXmark class="h-4 w-4 text-danger-500 hover:text-danger-600" />
          </button>
        </div>
        <a
          class="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors duration-200 hover:underline"
          href={`/${props.invite.tiltifySlug}`}
        >
          {props.invite.tiltifySlug}{' '}
          <FaSolidArrowUpRightFromSquare class="h-3 w-3" />
        </a>
      </div>

      <ConfirmationDialog
        isOpen={cancelInviteDialog.isOpen()}
        onOpenChange={cancelInviteDialog.setOpen}
        title="Cancel Invitation"
        text={`Are you sure you want to cancel the invitation for ${props.invite.username}? They will no longer be able to join the team using this invitation.`}
        onConfirm={handleConfirmCancel}
        onCancel={cancelInviteDialog.close}
      />
    </>
  )
}

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center px-4 py-12">
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-500 shadow-lg">
      <FaSolidEnvelope class="h-8 w-8 text-white" />
    </div>
    <h4 class="mb-2 text-xl font-semibold text-gray-800">No pending invites</h4>
    <p class="mb-6 max-w-md text-center leading-relaxed text-gray-600">
      You don't have any pending team invitations. Use the search above to find
      and invite users to join your team.
    </p>
  </div>
)

const LoadingSkeleton = () => (
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div class="h-16 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
    <div class="h-16 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
    <div class="h-16 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
  </div>
)

/**
 * AdminTeamInvitesSection Component
 *
 * Manages team invitations with user search and invite management functionality.
 * Enhanced with modern design, invite cards, and proper loading/empty states.
 */
export const AdminTeamInvitesSection: Component = () => {
  const { invites, cancelInviteMutation } = useAdminTeamDetail()

  const invitesList = () => invites.data?.invites ?? []
  const hasInvites = () => invitesList().length > 0
  const isLoading = () => invites.isLoading
  const hasError = () => !!invites.error

  return (
    <div class="space-y-6">
      {/* User Search and Invite Section */}
      <AdminTeamInviteSearchInput />

      {/* Pending Invites Section */}
      <div class="space-y-4">
        {/* Section Header */}
        <div class="flex items-center gap-3">
          <h4 class="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FaSolidEnvelope class="h-4 w-4 text-warning-600" />
            Pending Invites
          </h4>
        </div>

        {/* Error Message */}
        <Show when={cancelInviteMutation.isError}>
          <div class="rounded-xl border border-danger-200 bg-danger-50 p-4">
            <div class="flex items-center gap-3 text-danger-600">
              <FaSolidCircleExclamation class="h-4 w-4 flex-shrink-0" />
              <p class="text-sm font-medium">
                {cancelInviteMutation.failureReason?.message ||
                  'Failed to cancel invitation'}
              </p>
            </div>
          </div>
        </Show>

        <Switch>
          <Match when={isLoading()}>
            <LoadingSkeleton />
          </Match>

          <Match when={hasError()}>
            <div class="rounded-xl border border-danger-200 bg-danger-50 p-6">
              <div class="flex items-center justify-center gap-3 text-danger-600">
                <FaSolidCircleExclamation class="h-5 w-5 flex-shrink-0" />
                <div>
                  <p class="text-sm font-semibold">Error loading invites</p>
                  <p class="text-xs opacity-90">
                    {invites.error?.message || 'Unknown error occurred'}
                  </p>
                </div>
              </div>
            </div>
          </Match>

          <Match when={!hasInvites()}>
            <EmptyState />
          </Match>

          <Match when={hasInvites()}>
            <div class="grid grid-cols-1 ~gap-3/4 sm:grid-cols-2 lg:grid-cols-3">
              <For each={invitesList()}>
                {(invite) => <InviteListItem invite={invite} />}
              </For>
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  )
}
