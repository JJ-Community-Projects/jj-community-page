import {type Component, For, Match, Switch} from "solid-js";
import {useTags} from "./UserTagsProvider.tsx";
import {FaSolidTag, FaSolidCircleExclamation, FaSolidCircleInfo} from "solid-icons/fa";

/**
 * TagCategorySelection Component
 *
 * Displays available tag categories with selection functionality for filtering.
 * Enhanced with modern pill design, improved status indicators, and better interactions.
 */
export const TagCategorySelection: Component = () => {
  const {
    categories,
    selectedCategoryIds,
    isLoadingCategories,
    hasCategoriesError,
    handleToggleCategory,
    categoriesError
  } = useTags();

  const hasCategories = () => categories().length > 0;

  const StatusIndicator = () => (
    <div class="flex items-center gap-1">
      <Switch>
        <Match when={isLoadingCategories()}>
          <div class="flex items-center gap-2 bg-gradient-to-r from-accent-100 to-accent-200 px-3 py-1.5 rounded-full shadow-sm">
            <div class="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span class="text-accent-700 text-xs font-medium">Loading</span>
          </div>
        </Match>
        <Match when={hasCategoriesError()}>
          <div class="flex items-center gap-2 bg-gradient-to-r from-danger-100 to-danger-200 px-3 py-1.5 rounded-full shadow-sm">
            <div class="w-2 h-2 bg-danger-500 rounded-full"></div>
            <span class="text-danger-700 text-xs font-medium">Error</span>
          </div>
        </Match>
      </Switch>
    </div>
  );

  return (
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-4">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaSolidTag class="w-4 h-4 text-accent-600" />
          Filter by Category
        </h3>
        <StatusIndicator />
      </div>

      <Switch fallback={
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p class="text-sm text-gray-500 text-center">No categories available</p>
        </div>
      }>
        <Match when={hasCategoriesError()}>
          <div class="bg-danger-50 rounded-lg p-4 border border-danger-200">
            <p class="text-sm text-danger-600 text-center flex items-center justify-center gap-2">
              <FaSolidCircleExclamation class="w-4 h-4" />
              Error loading categories: {categoriesError() || "Unknown error"}
            </p>
          </div>
        </Match>

        <Match when={isLoadingCategories() && !hasCategories()}>
          <div class="flex flex-wrap gap-2">
            {/* Skeleton loading state */}
            <div class="animate-pulse bg-neutral-200 rounded-full h-8 w-24"></div>
            <div class="animate-pulse bg-neutral-200 rounded-full h-8 w-32"></div>
            <div class="animate-pulse bg-neutral-200 rounded-full h-8 w-20"></div>
            <div class="animate-pulse bg-neutral-200 rounded-full h-8 w-28"></div>
          </div>
        </Match>

        <Match when={hasCategories()}>
          <div class="flex flex-wrap gap-2">
            <For each={categories()}>
              {(category) => {
                const isSelected = () => selectedCategoryIds().includes(category.id);
                return (
                  <button
                    type="button"
                    onClick={() => handleToggleCategory(category.id)}
                    class={`
                      group relative overflow-hidden rounded-full px-4 py-2 text-sm font-medium
                      transition-all duration-300 transform hover:scale-105 active:scale-95
                      focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white outline-none
                      ${isSelected() 
                        ? 'bg-accent text-white hover:bg-accent-600 shadow-sm hover:shadow-md focus:ring-accent' 
                        : 'bg-white border-2 border-accent-200 hover:border-accent-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                    style={isSelected() ? {
                      'background': `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
                      'box-shadow': `0 4px 15px ${category.color}30`
                    } : {}}
                    aria-pressed={isSelected()}
                    aria-label={`${isSelected() ? 'Remove' : 'Add'} ${category.name} filter`}
                  >
                    <span class="relative z-10 flex items-center gap-2">
                      {category.name}
                      <span class={`text-xs ${isSelected() ? 'opacity-90' : 'opacity-70'}`}>
                        ({category.tagCount})
                      </span>
                    </span>
                    {isSelected() && (
                      <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    )}
                  </button>
                );
              }}
            </For>
          </div>
        </Match>
      </Switch>

      {/* Helper text */}
      <p class="text-xs text-gray-500 mt-3 flex items-center gap-1">
        <FaSolidCircleInfo class="w-3 h-3" />
        Select categories to filter available tags. Leave all unselected to see all tags.
      </p>
    </div>
  );
};
