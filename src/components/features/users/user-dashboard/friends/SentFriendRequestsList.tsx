import { type Component, For, Match, Show, Switch } from 'solid-js'
import { useFriends } from './UserFriendsProvider.tsx'
import {
  FaSolidArrowUpRightFromSquare,
  FaSolidCircleExclamation,
  FaSolidPaperPlane,
  FaSolidXmark,
} from 'solid-icons/fa'
import { createModalSignal } from '../../../../../lib/createModalSignal.ts'
import { ConfirmationDialog } from '../../../../common/dialogs/ConfirmationDialog.tsx'

interface SentFriendRequest {
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

interface SentFriendRequestItemProps {
  request: SentFriendRequest
}

const SentFriendRequestItem: Component<SentFriendRequestItemProps> = (
  props,
) => {
  const { handleCancelFriendRequest, isCancellingFriendRequest } = useFriends()

  const cancelRequestDialog = createModalSignal()

  const handleCancelClick = () => {
    cancelRequestDialog.open()
  }

  const handleConfirmCancel = async () => {
    try {
      await handleCancelFriendRequest(props.request.userId)
      cancelRequestDialog.close()
    } catch (error) {
      console.error('Failed to cancel friend request:', error)
    }
  }

  return (
    <>
      <div class="group flex items-center justify-between rounded-xl border-2 border-accent-200 bg-white p-4 shadow-md transition-all duration-300">
        {/* User info */}
        <div class="flex items-center gap-3">
          {/* Avatar */}
          <Show
            when={
              props.request.profileImage &&
              props.request.profileImage.trim() !== ''
            }
            fallback={
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 shadow-sm">
                <span class="font-semibold text-white">
                  {(props.request.username || 'U')[0].toUpperCase()}
                </span>
              </div>
            }
          >
            <img
              src={props.request.profileImage}
              alt={`${props.request.username}'s profile`}
              class="h-12 w-12 rounded-full object-cover shadow-sm"
              onError={(e) => {
                // Fallback to gradient avatar if image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div class="flex hidden h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 shadow-sm">
              <span class="font-semibold text-white">
                {(props.request.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          </Show>

          {/* User details */}
          <div>
            <a
              target={`_blank`}
              href={'/' + props.request.username}
              class="flex items-center justify-start gap-2 truncate text-sm font-semibold text-gray-800 underline hover:text-accent-500"
            >
              {props.request.username || 'Unknown User'}{' '}
              <FaSolidArrowUpRightFromSquare />
            </a>
            <Show when={props.request.twitchLogin}>
              <p class="text-xs text-gray-600">
                Twitch: {props.request.twitchLogin}
              </p>
            </Show>
          </div>
        </div>

        {/* Cancel button */}
        <div class="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={isCancellingFriendRequest()}
            class="flex items-center gap-1 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm outline-none transition-all duration-200 hover:bg-red-200 hover:text-red-700 hover:shadow-md focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Cancel friend request to ${props.request.username}`}
          >
            <FaSolidXmark class="h-4 w-4" />
            {isCancellingFriendRequest() ? 'Cancelling...' : 'Cancel'}
          </button>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={cancelRequestDialog.isOpen()}
        onOpenChange={cancelRequestDialog.setOpen}
        title="Cancel Friend Request"
        text={`Are you sure you want to cancel your friend request to ${props.request.username}? This action cannot be undone.`}
        onConfirm={handleConfirmCancel}
        onCancel={cancelRequestDialog.close}
      />
    </>
  )
}

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center px-4 py-12">
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 shadow-lg">
      <FaSolidPaperPlane class="h-8 w-8 text-white" />
    </div>
    <h3 class="mb-2 text-xl font-semibold text-gray-800">
      No sent friend requests
    </h3>
    <p class="mb-6 max-w-md text-center leading-relaxed text-gray-600">
      You haven't sent any friend requests yet. Search for users above and send
      friend requests to start connecting.
    </p>
  </div>
)

const LoadingSkeleton = () => (
  <div class="space-y-4">
    <div class="h-16 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
    <div class="h-16 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
    <div class="h-16 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
  </div>
)

/**
 * SentFriendRequestsList Component
 *
 * Displays outgoing friend requests with cancel functionality.
 * Enhanced with sophisticated request cards, better action UX, and engaging empty states.
 */
export const SentFriendRequestsList: Component = () => {
  const {
    sentFriendRequests,
    isLoadingSentFriendRequests,
    hasSentFriendRequestsError,
    sentFriendRequestsErrorMessage,
    hasCancelFriendRequestError,
    cancelFriendRequestErrorMessage,
  } = useFriends()

  const hasRequests = () => sentFriendRequests().length > 0

  return (
    <div class="mt-6">
      <div class="mb-4 flex items-center gap-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FaSolidPaperPlane class="h-4 w-4 text-accent" />
          Sent Friend Requests
        </h3>
      </div>

      {/* Error messages */}
      <Show when={hasCancelFriendRequestError()}>
        <div class="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <div class="flex items-center gap-3 text-red-600">
            <FaSolidCircleExclamation class="h-4 w-4 flex-shrink-0" />
            <p class="text-sm font-medium">
              {cancelFriendRequestErrorMessage() ||
                'Failed to cancel friend request'}
            </p>
          </div>
        </div>
      </Show>

      <Switch>
        <Match when={isLoadingSentFriendRequests()}>
          <LoadingSkeleton />
        </Match>

        <Match when={hasSentFriendRequestsError()}>
          <div class="rounded-xl border border-red-200 bg-red-50 p-6">
            <div class="flex items-center justify-center gap-3 text-red-600">
              <FaSolidCircleExclamation class="h-5 w-5 flex-shrink-0" />
              <div>
                <p class="text-sm font-semibold">
                  Error loading sent friend requests
                </p>
                <p class="text-xs opacity-90">
                  {sentFriendRequestsErrorMessage() || 'Unknown error occurred'}
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
            <For each={sentFriendRequests()}>
              {(request) => <SentFriendRequestItem request={request} />}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  )
}
