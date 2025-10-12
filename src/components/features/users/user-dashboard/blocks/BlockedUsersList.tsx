import { type Component, For, Match, Show, Switch } from 'solid-js'
import { useBlocks } from './UserBlockProvider.tsx'
import {
  FaSolidArrowUpRightFromSquare,
  FaSolidCircleExclamation,
  FaSolidUserSlash,
  FaSolidXmark,
} from 'solid-icons/fa'
import { createModalSignal } from '../../../../../lib/createModalSignal.ts'
import { ConfirmationDialog } from '../../../../common/dialogs/ConfirmationDialog.tsx'

interface BlockedUser {
  userId: number
  primaryLiveStream: string
  createdAt: Date
  username: string
  profileImage: string
  twitchLogin: string | null
  tiltifySlug: string
  tiltifyUrl: string
  primaryColor: string | null
  accentColor: string | null
}

interface BlockedUserItemProps {
  user: BlockedUser
}

const BlockedUserItem: Component<BlockedUserItemProps> = (props) => {
  const { handleUnblockUser, isUnblockingUser } = useBlocks()

  const unblockUserDialog = createModalSignal()

  const handleUnblockClick = () => {
    unblockUserDialog.open()
  }

  const handleConfirmUnblock = async () => {
    try {
      await handleUnblockUser(props.user.userId)
      unblockUserDialog.close()
    } catch (error) {
      console.error('Failed to unblock user:', error)
    }
  }

  return (
    <div class="group flex flex-col gap-4 rounded-xl border-2 bg-white p-2 shadow-md transition-all duration-300 hover:border-danger-200">
      <div class="flex flex-1 items-center gap-3">
        {/* Avatar */}
        <Show
          when={
            props.user.profileImage && props.user.profileImage.trim() !== ''
          }
          fallback={
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-danger-500 to-danger-600 shadow-sm">
              <span class="text-sm font-semibold text-white">
                {(props.user.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          }
        >
          <img
            src={props.user.profileImage}
            alt={`${props.user.username}'s profile`}
            class="h-10 w-10 flex-shrink-0 rounded-full object-cover shadow-sm"
            onError={(e) => {
              // Fallback to gradient avatar if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const fallback = target.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          <div class="flex hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-danger-500 to-danger-600 shadow-sm">
            <span class="text-sm font-semibold text-white">
              {(props.user.username || 'U')[0].toUpperCase()}
            </span>
          </div>
        </Show>

        {/* User info */}
        <div class="min-w-0 flex-1">
          <p class="block truncate text-sm font-semibold text-gray-800">
            {props.user.username || 'Unknown User'}
          </p>
          <Show when={props.user.twitchLogin}>
            <p class="block truncate text-xs text-gray-600 opacity-80">
              Twitch: {props.user.twitchLogin}
            </p>
          </Show>
        </div>

        {/* Unblock button */}
        <button
          type="button"
          onClick={handleUnblockClick}
          disabled={isUnblockingUser()}
          class="flex flex-shrink-0 items-center gap-2 rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm outline-none transition-all duration-200 hover:bg-gray-300 hover:shadow-md focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Unblock ${props.user.username}`}
          title="Unblock user"
        >
          <FaSolidXmark class="h-4 w-4" />
          {isUnblockingUser() ? 'Unblocking...' : 'Unblock'}
        </button>
      </div>

      <a
        class="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors duration-200 hover:underline"
        href={`/${props.user.tiltifySlug}`}
      >
        {props.user.tiltifySlug}{' '}
        <FaSolidArrowUpRightFromSquare class="h-3 w-3" />
      </a>
      <ConfirmationDialog
        isOpen={unblockUserDialog.isOpen()}
        onOpenChange={unblockUserDialog.setOpen}
        title="Unblock User"
        text={`Are you sure you want to unblock ${props.user.username}? They will be able to interact with you again.`}
        onConfirm={handleConfirmUnblock}
        onCancel={unblockUserDialog.close}
      />
    </div>
  )
}

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center px-4 py-12">
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-danger-500 to-danger-600 shadow-lg">
      <FaSolidUserSlash class="h-8 w-8 text-white" />
    </div>
    <h3 class="mb-2 text-xl font-semibold text-gray-800">No blocked users</h3>
    <p class="mb-6 max-w-md text-center leading-relaxed text-gray-600">
      You haven't blocked anyone yet. Use the search above to find users to
      block.
    </p>
  </div>
)

const LoadingSkeleton = () => (
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div class="h-16 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
    <div class="h-16 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
    <div class="h-16 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
  </div>
)

/**
 * BlockedUsersList Component
 *
 * Displays the user's currently blocked users with unblock functionality.
 * Enhanced with red-themed blocked user cards, unblock UX, and engaging empty states.
 */
export const BlockedUsersList: Component = () => {
  const {
    blockedUsers,
    isLoadingBlockedUsers,
    hasBlockedUsersError,
    blockedUsersErrorMessage,
    hasUnblockError,
    unblockErrorMessage,
  } = useBlocks()

  const hasBlockedUsers = () => blockedUsers().length > 0

  return (
    <div class="mt-6">
      <div class="mb-4 flex items-center gap-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FaSolidUserSlash class="h-4 w-4 text-danger" />
          Blocked Users
        </h3>
      </div>

      {/* Error messages */}
      <Show when={hasUnblockError()}>
        <div class="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <div class="flex items-center gap-3 text-red-600">
            <FaSolidCircleExclamation class="h-4 w-4 flex-shrink-0" />
            <p class="text-sm font-medium">
              {unblockErrorMessage() || 'Failed to unblock user'}
            </p>
          </div>
        </div>
      </Show>

      <Switch>
        <Match when={isLoadingBlockedUsers()}>
          <LoadingSkeleton />
        </Match>

        <Match when={hasBlockedUsersError()}>
          <div class="rounded-xl border border-red-200 bg-red-50 p-6">
            <div class="flex items-center justify-center gap-3 text-red-600">
              <FaSolidCircleExclamation class="h-5 w-5 flex-shrink-0" />
              <div>
                <p class="text-sm font-semibold">Error loading blocked users</p>
                <p class="text-xs opacity-90">
                  {blockedUsersErrorMessage() || 'Unknown error occurred'}
                </p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={!hasBlockedUsers()}>
          <EmptyState />
        </Match>

        <Match when={hasBlockedUsers()}>
          <div class="grid grid-cols-1 ~gap-3/4 sm:grid-cols-2 lg:grid-cols-3">
            <For each={blockedUsers()}>
              {(user) => <BlockedUserItem user={user} />}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  )
}
