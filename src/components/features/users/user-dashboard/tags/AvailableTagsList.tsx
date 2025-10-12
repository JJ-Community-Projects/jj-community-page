import { type Component, For, Match, Show, Switch } from 'solid-js'
import { useTags } from './UserTagsProvider.tsx'
import {
  FaSolidCircleExclamation,
  FaSolidMagnifyingGlass,
  FaSolidTag,
  FaSolidUsers,
} from 'solid-icons/fa'

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
    availableTagsError,
    canAddTag,
    canAddTagToUser,
  } = useTags()

  const hasTags = () => availableTags().length > 0

  const StatusIndicator = () => (
    <div class="flex items-center gap-1">
      <Switch>
        <Match when={isLoadingTags()}>
          <div class="flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-100 to-accent-200 px-3 py-1.5 shadow-sm">
            <div class="h-2 w-2 animate-pulse rounded-full bg-accent"></div>
            <span class="text-xs font-medium text-accent-700">Loading</span>
          </div>
        </Match>
        <Match when={hasTagsError()}>
          <div class="flex items-center gap-2 rounded-full bg-gradient-to-r from-danger-100 to-danger-200 px-3 py-1.5 shadow-sm">
            <div class="h-2 w-2 rounded-full bg-danger-500"></div>
            <span class="text-xs font-medium text-danger-700">Error</span>
          </div>
        </Match>
      </Switch>
    </div>
  )

  const TagSkeleton = () => (
    <div class="h-10 w-24 animate-pulse rounded-lg bg-neutral-200 shadow-sm"></div>
  )

  const EmptyState = () => (
    <div class="flex flex-col items-center justify-center px-4 py-8">
      <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600">
        <FaSolidMagnifyingGlass class="h-6 w-6 text-white" />
      </div>
      <h4 class="mb-1 text-sm font-semibold text-gray-700">
        {debouncedInput().length > 0
          ? 'No matching tags found'
          : 'No tags available'}
      </h4>
      <p class="max-w-sm text-center text-xs text-gray-500">
        {debouncedInput().length > 0
          ? `Try adjusting your search term or browse categories above.`
          : 'Check back later for available tags to add to your profile.'}
      </p>
    </div>
  )

  return (
    <div class="mb-6">
      <div class="mb-4 flex items-center gap-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FaSolidTag class="h-4 w-4 text-accent-600" />
          {debouncedInput().length > 0 ? 'Search Results' : 'Popular Tags'}
        </h3>
        <StatusIndicator />
        {/* Tag limit indicator similar to OwnedTeamsList header */}
        <Show when={canAddTagToUser.data}>
          {(data) => (
            <div class="rounded-full bg-gradient-to-r from-accent-100 to-accent-200 px-3 py-1">
              <span class="text-xs font-medium text-accent-700">
                {data().tags}/{data().maxTags}
              </span>
            </div>
          )}
        </Show>
      </div>

      <Switch fallback={<EmptyState />}>
        <Match when={hasTagsError()}>
          <div class="rounded-xl border border-danger-200 bg-danger-50 p-6">
            <div class="flex items-center justify-center gap-3 text-danger-600">
              <FaSolidCircleExclamation class="h-5 w-5 flex-shrink-0" />
              <div>
                <p class="text-sm font-semibold">Error loading tags</p>
                <p class="text-xs opacity-90">
                  {availableTagsError() || 'Unknown error occurred'}
                </p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={isLoadingTags() && !hasTags()}>
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

        <Match when={!isLoadingTags() && !hasTags()}>
          <div class="flex flex-col items-center justify-center px-4 py-8">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600">
              <FaSolidMagnifyingGlass class="h-6 w-6 text-white" />
            </div>
            <h4 class="mb-1 text-sm font-semibold text-gray-700">
              No tags available
            </h4>
            <p class="max-w-sm text-center text-xs text-gray-400">
              Need help with tags? Contact{' '}
              <span class="font-medium text-accent-600">Ostof</span> on Discord.
            </p>
          </div>
        </Match>

        <Match when={hasTags()}>
          <div class="grid grid-cols-1 ~gap-3/4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <For each={availableTags()}>
              {(tag) => {
                const userHasTag = () =>
                  userTags().some((ut) => ut.tagId === tag.id)
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
                        <span class="mt-1 text-xs opacity-70">
                          Already added
                        </span>
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
