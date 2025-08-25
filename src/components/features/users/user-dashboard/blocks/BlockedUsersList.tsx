import {type Component, For, Match, Show, Switch} from "solid-js";
import {useBlocks} from "./UserBlockProvider.tsx";
import {FaSolidCircleExclamation, FaSolidUserSlash, FaSolidXmark} from "solid-icons/fa";

interface BlockedUser {
  userId: number;
  primaryLiveStream: string;
  role: string;
  createdAt: Date;
  username: string;
  profileImage: string;
  twitchLogin: string | null;
  tiltifySlug: string;
  tiltifyUrl: string;
  primaryColor: string | null;
  accentColor: string | null;
}

interface BlockedUserItemProps {
  user: BlockedUser;
}

const BlockedUserItem: Component<BlockedUserItemProps> = (props) => {

  const {
    handleUnblockUser,
    isUnblockingUser,
  } = useBlocks();

  const handleUnblockLocal = async () => {
    try {
      await handleUnblockUser(props.user.userId);
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  };

  return (
    <div
      class="group relative flex items-center bg-white rounded-xl p-4 shadow-md border-2 border-danger-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-danger-300">
      <div class="flex items-center gap-3 flex-1">
        {/* Avatar */}
        <Show
          when={props.user.profileImage && props.user.profileImage.trim() !== ''}
          fallback={
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-danger-500 to-danger-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <span class="text-white font-semibold text-sm">
                {(props.user.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          }
        >
          <img
            src={props.user.profileImage}
            alt={`${props.user.username}'s profile`}
            class="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0"
            onError={(e) => {
              // Fallback to gradient avatar if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-danger-500 to-danger-600 flex items-center justify-center shadow-sm flex-shrink-0 hidden">
            <span class="text-white font-semibold text-sm">
              {(props.user.username || 'U')[0].toUpperCase()}
            </span>
          </div>
        </Show>

        {/* User info */}
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-800 text-sm block truncate">
            {props.user.username || 'Unknown User'}
          </p>
          <Show when={props.user.twitchLogin}>
            <p class="text-xs text-gray-600 opacity-80 block truncate">
              Twitch: {props.user.twitchLogin}
            </p>
          </Show>
        </div>

        {/* Unblock button */}
        <button
          type="button"
          onClick={handleUnblockLocal}
          disabled={isUnblockingUser()}
          class="
          flex-shrink-0 px-3 py-2 rounded-lg transition-all duration-200
          bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-sm hover:shadow-md
          focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-white outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2 text-sm font-medium
        "
          aria-label={`Unblock ${props.user.username}`}
          title="Unblock user"
        >
          <FaSolidXmark class="w-4 h-4"/>
          {isUnblockingUser() ? 'Unblocking...' : 'Unblock'}
        </button>
      </div>

      {/* Subtle hover effect */}
      <div
        class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-danger-500"></div>

    </div>
  );
}

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div
      class="w-16 h-16 bg-gradient-to-br from-danger-500 to-danger-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
      <FaSolidUserSlash class="w-8 h-8 text-white"/>
    </div>
    <h3 class="text-xl font-semibold text-gray-800 mb-2">No blocked users</h3>
    <p class="text-gray-600 text-center max-w-md mb-6 leading-relaxed">
      You haven't blocked anyone yet. Use the search above to find users to block.
    </p>
  </div>
);

const LoadingSkeleton = () => (
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <div class="animate-pulse bg-gray-200 rounded-xl h-16 shadow-sm"></div>
    <div class="animate-pulse bg-gray-200 rounded-xl h-16 shadow-sm"></div>
    <div class="animate-pulse bg-gray-200 rounded-xl h-16 shadow-sm"></div>
  </div>
);

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
    unblockErrorMessage
  } = useBlocks();

  const hasBlockedUsers = () => blockedUsers().length > 0;

  return (
    <div class="mt-6">
      <div class="flex items-center gap-3 mb-4">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaSolidUserSlash class="w-4 h-4 text-danger"/>
          Blocked Users
        </h3>
      </div>

      {/* Error messages */}
      <Show when={hasUnblockError()}>
        <div class="bg-red-50 rounded-xl p-4 border border-red-200 mb-4">
          <div class="flex items-center gap-3 text-red-600">
            <FaSolidCircleExclamation class="w-4 h-4 flex-shrink-0"/>
            <p class="text-sm font-medium">{unblockErrorMessage() || "Failed to unblock user"}</p>
          </div>
        </div>
      </Show>

      <Switch>
        <Match when={isLoadingBlockedUsers()}>
          <LoadingSkeleton/>
        </Match>

        <Match when={hasBlockedUsersError()}>
          <div class="bg-red-50 rounded-xl p-6 border border-red-200">
            <div class="flex items-center justify-center gap-3 text-red-600">
              <FaSolidCircleExclamation class="w-5 h-5 flex-shrink-0"/>
              <div>
                <p class="font-semibold text-sm">Error loading blocked users</p>
                <p class="text-xs opacity-90">{blockedUsersErrorMessage() || "Unknown error occurred"}</p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={!hasBlockedUsers()}>
          <EmptyState/>
        </Match>

        <Match when={hasBlockedUsers()}>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ~gap-3/4">
            <For each={blockedUsers()}>
              {(user) => (
                <BlockedUserItem
                  user={user}
                />
              )}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  );
};
