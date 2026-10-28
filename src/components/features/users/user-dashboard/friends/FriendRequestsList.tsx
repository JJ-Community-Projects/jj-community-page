import { type Component, For, Match, Show, Switch } from 'solid-js'
import { useFriends } from './UserFriendsProvider.tsx'
import {
  FaSolidArrowUpRightFromSquare,
  FaSolidCheck,
  FaSolidCircleExclamation,
  FaSolidUserPlus,
  FaSolidXmark,
} from 'solid-icons/fa'
import { createModalSignal } from '../../../../../lib/createModalSignal.ts'
import { ConfirmationDialog } from '../../../../common/dialogs/ConfirmationDialog.tsx'

interface FriendRequestsListItemProps {
  request: {
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
}

export const FriendRequestsListItem: Component<FriendRequestsListItemProps> = (
  props,
) => {
  const request = props.request

  const {
    handleAcceptFriendRequest,
    isAcceptingFriendRequest,
    isDecliningFriendRequest,
    handleDeclineFriendRequest,
  } = useFriends()

  const declineRequestDialog = createModalSignal()

  const handleAcceptRequest = async (fromUserId: number) => {
    try {
      await handleAcceptFriendRequest(fromUserId)
    } catch (error) {
      console.error('Failed to accept friend request:', error)
    }
  }

  const handleDeclineClick = () => {
    declineRequestDialog.open()
  }

  const handleConfirmDecline = async () => {
    try {
      await handleDeclineFriendRequest(props.request.userId)
      declineRequestDialog.close()
    } catch (error) {
      console.error('Failed to decline friend request:', error)
    }
  }

  return (
    <>
      <div class="rounded-group bg-surface-strong text-fg ring-1 ring-line group flex items-center justify-between p-4">
        {/* User info */}
        <div class="flex items-center gap-3">
          {/* Avatar */}
          <Show
            when={request.profileImage && request.profileImage.trim() !== ''}
            fallback={
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-primary-600 shadow-xs">
                <span class="font-semibold text-white">
                  {(request.username || 'U')[0].toUpperCase()}
                </span>
              </div>
            }
          >
            <img
              src={request.profileImage}
              alt={`${request.username}'s profile`}
              class="h-12 w-12 rounded-full object-cover shadow-xs"
              onError={(e) => {
                // Fallback to gradient avatar if image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div class="flex hidden h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-primary-600 shadow-xs">
              <span class="font-semibold text-white">
                {(request.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          </Show>

          {/* User details */}
          <div>
            <a
              target={`_blank`}
              href={'/' + props.request.username}
              class="flex items-center justify-start gap-2 truncate text-sm font-semibold text-fg underline hover:text-accent-500"
            >
              {props.request.username || 'Unknown User'}{' '}
              <FaSolidArrowUpRightFromSquare />
            </a>
            <Show when={request.twitchLogin}>
              <p class="text-xs text-fg-muted">Twitch: {request.twitchLogin}</p>
            </Show>
          </div>
        </div>

        {/* Action buttons */}
        <div class="flex items-center gap-2">
          {/* Accept button */}
          <button
            type="button"
            onClick={() => handleAcceptRequest(request.userId)}
            disabled={isAcceptingFriendRequest() || isDecliningFriendRequest()}
            class="flex items-center gap-1 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white shadow-xs outline-hidden transition-all duration-200 hover:bg-success-600 hover:shadow-md focus:ring-2 focus:ring-success focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Accept friend request from ${request.username}`}
          >
            <FaSolidCheck class="h-4 w-4" />
            {isAcceptingFriendRequest() ? 'Accepting...' : 'Accept'}
          </button>

          {/* Decline button */}
          <button
            type="button"
            onClick={handleDeclineClick}
            disabled={isAcceptingFriendRequest() || isDecliningFriendRequest()}
            class="flex items-center gap-1 rounded-lg bg-black/10 px-4 py-2 text-sm font-medium text-fg-muted shadow-xs outline-hidden transition-all duration-200 hover:bg-black/15 hover:shadow-md focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Decline friend request from ${request.username}`}
          >
            <FaSolidXmark class="h-4 w-4" />
            {isDecliningFriendRequest() ? 'Declining...' : 'Decline'}
          </button>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={declineRequestDialog.isOpen()}
        onOpenChange={declineRequestDialog.setOpen}
        title="Decline Friend Request"
        text={`Are you sure you want to decline the friend request from ${request.username}? This action cannot be undone.`}
        onConfirm={handleConfirmDecline}
        onCancel={declineRequestDialog.close}
      />
    </>
  )
}

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center px-4 py-12">
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-primary-600 shadow-lg">
      <FaSolidUserPlus class="h-8 w-8 text-white" />
    </div>
    <h3 class="mb-2 text-xl font-semibold text-fg">
      No pending friend requests
    </h3>
    <p class="mb-6 max-w-md text-center leading-relaxed text-fg-muted">
      You don't have any pending friend requests at the moment. When someone
      sends you a friend request, it will appear here.
    </p>
  </div>
)

const LoadingSkeleton = () => (
  <div class="space-y-4">
    <div class="h-16 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
    <div class="h-16 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
    <div class="h-16 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
  </div>
)

/**
 * FriendRequestsList Component
 *
 * Displays incoming friend requests with accept/decline functionality.
 * Enhanced with sophisticated request cards, better action UX, and engaging empty states.
 */
export const FriendRequestsList: Component = () => {
  const {
    friendRequests,
    isLoadingFriendRequests,
    hasFriendRequestsError,
    friendRequestsErrorMessage,
    hasAcceptFriendRequestError,
    hasDeclineFriendRequestError,
    acceptFriendRequestErrorMessage,
    declineFriendRequestErrorMessage,
  } = useFriends()

  const hasRequests = () => friendRequests().length > 0

  return (
    <div class="mt-6">
      <div class="mb-4 flex items-center gap-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-fg">
          <FaSolidUserPlus class="h-4 w-4 text-primary" />
          Friend Requests
        </h3>
      </div>

      {/* Error messages */}
      <Show when={hasAcceptFriendRequestError()}>
        <div class="mb-4 rounded-xl border border-danger-200 bg-danger-50 p-4">
          <div class="flex items-center gap-3 text-danger-600">
            <FaSolidCircleExclamation class="h-4 w-4 shrink-0" />
            <p class="text-sm font-medium">
              {acceptFriendRequestErrorMessage() ||
                'Failed to accept friend request'}
            </p>
          </div>
        </div>
      </Show>

      <Show when={hasDeclineFriendRequestError()}>
        <div class="mb-4 rounded-xl border border-danger-200 bg-danger-50 p-4">
          <div class="flex items-center gap-3 text-danger-600">
            <FaSolidCircleExclamation class="h-4 w-4 shrink-0" />
            <p class="text-sm font-medium">
              {declineFriendRequestErrorMessage() ||
                'Failed to decline friend request'}
            </p>
          </div>
        </div>
      </Show>

      <Switch>
        <Match when={isLoadingFriendRequests()}>
          <LoadingSkeleton />
        </Match>

        <Match when={hasFriendRequestsError()}>
          <div class="rounded-xl border border-danger-200 bg-danger-50 p-6">
            <div class="flex items-center justify-center gap-3 text-danger-600">
              <svg
                class="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p class="text-sm font-semibold">
                  Error loading friend requests
                </p>
                <p class="text-xs opacity-90">
                  {friendRequestsErrorMessage() || 'Unknown error occurred'}
                </p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={!hasRequests()}>
          <EmptyState />
        </Match>

        <Match when={hasRequests()}>
          <div class="space-y-3">
            <For each={friendRequests()}>
              {(request) => <FriendRequestsListItem request={request} />}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  )
}
