import {type Component, For, Match, Show, Switch} from "solid-js";
import {useBlocks} from "./UserBlockProvider.tsx";
import { FaSolidUsers, FaSolidMagnifyingGlass, FaSolidCircleExclamation, FaSolidUserSlash, FaSolidBan } from "solid-icons/fa";

const StatusIndicator = () => {
  const {
    isLoadingSearch,
    hasSearchError,
  } = useBlocks();
  return (
    <div class="flex items-center gap-1">
      <Switch>
        <Match when={isLoadingSearch()}>
          <div
            class="flex items-center gap-2 bg-gradient-to-r from-danger-100 to-danger-200 px-3 py-1.5 rounded-full shadow-sm">
            <div class="w-2 h-2 bg-danger rounded-full animate-pulse"></div>
            <span class="text-danger-700 text-xs font-medium">Searching</span>
          </div>
        </Match>
        <Match when={hasSearchError()}>
          <div
            class="flex items-center gap-2 bg-gradient-to-r from-danger-100 to-danger-200 px-3 py-1.5 rounded-full shadow-sm">
            <div class="w-2 h-2 bg-danger-500 rounded-full"></div>
            <span class="text-danger-700 text-xs font-medium">Error</span>
          </div>
        </Match>
      </Switch>
    </div>
  )
}

const UserSkeleton = () => (
  <div class="animate-pulse bg-gray-200 rounded-lg h-16 w-full shadow-sm"></div>
);

/**
 * AvailableUsersToBlockList Component
 *
 * Displays search results for users with block functionality.
 * Enhanced with interactive user cards, red theme for blocking, and improved loading states.
 */
export const AvailableUsersToBlockList: Component = () => {
  const {
    searchResults,
    isLoadingSearch,
    hasSearchError,
    debouncedInput,
    handleBlockUser,
    searchErrorMessage,
    isBlockingUser,
    hasBlockError,
    blockErrorMessage,
    blockedUsers,
  } = useBlocks();

  const hasUsers = () => searchResults().length > 0;

  const EmptyState = () => (
    <div class="flex flex-col items-center justify-center py-8 px-4">
      <div
        class="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mb-3">
        <FaSolidUsers class="w-6 h-6 text-white" />
      </div>
      <h4 class="text-sm font-semibold text-gray-700 mb-1">
        {debouncedInput().length > 0 ? 'No users found' : 'Start searching'}
      </h4>
      <p class="text-xs text-gray-500 text-center max-w-sm">
        {debouncedInput().length > 0
          ? `No users found matching "${debouncedInput()}". Try a different search term.`
          : 'Enter a username above to search for users to block.'
        }
      </p>
    </div>
  );

  // Check if user is already blocked
  const isAlreadyBlocked = (userId: number) => {
    return blockedUsers().some(user => user.userId === userId);
  };

  const handleBlockRequest = async (userId: number) => {
    try {
      await handleBlockUser(userId);
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  return (
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-4">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaSolidMagnifyingGlass class="w-4 h-4 text-danger" />
          Search Results
        </h3>
        <StatusIndicator/>
      </div>

      {/* Error messages */}
      <Show when={hasBlockError()}>
        <div class="bg-red-50 rounded-xl p-4 border border-red-200 mb-4">
          <div class="flex items-center gap-3 text-red-600">
            <FaSolidCircleExclamation class="w-4 h-4 flex-shrink-0" />
            <p class="text-sm font-medium">{blockErrorMessage() || "Failed to block user"}</p>
          </div>
        </div>
      </Show>

      <Switch fallback={<EmptyState/>}>
        <Match when={hasSearchError()}>
          <div class="bg-red-50 rounded-xl p-6 border border-red-200">
            <div class="flex items-center justify-center gap-3 text-red-600">
              <FaSolidCircleExclamation class="w-5 h-5 flex-shrink-0" />
              <div>
                <p class="font-semibold text-sm">Error searching users</p>
                <p class="text-xs opacity-90">{searchErrorMessage() || "Unknown error occurred"}</p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={isLoadingSearch() && !hasUsers()}>
          <div class="space-y-3">
            <UserSkeleton/>
            <UserSkeleton/>
            <UserSkeleton/>
            <UserSkeleton/>
          </div>
        </Match>

        <Match when={hasUsers()}>
          <div class="space-y-3">
            <For each={searchResults()}>
              {(user) => {
                const isAlreadyBlockedVal = () => isAlreadyBlocked(user.userId);
                const canBlockUser = () => !isAlreadyBlockedVal() && !isBlockingUser();

                return (
                  <div
                    class="group relative overflow-hidden rounded-xl p-4 bg-white shadow-md border-2 border-danger-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-danger-300">
                    <div class="flex items-center justify-between">
                      {/* User info */}
                      <div class="flex items-center gap-3">
                        {/* Avatar placeholder */}
                        <div
                          class="w-10 h-10 rounded-full bg-gradient-to-br from-danger-500 to-danger-600 flex items-center justify-center shadow-sm">
                          <span class="text-white font-semibold text-sm">
                            {(user.tiltifyUsername || user.twitchUsername || 'U')[0].toUpperCase()}
                          </span>
                        </div>

                        {/* User details */}
                        <div>
                          <p class="font-semibold text-gray-800 text-sm">
                            {user.tiltifyUsername || user.twitchUsername || 'Unknown User'}
                          </p>
                          <Show when={user.twitchUsername && user.tiltifyUsername}>
                            <p class="text-xs text-gray-600">
                              Twitch: {user.twitchUsername}
                            </p>
                          </Show>
                        </div>
                      </div>

                      {/* Action button */}
                      <button
                        type="button"
                        onClick={() => handleBlockRequest(user.userId)}
                        disabled={!canBlockUser() || isBlockingUser()}
                        class={`
                          px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                          focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-white outline-none
                          flex items-center gap-2
                          ${canBlockUser() && !isBlockingUser()
                          ? 'bg-danger text-white hover:bg-danger-600 shadow-sm hover:shadow-md'
                          : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        }
                        `}
                        aria-label={`${canBlockUser() ? 'Block' : 'Cannot block'} ${user.tiltifyUsername || user.twitchUsername}`}
                      >
                        <FaSolidBan class="w-4 h-4" />
                        {(() => {
                          if (isBlockingUser()) return 'Blocking...';
                          if (isAlreadyBlockedVal()) return 'Already Blocked';
                          return 'Block User';
                        })()}
                      </button>
                    </div>

                    {/* Status indicators */}
                    <Show when={isAlreadyBlockedVal()}>
                      <div
                        class="absolute top-2 right-2 w-4 h-4 bg-danger rounded-full flex items-center justify-center">
                        <FaSolidUserSlash class="w-2.5 h-2.5 text-white" />
                      </div>
                    </Show>

                    {/* Subtle hover effect */}
                    <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-danger-500"></div>
                  </div>
                );
              }}
            </For>
          </div>
        </Match>
      </Switch>

      {/* Results summary */}
      <Show when={hasUsers() && !isLoadingSearch()}>
        <div class="mt-4 text-center">
          <p class="text-xs text-gray-500">
            Showing {searchResults().length} {searchResults().length === 1 ? 'user' : 'users'} matching
            "{debouncedInput()}"
          </p>
        </div>
      </Show>
    </div>
  );
};
