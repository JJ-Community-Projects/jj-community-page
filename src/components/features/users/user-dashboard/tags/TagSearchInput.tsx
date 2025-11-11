import { type Component, For, Match, Show, Switch } from "solid-js";
import { useTags } from "./UserTagsProvider.tsx";
import { FaSolidMagnifyingGlass, FaSolidXmark, FaSolidCircleInfo, FaSolidUsers } from "solid-icons/fa";

/**
 * TagSearchInput Component
 *
 * Provides a search input field for finding tags with enhanced UX.
 * Features modern design with icons, clear functionality, and improved styling.
 */
export const TagSearchInput: Component = () => {
  const {
    searchInput,
    debouncedInput,
    availableTags,
    isLoadingTags,
    hasTagsError,
    availableTagsError,
    userTags,
    canAddTag,
    handleSelectTag,
    handleSearchInput,
  } = useTags();

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    handleSearchInput(target.value);
  };

  const clearSearch = () => {
    handleSearchInput("");
  };

  const showSuggestions = () => searchInput().length > 0;

  return (
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaSolidMagnifyingGlass class="w-4 h-4 text-accent-600" />
          Search Tags
        </h3>
        <Show when={isLoadingTags() && searchInput().length > 0}>
          <span class="flex items-center gap-2 rounded-full bg-accent/10 px-2 py-1">
            <span class="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden="true"></span>
            <span class="sr-only">Searching…</span>
          </span>
        </Show>
      </div>

      <div class="relative">
        {/* Search icon */}
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <FaSolidMagnifyingGlass class="w-5 h-5 text-gray-400 transition-colors duration-200" />
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
          placeholder="Search for tags..."
          value={searchInput()}
          onInput={handleInput}
          aria-label="Search for tags"
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

        {/* Suggestions dropdown */}
        <Show when={showSuggestions()}>
          <div class="absolute left-0 right-0 mt-2 z-20 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
            <div class="max-h-64 overflow-y-auto">
              <Switch>
                <Match when={hasTagsError()}>
                  <div class="p-3 text-sm text-danger-600">
                    {availableTagsError() || 'Error loading suggestions'}
                  </div>
                </Match>
                <Match when={isLoadingTags()}>
                  <div class="p-3 text-sm text-gray-500">Searching…</div>
                </Match>
                <Match when={(availableTags()?.length ?? 0) === 0 && debouncedInput().length > 0}>
                  <div class="p-3 text-sm text-gray-500">No results for "{debouncedInput()}"</div>
                </Match>
                <Match when={(availableTags()?.length ?? 0) > 0}>
                  <ul class="py-1">
                    <For each={availableTags().slice(0, 8)}>{(tag) => {
                      const userHasTag = () => userTags().some((ut) => ut.tagId === tag.id);
                      const disabled = () => userHasTag() || !canAddTag();
                      return (
                        <li>
                          <button
                            type="button"
                            // onMouseDown to avoid input blur preventing click in some browsers
                            onMouseDown={(e) => handleSelectTag(e as unknown as Event, tag.id)}
                            disabled={disabled()}
                            class={`w-full text-left px-4 py-2 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors ${disabled() ? 'cursor-not-allowed text-gray-400' : 'text-gray-800'}`}
                            aria-disabled={disabled()}
                            aria-label={`${userHasTag() ? 'Already added:' : !canAddTag() ? 'Tag limit reached:' : 'Add tag:'} ${tag.name}`}
                            style={!disabled() ? { color: tag.color } : {}}
                          >
                            <span class="font-medium truncate">{tag.name}</span>
                            <span class="flex items-center gap-1 text-xs text-gray-500">
                              <FaSolidUsers class="h-3 w-3" />
                              {tag.totalUsage}
                            </span>
                          </button>
                        </li>
                      );
                    }}</For>
                  </ul>
                </Match>
              </Switch>
            </div>
          </div>
        </Show>

        {/* Focus ring enhancement */}
        <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/5 to-accent/10 opacity-0 transition-opacity duration-300 pointer-events-none peer-focus:opacity-100"></div>
      </div>

      {/* Helper text */}
      <div class="mt-3 flex items-start gap-2">
        <FaSolidCircleInfo class="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
        <div class="text-xs text-gray-500 space-y-1">
          <p>Search for specific tags to add to your profile.</p>
          {searchInput().length > 0 && (
            <p class="text-accent-600 font-medium">
              Searching for "{searchInput()}"...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
