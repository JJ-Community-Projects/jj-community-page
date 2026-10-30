import { type Component, For, Match, Show, Switch } from 'solid-js'
import { FaSolidFolderOpen } from 'solid-icons/fa'
import { useTags } from './UserTagsProvider.tsx'
import { TagPick, tagGrid } from './TagPick.tsx'
import { Section } from '../../../../ui/Tile'
import { Alert, EmptyState, Skeleton } from '../../../../ui/Status'
import { Chip } from '../../../../ui/Labels'
import { cn, focusRing } from '../../../../ui/cn'

/**
 * Category chips; picking one lists all its tags below. This does not affect the search.
 */
export const CategoryTagsList: Component = () => {
  const {
    categories,
    selectedCategoryIds,
    isLoadingCategories,
    hasCategoriesError,
    handleToggleCategory,
    categoriesError,
    categoryTags,
    isLoadingCategoryTags,
    hasCategoryTagsError,
    categoryTagsError,
    selectedCategory,
  } = useTags()

  const hasCategories = () => categories().length > 0
  const hasCategory = () => !!selectedCategory()
  const hasTags = () => (categoryTags()?.length ?? 0) > 0

  return (
    <Section level={3} title="Browse by Category" icon={<FaSolidFolderOpen />}>
      <div class="flex flex-col gap-3">
        <Switch
          fallback={
            <p class="text-fg-muted text-sm">No categories available</p>
          }
        >
          <Match when={hasCategoriesError()}>
            <Alert tone="danger" title="Error loading categories">
              {categoriesError() || 'Unknown error'}
            </Alert>
          </Match>
          <Match when={isLoadingCategories() && !hasCategories()}>
            <div class="flex flex-wrap gap-2">
              <Skeleton class="h-8 w-24 rounded-full" />
              <Skeleton class="h-8 w-32 rounded-full" />
              <Skeleton class="h-8 w-20 rounded-full" />
              <Skeleton class="h-8 w-28 rounded-full" />
            </div>
          </Match>
          <Match when={hasCategories()}>
            <div class="flex flex-wrap gap-1.5">
              <For each={categories()}>
                {(category) => {
                  const isSelected = () =>
                    selectedCategoryIds().includes(category.id)
                  return (
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(category.id)}
                      class={cn(
                        focusRing,
                        'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 transition-colors',
                        isSelected()
                          ? 'bg-accent ring-accent text-white'
                          : 'bg-surface-strong text-fg ring-line-strong hover:bg-surface',
                      )}
                      aria-pressed={isSelected()}
                      aria-label={`${isSelected() ? 'Remove' : 'Add'} ${category.name} filter`}
                    >
                      {category.name}
                      <span class="text-xs opacity-75">
                        {category.tagCount}
                      </span>
                    </button>
                  )
                }}
              </For>
            </div>
          </Match>
        </Switch>

        <div class="flex min-h-6 items-center gap-2">
          <h4 class="text-sm font-semibold">Tags in Category</h4>
          <Show when={selectedCategory()}>
            {(cat) => (
              <Chip tone="accent" size="sm">
                {cat().name}
              </Chip>
            )}
          </Show>
        </div>

        <Switch>
          <Match when={!hasCategory()}>
            <p class="text-fg-muted text-sm">
              Select a single category above to browse all its tags.
            </p>
          </Match>
          <Match when={hasCategoryTagsError()}>
            <Alert tone="danger" title="Error loading tags">
              {categoryTagsError() || 'Unknown error occurred'}
            </Alert>
          </Match>
          <Match when={isLoadingCategoryTags()}>
            <div class={tagGrid}>
              <For each={Array(6)}>{() => <Skeleton class="h-9" />}</For>
            </div>
          </Match>
          <Match when={!hasTags()}>
            <EmptyState title="No tags in this category" class="py-3">
              Try a different category.
            </EmptyState>
          </Match>
          <Match when={hasTags()}>
            <div class={tagGrid}>
              <For each={categoryTags()}>
                {(tag) => <TagPick tag={tag} />}
              </For>
            </div>
          </Match>
        </Switch>
      </div>
    </Section>
  )
}
