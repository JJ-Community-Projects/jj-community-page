import {type Component, For, Show} from "solid-js";
import {useAdminTeamDetail} from "./AdminTeamDetailsProvider.tsx";
import {FaSolidCircleInfo, FaSolidMagnifyingGlass, FaSolidUserPlus, FaSolidXmark} from "solid-icons/fa";
import {useUserSearch} from "../../../../../../lib/useUserSearch";

/**
 * AdminTeamInviteSearchInput Component
 *
 * Provides a search input field for finding users to invite to the team with enhanced UX.
 * Features modern design with icons, search results, and improved styling.
 */
export const AdminTeamInviteSearchInput: Component = () => {
  const {
    inviteUser,
    inviteUserMutation
  } = useAdminTeamDetail();

  const userSearch = useUserSearch();

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    userSearch.handleSearchInput(target.value);
  };

  const clearSearch = () => {
    userSearch.clear();
  };

  const searchResults = () => userSearch.results();
  const isLoadingSearch = () => userSearch.isLoading();
  const hasSearchError = () => userSearch.hasError();

  // Handle invite
  const handleInvite = async (userId: number) => {
    try {
      await inviteUser(userId);
      clearSearch();
    } catch (err) {
      console.error("Invite error:", err);
      // Error is handled by the mutation state
    }
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center gap-2 mb-3">
        <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaSolidUserPlus class="w-4 h-4 text-accent"/>
          Invite Users
        </h4>
      </div>

      <div class="relative">
        {/* Search icon / Loading spinner */}
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {(isLoadingSearch() || userSearch.searchInput().length > 0) && userSearch.searchInput().length > 0 ? (
            <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FaSolidMagnifyingGlass class="w-5 h-5 text-gray-400 transition-colors duration-200"/>
          )}
        </div>

        {/* Search input */}
        <input
          type="text"
          class="
            w-full pl-12 pr-12 py-3 rounded-xl border-2 border-gray-200
            focus:border-accent focus:ring-4 focus:ring-accent/20
            transition-all duration-300 outline-none
            bg-white/50 backdrop-blur-sm hover:bg-white/70
            placeholder-gray-500 text-gray-800 font-medium
            shadow-sm hover:shadow-md focus:shadow-lg
          "
          placeholder="Search for users to invite..."
          value={userSearch.searchInput()}
          onInput={handleInput}
          aria-label="Search for users to invite"
        />

        {/* Clear button */}
        {userSearch.searchInput().length > 0 && (
          <button
            type="button"
            onClick={clearSearch}
            class="
              absolute inset-y-0 right-0 pr-4 flex items-center
              text-gray-400 hover:text-gray-600 transition-colors duration-200
              focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white
              outline-none rounded-full p-1
            "
            aria-label="Clear search"
          >
            <FaSolidXmark class="w-5 h-5"/>
          </button>
        )}
      </div>

      {/* Error Message */}
      <Show when={inviteUserMutation.isError}>
        <div class="bg-danger-50 rounded-xl p-4 border border-danger-200">
          <div class="flex items-center gap-3 text-danger-600">
            <FaSolidXmark class="w-4 h-4 flex-shrink-0"/>
            <p class="text-sm font-medium">{inviteUserMutation.failureReason?.message || "Failed to invite user"}</p>
          </div>
        </div>
      </Show>

      <Show when={hasSearchError()}>
        <div class="bg-danger-50 rounded-xl p-4 border border-danger-200">
          <div class="flex items-center gap-3 text-danger-600">
            <FaSolidXmark class="w-4 h-4 flex-shrink-0"/>
            <p class="text-sm font-medium">{userSearch.errorMessage()}</p>
          </div>
        </div>
      </Show>

      {/* Search Results */}
      <Show when={searchResults().length > 0}>
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm max-h-60 overflow-y-auto">
          <div class="p-3 border-b border-gray-200">
            <p class="text-sm font-medium text-gray-700">Search Results</p>
          </div>
          <div class="divide-y divide-gray-100">
            <For each={searchResults()}>
              {(result) => (
                <div class="p-3 hover:bg-gray-50 transition-colors duration-150">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      {/* Avatar placeholder */}
                      <div
                        class="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-sm flex-shrink-0">
                        <span class="text-white font-semibold text-xs">
                          {(result.tiltifyUsername || 'U')[0].toUpperCase()}
                        </span>
                      </div>

                      {/* User info */}
                      <div class="min-w-0">
                        <p class="font-medium text-gray-800 text-sm truncate">
                          {result.tiltifyUsername || 'Unknown User'}
                        </p>
                        {result.twitchUsername && (
                          <p class="text-xs text-gray-600 truncate">
                            Twitch: {result.twitchUsername}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Invite button */}
                    <button
                      class="
                        flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200
                        bg-accent-50 hover:bg-accent-100 text-accent-700 hover:text-accent-800
                        border border-accent-200 hover:border-accent-300
                        focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white
                        outline-none hover:shadow-sm active:scale-95
                        disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium
                      "
                      onClick={() => handleInvite(result.userId)}
                      disabled={inviteUserMutation.isPending}
                      aria-label={`Invite ${result.tiltifyUsername} to team`}
                    >
                      {inviteUserMutation.isPending ? (
                        <>
                          <div
                            class="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                          <span>Inviting...</span>
                        </>
                      ) : (
                        <>
                          <FaSolidUserPlus class="w-3 h-3"/>
                          <span>Invite</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Helper text */}
      <div class="flex items-start gap-2">
        <FaSolidCircleInfo class="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0"/>
        <div class="text-xs text-gray-500 space-y-1">
          <p>Search for users by their username to send team invitations.</p>
          {userSearch.searchInput().length > 0 && (
            <p class="text-accent-600 font-medium">
              {isLoadingSearch() ? `Searching for "${userSearch.searchInput()}"...` : `Showing results for "${userSearch.searchInput()}"`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
