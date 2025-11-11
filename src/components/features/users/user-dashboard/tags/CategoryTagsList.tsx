import { type Component, For, Match, Show, Switch } from 'solid-js'
import { useTags } from './UserTagsProvider.tsx'
import { FaSolidCircleExclamation, FaSolidFolderOpen, FaSolidTag, FaSolidUsers } from 'solid-icons/fa'

/**
 * CategoryTagsList Component (merged)
 *
 * Combines category selection (pills) and the list of tags within the selected category.
 * Selecting a category shows all tags in that category below. This does not affect search results.
 */
export const CategoryTagsList: Component = () => {
  const {
    // Category selection state
    categories,
    selectedCategoryIds,
    isLoadingCategories,
    hasCategoriesError,
    handleToggleCategory,
    categoriesError,

    // Category tags state
    categoryTags,
    isLoadingCategoryTags,
    hasCategoryTagsError,
    categoryTagsError,
    selectedCategory,

    // Tag selection
    handleSelectTag,
    canAddTag,
    userTags,
  } = useTags()

  const hasCategories = () => categories().length > 0
  const hasCategory = () => !!selectedCategory()
  const hasTags = () => (categoryTags()?.length ?? 0) > 0

  const TagSkeleton = () => (
    <div class="h-10 w-28 animate-pulse rounded-lg bg-neutral-200 shadow-sm"></div>
  )

  const CategoriesStatusIndicator = () => (
    <div class="flex items-center gap-1">
      <Switch>
        <Match when={isLoadingCategories()}>
          <div class="flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-100 to-accent-200 px-3 py-1.5 shadow-sm">
            <div class="h-2 w-2 animate-pulse rounded-full bg-accent"></div>
            <span class="text-xs font-medium text-accent-700">Loading</span>
          </div>
        </Match>
        <Match when={hasCategoriesError()}>
          <div class="flex items-center gap-2 rounded-full bg-gradient-to-r from-danger-100 to-danger-200 px-3 py-1.5 shadow-sm">
            <div class="h-2 w-2 rounded-full bg-danger-500"></div>
            <span class="text-xs font-medium text-danger-700">Error</span>
          </div>
        </Match>
      </Switch>
    </div>
  )

  return (
    <div class="mb-6">
      {/* Category selection (merged from TagCategorySelection) */}
      <div class="mb-4 flex items-center gap-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FaSolidTag class="h-4 w-4 text-accent-600" />
          Browse by Category
        </h3>
        <CategoriesStatusIndicator />
      </div>

      <Switch fallback={
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
          No categories available
        </div>
      }>
        <Match when={hasCategoriesError()}>
          <div class="rounded-lg border border-danger-200 bg-danger-50 p-4">
            <p class="text-center text-sm text-danger-600 flex items-center justify-center gap-2">
              <FaSolidCircleExclamation class="h-4 w-4" />
              Error loading categories: {categoriesError() || 'Unknown error'}
            </p>
          </div>
        </Match>

        <Match when={isLoadingCategories() && !hasCategories()}>
          <div class="flex flex-wrap gap-2">
            <div class="h-8 w-24 animate-pulse rounded-full bg-neutral-200"></div>
            <div class="h-8 w-32 animate-pulse rounded-full bg-neutral-200"></div>
            <div class="h-8 w-20 animate-pulse rounded-full bg-neutral-200"></div>
            <div class="h-8 w-28 animate-pulse rounded-full bg-neutral-200"></div>
          </div>
        </Match>

        <Match when={hasCategories()}>
          <div class="mb-6 flex flex-wrap gap-2">
            <For each={categories()}>
              {(category) => {
                const isSelected = () => selectedCategoryIds().includes(category.id)
                return (
                  <button
                    type="button"
                    onClick={() => handleToggleCategory(category.id)}
                    class={`rounded-md px-3 py-1.5 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
                      isSelected()
                        ? 'bg-accent text-white border-accent-600'
                        : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                    }`}
                    aria-pressed={isSelected()}
                    aria-label={`${isSelected() ? 'Remove' : 'Add'} ${category.name} filter`}
                  >
                    <span class="flex items-center gap-2">
                      {category.name}
                      <span class={`text-xs ${isSelected() ? 'opacity-90' : 'opacity-70'}`}>({category.tagCount})</span>
                    </span>
                  </button>
                )
              }}
            </For>
          </div>
        </Match>
      </Switch>

      {/* Selected category header and tags grid */}
      <div class="mb-4 flex items-center gap-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FaSolidFolderOpen class="h-4 w-4 text-accent-600" />
          Tags in Category
        </h3>
        <Show when={selectedCategory()}>
          {(cat) => (
            <span class="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent-700">
              {cat()?.name}
            </span>
          )}
        </Show>
      </div>

      <Switch>
        <Match when={!hasCategory()}>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
            Select a single category above to browse all its tags.
          </div>
        </Match>

        <Match when={hasCategory() && hasCategoryTagsError()}>
          <div class="rounded-xl border border-danger-200 bg-danger-50 p-6">
            <div class="flex items-center justify-center gap-3 text-danger-600">
              <FaSolidCircleExclamation class="h-5 w-5 flex-shrink-0" />
              <div>
                <p class="text-sm font-semibold">Error loading tags</p>
                <p class="text-xs opacity-90">{categoryTagsError() || 'Unknown error occurred'}</p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={hasCategory() && isLoadingCategoryTags()}>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <TagSkeleton />
            <TagSkeleton />
            <TagSkeleton />
            <TagSkeleton />
            <TagSkeleton />
            <TagSkeleton />
            <TagSkeleton />
            <TagSkeleton />
          </div>
        </Match>

        <Match when={hasCategory() && !isLoadingCategoryTags() && !hasTags()}>
          <div class="flex flex-col items-center justify-center px-4 py-8">
            <div class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600">
              <FaSolidTag class="h-5 w-5 text-white" />
            </div>
            <p class="text-sm font-medium text-gray-700">No tags in this category</p>
            <p class="text-xs text-gray-500">Try a different category.</p>
          </div>
        </Match>

        <Match when={hasCategory() && hasTags()}>
          <div class="grid grid-cols-1 ~gap-3/4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <For each={categoryTags()}>
              {(tag) => {
                const userHasTag = () => userTags().some((ut) => ut.tagId === tag.id)
                return (
                  <button
                    type="button"
                    onClick={(e) => handleSelectTag(e, tag.id)}
                    disabled={userHasTag() || !canAddTag()}
                    class={`relative rounded-full border px-3 py-2 text-sm font-medium outline-none transition-colors duration-200 ease-out focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                      userHasTag() || !canAddTag()
                        ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                        : 'bg-white hover:bg-gray-50'
                    } `}
                    style={
                      !userHasTag() && canAddTag()
                        ? {
                            'border-color': tag.color,
                            color: tag.color,
                          }
                        : {}
                    }
                    aria-label={`${userHasTag() ? 'Already added:' : !canAddTag() ? 'Tag limit reached:' : 'Add tag:'} ${tag.name}`}
                    aria-pressed={userHasTag()}
                    aria-disabled={userHasTag() || !canAddTag()}
                  >
                    <div class="flex flex-col items-center text-center">
                      <span class="mb-1 font-semibold">{tag.name}</span>
                      <span class="flex items-center gap-1 text-xs opacity-80">
                        <FaSolidUsers class="h-3 w-3" />
                        {tag.totalUsage} users
                      </span>
                      {userHasTag() && (
                        <span class="mt-1 text-xs opacity-70">Already added</span>
                      )}
                    </div>
                  </button>
                )
              }}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  )
}
