import {type Component, For, Match, Switch} from "solid-js";
import {useTags} from "./UserTagsProvider.tsx";
import {FaSolidCheck, FaSolidCircleExclamation, FaSolidMagnifyingGlass, FaSolidTag, FaSolidUsers} from "solid-icons/fa";

/**
 * AvailableTagsList Component
 *
 * Displays available tags (popular or search results) with selection functionality.
 * Enhanced with interactive tag cards, shimmer animations, and improved loading states.
 */
export const AvailableTagsList: Component = () => {
  const {
    availableTags,
    userTags,
    isLoadingTags,
    hasTagsError,
    debouncedInput,
    handleSelectTag,
    availableTagsError
  } = useTags();

  const hasTags = () => availableTags().length > 0;

  const StatusIndicator = () => (
    <div class="flex items-center gap-1">
      <Switch>
        <Match when={isLoadingTags()}>
          <div
            class="flex items-center gap-2 bg-gradient-to-r from-accent-100 to-accent-200 px-3 py-1.5 rounded-full shadow-sm">
            <div class="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span class="text-accent-700 text-xs font-medium">Loading</span>
          </div>
        </Match>
        <Match when={hasTagsError()}>
          <div
            class="flex items-center gap-2 bg-gradient-to-r from-danger-100 to-danger-200 px-3 py-1.5 rounded-full shadow-sm">
            <div class="w-2 h-2 bg-danger-500 rounded-full"></div>
            <span class="text-danger-700 text-xs font-medium">Error</span>
          </div>
        </Match>
      </Switch>
    </div>
  );

  const TagSkeleton = () => (
    <div class="animate-pulse bg-neutral-200 rounded-lg h-10 w-24 shadow-sm"></div>
  );

  const EmptyState = () => (
    <div class="flex flex-col items-center justify-center py-8 px-4">
      <div
        class="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center mb-3">
        <FaSolidMagnifyingGlass class="w-6 h-6 text-white"/>
      </div>
      <h4 class="text-sm font-semibold text-gray-700 mb-1">
        {debouncedInput().length > 0 ? 'No matching tags found' : 'No tags available'}
      </h4>
      <p class="text-xs text-gray-500 text-center max-w-sm">
        {debouncedInput().length > 0
          ? `Try adjusting your search term or browse categories above.`
          : 'Check back later for available tags to add to your profile.'
        }
      </p>
    </div>
  );

  return (
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-4">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaSolidTag class="w-4 h-4 text-accent-600"/>
          {debouncedInput().length > 0 ? 'Search Results' : 'Popular Tags'}
        </h3>
        <StatusIndicator/>
      </div>

      <Switch fallback={<EmptyState/>}>
        <Match when={hasTagsError()}>
          <div class="bg-danger-50 rounded-xl p-6 border border-danger-200">
            <div class="flex items-center justify-center gap-3 text-danger-600">
              <FaSolidCircleExclamation class="w-5 h-5 flex-shrink-0"/>
              <div>
                <p class="font-semibold text-sm">Error loading tags</p>
                <p class="text-xs opacity-90">{availableTagsError() || "Unknown error occurred"}</p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={isLoadingTags() && !hasTags()}>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <TagSkeleton/>
            <TagSkeleton/>
            <TagSkeleton/>
            <TagSkeleton/>
            <TagSkeleton/>
            <TagSkeleton/>
            <TagSkeleton/>
            <TagSkeleton/>
          </div>
        </Match>

        <Match when={!isLoadingTags() && !hasTags()}>
          <div class="flex flex-col items-center justify-center py-8 px-4">
            <div
              class="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center mb-3">
              <FaSolidMagnifyingGlass class="w-6 h-6 text-white"/>
            </div>
            <h4 class="text-sm font-semibold text-gray-700 mb-1">No tags available</h4>
            <p class="text-xs text-gray-400 text-center max-w-sm">
              Need help with tags? Contact <span class="font-medium text-accent-600">Ostof</span> on Discord.
            </p>
          </div>
        </Match>

        <Match when={hasTags()}>
          <div class="grid grid-cols-1 ~gap-3/4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <For each={availableTags()}>
              {(tag) => {
                const userHasTag = () => userTags().some(ut => ut.tagId === tag.id);
                return (
                  <button
                    type="button"
                    onClick={(e) => handleSelectTag(e, tag.id)}
                    disabled={userHasTag()}
                    class={`
                      group relative overflow-hidden rounded-xl px-4 py-3 text-sm font-medium
                      shadow-md hover:shadow-lg hover:scale-[1.02] 
                      transition-all duration-300 ease-out transform
                      focus:ring-2 focus:ring-accent focus:ring-offset-2 
                      active:scale-[0.98] outline-none
                      ${userHasTag()
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60'
                      : 'text-white'
                    }
                    `}
                    style={!userHasTag() ? {
                      'background': `linear-gradient(135deg, ${tag.color}, ${tag.color}cc)`,
                      'box-shadow': `0 4px 20px ${tag.color}40`
                    } : {}}
                    aria-label={`${userHasTag() ? 'Already added:' : 'Add tag:'} ${tag.name}`}
                    aria-pressed={userHasTag()}
                  >
                    <div class="relative z-10 flex flex-col items-center text-center">
                      <span class="font-semibold mb-1">{tag.name}</span>
                      <span class="text-xs opacity-80 flex items-center gap-1">
                        <FaSolidUsers class="w-3 h-3"/>
                        {tag.totalUsage} users
                      </span>
                      {userHasTag() && (
                        <span class="text-xs mt-1 opacity-70">Already added</span>
                      )}
                    </div>

                    {/* Shimmer effect for non-disabled tags */}
                    {!userHasTag() && (
                      <div
                        class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    )}

                    {/* Added indicator */}
                    {userHasTag() && (
                      <div
                        class="absolute top-2 right-2 w-4 h-4 bg-success-500 rounded-full flex items-center justify-center">
                        <FaSolidCheck class="w-2.5 h-2.5 text-white"/>
                      </div>
                    )}
                  </button>
                );
              }}
            </For>
          </div>
        </Match>
      </Switch>

      {/* Results summary */}
      {hasTags() && !isLoadingTags() && (
        <div class="mt-4 text-center">
          <p class="text-xs text-gray-500">
            Showing {availableTags().length} {availableTags().length === 1 ? 'tag' : 'tags'}
            {debouncedInput().length > 0 && ` matching "${debouncedInput()}"`}
          </p>
        </div>
      )}
    </div>
  );
};
