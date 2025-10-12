import { type Component, For, Match, Show, Switch } from 'solid-js'
import { useAdminTeamDetail } from './AdminTeamDetailsProvider.tsx'
import { createModalSignal } from '../../../../../../lib/createModalSignal.ts'
import { ConfirmationDialog } from '../../../../../common/dialogs/ConfirmationDialog.tsx'
import {
  FaSolidArrowUpRightFromSquare,
  FaSolidCircleExclamation,
  FaSolidCrown,
  FaSolidUsers,
  FaSolidXmark,
} from 'solid-icons/fa'

interface Member {
  userId: number
  username: string
  tiltifySlug: string
}

interface MemberListItemProps {
  member: Member
  isOwner: boolean
}

const MemberListItem: Component<MemberListItemProps> = (props) => {
  const { removeUser, removeUserMutation, team } = useAdminTeamDetail()
  const removeConfirmDialog = createModalSignal()

  const handleRemoveClick = () => {
    removeConfirmDialog.open()
  }

  const handleConfirmRemove = async () => {
    try {
      await removeUser(props.member.userId)
      removeConfirmDialog.close()
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  return (
    <>
      <div class="group flex flex-col gap-4 rounded-xl border-2 bg-white p-2 shadow-md transition-all duration-300 hover:border-primary-100">
        <div class="flex flex-1 items-center gap-3">
          {/* Avatar placeholder */}
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 shadow-sm">
            <span class="text-sm font-semibold text-white">
              {(props.member.username || 'U')[0].toUpperCase()}
            </span>
          </div>

          {/* Member info */}
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="block truncate text-sm font-semibold text-gray-800">
                {props.member.username || 'Unknown User'}
              </p>
              {props.isOwner && (
                <div class="flex items-center gap-1 rounded-full bg-warning-100 px-2 py-1 text-warning-700">
                  <FaSolidCrown class="h-3 w-3" />
                  <span class="text-xs font-medium">Owner</span>
                </div>
              )}
            </div>
          </div>

          {/* Remove button (only for non-owners) */}
          {!props.isOwner && (
            <button
              type="button"
              onClick={handleRemoveClick}
              disabled={removeUserMutation.isPending}
              class="flex-shrink-0 rounded-full p-2 opacity-70 outline-none transition-all duration-200 group-hover:opacity-100 hover:scale-110 hover:bg-danger-100 focus:bg-danger-100 focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 focus:ring-offset-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Remove ${props.member.username} from team`}
              title="Remove member"
            >
              <FaSolidXmark class="h-4 w-4 text-danger-500 hover:text-danger-600" />
            </button>
          )}
        </div>

        <a
          class="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors duration-200 hover:underline"
          href={`/${props.member.tiltifySlug}`}
        >
          {props.member.tiltifySlug}{' '}
          <FaSolidArrowUpRightFromSquare class="h-3 w-3" />
        </a>
      </div>

      <ConfirmationDialog
        isOpen={removeConfirmDialog.isOpen()}
        onOpenChange={removeConfirmDialog.setOpen}
        title="Remove Team Member"
        text={`Are you sure you want to remove ${props.member.username} from the team? This action cannot be undone.`}
        onConfirm={handleConfirmRemove}
        onCancel={removeConfirmDialog.close}
      />
    </>
  )
}

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center px-4 py-12">
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 shadow-lg">
      <FaSolidUsers class="h-8 w-8 text-white" />
    </div>
    <h4 class="mb-2 text-xl font-semibold text-gray-800">No members yet</h4>
    <p class="mb-6 max-w-md text-center leading-relaxed text-gray-600">
      Your team doesn't have any members yet. Send invitations to other users to
      build your team.
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
 * AdminTeamMembersSection Component
 *
 * Displays and manages team members with removal functionality.
 * Enhanced with modern design, member cards, and proper loading/empty states.
 */
export const AdminTeamMembersSection: Component = () => {
  const { team, members, removeUserMutation } = useAdminTeamDetail()

  const membersList = () => members.data?.members ?? []
  const hasMembers = () => membersList().length > 0
  const isLoading = () => members.isLoading
  const hasError = () => !!members.error

  return (
    <div class="space-y-6">
      {/* Section Header */}
      <div class="flex items-center gap-3">
        <h4 class="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FaSolidUsers class="h-4 w-4 text-primary" />
          Team Members
        </h4>
      </div>

      {/* Error Message */}
      <Show when={removeUserMutation.isError}>
        <div class="rounded-xl border border-danger-200 bg-danger-50 p-4">
          <div class="flex items-center gap-3 text-danger-600">
            <FaSolidCircleExclamation class="h-4 w-4 flex-shrink-0" />
            <p class="text-sm font-medium">
              {removeUserMutation.failureReason?.message ||
                'Failed to remove member'}
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
                <p class="text-sm font-semibold">Error loading members</p>
                <p class="text-xs opacity-90">
                  {members.error?.message || 'Unknown error occurred'}
                </p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={!hasMembers()}>
          <EmptyState />
        </Match>

        <Match when={hasMembers()}>
          <div class="grid grid-cols-1 ~gap-3/4 sm:grid-cols-2 lg:grid-cols-3">
            <For each={membersList()}>
              {(member) => (
                <MemberListItem
                  member={member}
                  isOwner={member.userId === team.data?.ownerId}
                />
              )}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  )
}
