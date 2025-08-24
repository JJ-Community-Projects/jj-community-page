import {type Component, For, Match, Show, Switch} from "solid-js";
import {useFriends} from "./UserFriendsProvider.tsx";
import {FaSolidCircleExclamation, FaSolidPaperPlane, FaSolidXmark} from "solid-icons/fa";

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
  request: SentFriendRequest;
}

const SentFriendRequestItem: Component<SentFriendRequestItemProps> = (props) => {
  const {
    handleCancelFriendRequest,
    isCancellingFriendRequest
  } = useFriends();

  const handleCancelRequest = async () => {
    try {
      await handleCancelFriendRequest(props.request.userId);
    } catch (error) {
      console.error('Failed to cancel friend request:', error);
    }
  };

  return (
    <div
      class="group relative flex items-center bg-white rounded-xl p-4 shadow-md border-2 border-orange-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-orange-300">
      <div class="flex items-center justify-between w-full">
        {/* User info */}
        <div class="flex items-center gap-3">
          {/* Avatar */}
          <Show
            when={props.request.profileImage && props.request.profileImage.trim() !== ''}
            fallback={
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
                <span class="text-white font-semibold">
                  {(props.request.username || 'U')[0].toUpperCase()}
                </span>
              </div>
            }
          >
            <img
              src={props.request.profileImage}
              alt={`${props.request.username}'s profile`}
              class="w-12 h-12 rounded-full object-cover shadow-sm"
              onError={(e) => {
                // Fallback to gradient avatar if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm hidden">
              <span class="text-white font-semibold">
                {(props.request.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          </Show>

          {/* User details */}
          <div>
            <p class="font-semibold text-gray-800">
              {props.request.username || 'Unknown User'}
            </p>
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
            onClick={handleCancelRequest}
            disabled={isCancellingFriendRequest()}
            class="
            px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
            bg-gray-200 text-gray-700 hover:bg-red-200 hover:text-red-700 shadow-sm hover:shadow-md
            focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-1
          "
            aria-label={`Cancel friend request to ${props.request.username}`}
          >
            <FaSolidXmark class="w-4 h-4"/>
            {isCancellingFriendRequest() ? 'Cancelling...' : 'Cancel'}
          </button>
        </div>
      </div>

      {/* Subtle hover effect */}
      <div
        class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-orange-500"></div>
    </div>
  );
}

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
      <FaSolidPaperPlane class="w-8 h-8 text-white" />
    </div>
    <h3 class="text-xl font-semibold text-gray-800 mb-2">No sent friend requests</h3>
    <p class="text-gray-600 text-center max-w-md mb-6 leading-relaxed">
      You haven't sent any friend requests yet. Search for users above and send friend requests to start connecting.
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
    cancelFriendRequestErrorMessage
  } = useFriends();

  const hasRequests = () => sentFriendRequests().length > 0;

  return (
    <div class="mt-6">
      <div class="flex items-center gap-3 mb-4">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaSolidPaperPlane class="w-4 h-4 text-orange-600" />
          Sent Friend Requests
        </h3>
      </div>

      {/* Error messages */}
      <Show when={hasCancelFriendRequestError()}>
        <div class="bg-red-50 rounded-xl p-4 border border-red-200 mb-4">
          <div class="flex items-center gap-3 text-red-600">
            <FaSolidCircleExclamation class="w-4 h-4 flex-shrink-0" />
            <p class="text-sm font-medium">{cancelFriendRequestErrorMessage() || "Failed to cancel friend request"}</p>
          </div>
        </div>
      </Show>

      <Switch>
        <Match when={isLoadingSentFriendRequests()}>
          <LoadingSkeleton />
        </Match>

        <Match when={hasSentFriendRequestsError()}>
          <div class="bg-red-50 rounded-xl p-6 border border-red-200">
            <div class="flex items-center justify-center gap-3 text-red-600">
              <FaSolidCircleExclamation class="w-5 h-5 flex-shrink-0" />
              <div>
                <p class="font-semibold text-sm">Error loading sent friend requests</p>
                <p class="text-xs opacity-90">{sentFriendRequestsErrorMessage() || "Unknown error occurred"}</p>
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
              {(request) => (
                <SentFriendRequestItem
                  request={request}
                />
              )}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  );
};
