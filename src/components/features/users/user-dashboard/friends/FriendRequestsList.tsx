import {type Component, For, Match, Show, Switch} from "solid-js";
import {useFriends} from "./UserFriendsProvider.tsx";
import {FaSolidCheck, FaSolidCircleExclamation, FaSolidUserPlus, FaSolidXmark} from "solid-icons/fa";
import {createModalSignal} from "../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../common/dialogs/ConfirmationDialog.tsx";

interface FriendRequestsListItemProps {
  request:  {
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

export const FriendRequestsListItem: Component<FriendRequestsListItemProps> = (props) => {
  const request = props.request

  const {
    handleAcceptFriendRequest,
    isAcceptingFriendRequest,
    isDecliningFriendRequest,
    handleDeclineFriendRequest,
  } = useFriends();

  const declineRequestDialog = createModalSignal();

  const handleAcceptRequest = async (fromUserId: number) => {
    try {
      await handleAcceptFriendRequest(fromUserId);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleDeclineClick = () => {
    declineRequestDialog.open();
  };

  const handleConfirmDecline = async () => {
    try {
      await handleDeclineFriendRequest(props.request.userId);
      declineRequestDialog.close();
    } catch (error) {
      console.error('Failed to decline friend request:', error);
    }
  };

  return (
    <div class="group relative flex items-center bg-white rounded-xl p-4 shadow-md border-2 border-primary-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-300">
      <div class="flex items-center justify-between w-full">
        {/* User info */}
        <div class="flex items-center gap-3">
          {/* Avatar */}
          <Show
            when={request.profileImage && request.profileImage.trim() !== ''}
            fallback={
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                <span class="text-white font-semibold">
                  {(request.username || 'U')[0].toUpperCase()}
                </span>
              </div>
            }
          >
            <img
              src={request.profileImage}
              alt={`${request.username}'s profile`}
              class="w-12 h-12 rounded-full object-cover shadow-sm"
              onError={(e) => {
                // Fallback to gradient avatar if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm hidden">
              <span class="text-white font-semibold">
                {(request.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          </Show>

          {/* User details */}
          <div>
            <p class="font-semibold text-gray-800">
              {request.username || 'Unknown User'}
            </p>
            <Show when={request.twitchLogin}>
              <p class="text-xs text-gray-600">
                Twitch: {request.twitchLogin}
              </p>
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
            class="
                          px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                          bg-success text-white hover:bg-success-600 shadow-sm hover:shadow-md
                          focus:ring-2 focus:ring-success focus:ring-offset-2 focus:ring-offset-white outline-none
                          disabled:opacity-50 disabled:cursor-not-allowed
                          flex items-center gap-1
                        "
            aria-label={`Accept friend request from ${request.username}`}
          >
            <FaSolidCheck class="w-4 h-4" />
            {isAcceptingFriendRequest() ? 'Accepting...' : 'Accept'}
          </button>

          {/* Decline button */}
          <button
            type="button"
            onClick={handleDeclineClick}
            disabled={isAcceptingFriendRequest() || isDecliningFriendRequest()}
            class="
                          px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                          bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-sm hover:shadow-md
                          focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-white outline-none
                          disabled:opacity-50 disabled:cursor-not-allowed
                          flex items-center gap-1
                        "
            aria-label={`Decline friend request from ${request.username}`}
          >
            <FaSolidXmark class="w-4 h-4" />
            {isDecliningFriendRequest() ? 'Declining...' : 'Decline'}
          </button>
        </div>
      </div>

      {/* Subtle hover effect */}
      <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-primary-500"></div>

      <ConfirmationDialog
        isOpen={declineRequestDialog.isOpen()}
        onOpenChange={declineRequestDialog.setOpen}
        title="Decline Friend Request"
        text={`Are you sure you want to decline the friend request from ${request.username}? This action cannot be undone.`}
        onConfirm={handleConfirmDecline}
        onCancel={declineRequestDialog.close}
      />
    </div>
  );
}

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
      <FaSolidUserPlus class="w-8 h-8 text-white" />
    </div>
    <h3 class="text-xl font-semibold text-gray-800 mb-2">No pending friend requests</h3>
    <p class="text-gray-600 text-center max-w-md mb-6 leading-relaxed">
      You don't have any pending friend requests at the moment. When someone sends you a friend request, it will appear here.
    </p>
  </div>
);

const LoadingSkeleton = () => (
  <div class="space-y-4">
    <div class="animate-pulse bg-gray-200 rounded-xl h-16 shadow-sm"></div>
    <div class="animate-pulse bg-gray-200 rounded-xl h-16 shadow-sm"></div>
    <div class="animate-pulse bg-gray-200 rounded-xl h-16 shadow-sm"></div>
  </div>
);

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
    declineFriendRequestErrorMessage
  } = useFriends();

  const hasRequests = () => friendRequests().length > 0;

  return (
    <div class="mt-6">
      <div class="flex items-center gap-3 mb-4">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaSolidUserPlus class="w-4 h-4 text-primary" />
          Friend Requests
        </h3>
      </div>

      {/* Error messages */}
      <Show when={hasAcceptFriendRequestError()}>
        <div class="bg-red-50 rounded-xl p-4 border border-red-200 mb-4">
          <div class="flex items-center gap-3 text-red-600">
            <FaSolidCircleExclamation class="w-4 h-4 flex-shrink-0" />
            <p class="text-sm font-medium">{acceptFriendRequestErrorMessage() || "Failed to accept friend request"}</p>
          </div>
        </div>
      </Show>

      <Show when={hasDeclineFriendRequestError()}>
        <div class="bg-red-50 rounded-xl p-4 border border-red-200 mb-4">
          <div class="flex items-center gap-3 text-red-600">
            <FaSolidCircleExclamation class="w-4 h-4 flex-shrink-0" />
            <p class="text-sm font-medium">{declineFriendRequestErrorMessage() || "Failed to decline friend request"}</p>
          </div>
        </div>
      </Show>

      <Switch>
        <Match when={isLoadingFriendRequests()}>
          <LoadingSkeleton />
        </Match>

        <Match when={hasFriendRequestsError()}>
          <div class="bg-red-50 rounded-xl p-6 border border-red-200">
            <div class="flex items-center justify-center gap-3 text-red-600">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="font-semibold text-sm">Error loading friend requests</p>
                <p class="text-xs opacity-90">{friendRequestsErrorMessage() || "Unknown error occurred"}</p>
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
              {(request) => (
                <FriendRequestsListItem request={request} />
              )}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  );
};
