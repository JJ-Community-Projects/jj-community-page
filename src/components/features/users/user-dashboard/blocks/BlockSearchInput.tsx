import { type Component } from 'solid-js'
import { useBlocks } from './UserBlockProvider.tsx'
import {
  FaSolidCircleInfo,
  FaSolidMagnifyingGlass,
  FaSolidUserSlash,
  FaSolidXmark,
} from 'solid-icons/fa'

/**
 * BlockSearchInput Component
 *
 * Provides a search input field for finding users to block with enhanced UX.
 * Features modern design with red theme, icons, clear functionality, and improved styling.
 */
export const BlockSearchInput: Component = () => {
  const { searchInput, handleSearchInput, isLoadingSearch } = useBlocks()

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    handleSearchInput(target.value)
  }

  const clearSearch = () => {
    handleSearchInput('')
  }

  return (
    <div class="mb-6">
      <div class="mb-3 flex items-center gap-2">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FaSolidUserSlash class="h-4 w-4 text-danger" />
          Find Users to Block
        </h3>
      </div>

      <div class="relative">
        {/* Search icon / Loading spinner */}
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          {(isLoadingSearch() || searchInput().length > 0) &&
          searchInput().length > 0 ? (
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-danger border-t-transparent"></div>
          ) : (
            <FaSolidMagnifyingGlass class="h-5 w-5 text-gray-400 transition-colors duration-200" />
          )}
        </div>

        {/* Search input */}
        <input
          type="text"
          class="w-full rounded-xl border-2 border-gray-200 bg-white/50 py-3 pl-12 pr-12 font-medium text-gray-800 placeholder-gray-500 shadow-sm outline-none backdrop-blur-sm transition-all duration-300 hover:bg-white/70 hover:shadow-md focus:border-danger focus:shadow-lg focus:ring-4 focus:ring-danger/20"
          placeholder="Search for users to block..."
          value={searchInput()}
          onInput={handleInput}
          aria-label="Search for users to block"
        />

        {/* Clear button */}
        {searchInput().length > 0 && (
          <button
            type="button"
            onClick={clearSearch}
            class="absolute inset-y-0 right-0 flex items-center rounded-full p-1 pr-4 text-gray-400 outline-none transition-colors duration-200 hover:text-gray-600 focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-white"
            aria-label="Clear search"
          >
            <FaSolidXmark class="h-5 w-5" />
          </button>
        )}

        {/* Focus ring enhancement */}
        <div class="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-danger/5 to-danger-600/10 opacity-0 transition-opacity duration-300 peer-focus:opacity-100"></div>
      </div>

      {/* Helper text */}
      <div class="mt-3 flex items-start gap-2">
        <FaSolidCircleInfo class="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-400" />
        <div class="space-y-1 text-xs text-gray-500">
          {searchInput().length > 0 && (
            <p class="font-medium text-danger-600">
              {isLoadingSearch()
                ? `Searching for "${searchInput()}"...`
                : `Preparing search for "${searchInput()}"...`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
