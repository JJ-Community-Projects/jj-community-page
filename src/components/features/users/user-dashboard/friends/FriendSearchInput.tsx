import {type Component} from "solid-js";
import {useFriends} from "./UserFriendsProvider.tsx";
import { FaSolidUsers, FaSolidMagnifyingGlass, FaSolidXmark, FaSolidCircleInfo } from "solid-icons/fa";

/**
 * FriendSearchInput Component
 *
 * Provides a search input field for finding users to add as friends with enhanced UX.
 * Features modern design with icons, clear functionality, and improved styling.
 */
export const FriendSearchInput: Component = () => {
  const {
    searchInput,
    handleSearchInput,
    isLoadingSearch
  } = useFriends();
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    handleSearchInput(target.value);
  };

  const clearSearch = () => {
    handleSearchInput("");
  };

  return (
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaSolidUsers class="w-4 h-4 text-accent" />
          Find Friends
        </h3>
      </div>

      <div class="relative">
        {/* Search icon / Loading spinner */}
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {(isLoadingSearch() || searchInput().length > 0) && searchInput().length > 0 ? (
            <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FaSolidMagnifyingGlass class="w-5 h-5 text-gray-400 transition-colors duration-200" />
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
          placeholder="Search for users to add as friends..."
          value={searchInput()}
          onInput={handleInput}
          aria-label="Search for users to add as friends"
        />

        {/* Clear button */}
        {searchInput().length > 0 && (
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
            <FaSolidXmark class="w-5 h-5" />
          </button>
        )}

        {/* Focus ring enhancement */}
        <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/5 to-accent/10 opacity-0 transition-opacity duration-300 pointer-events-none peer-focus:opacity-100"></div>
      </div>

      {/* Helper text */}
      <div class="mt-3 flex items-start gap-2">
        <FaSolidCircleInfo class="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
        <div class="text-xs text-gray-500 space-y-1">
          <p>Search for users by their username to send friend requests.</p>
          {searchInput().length > 0 && (
            <p class="text-accent-600 font-medium">
              {isLoadingSearch() ? `Searching for "${searchInput()}"...` : `Preparing search for "${searchInput()}"...`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
