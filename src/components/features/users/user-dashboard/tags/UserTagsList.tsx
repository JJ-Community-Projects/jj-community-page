import { type Component, For, Match, Show, Switch } from 'solid-js'
import { useTags } from './UserTagsProvider.tsx'
import { FaSolidCircleExclamation, FaSolidTag, FaSolidUser, FaSolidXmark, } from 'solid-icons/fa'

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center px-4 py-12">
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
      <FaSolidTag class="h-8 w-8 text-white" />
    </div>
    <h3 class="mb-2 text-xl font-semibold text-gray-800">No tags added yet</h3>
    <p class="mb-4 max-w-md text-center leading-relaxed text-gray-600">
      Start building your profile by selecting tags that represent your
      interests, games, or causes. This helps viewers discover and connect with
      your content.
    </p>
    <div class="flex items-center gap-2 font-medium text-accent">
      <span class="text-sm">Browse available tags above</span>
      <svg
        class="h-4 w-4 animate-bounce"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </div>
  </div>
)

const LoadingSkeleton = () => (
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div class="h-16 animate-pulse rounded-xl bg-neutral-200 shadow-sm"></div>
    <div class="h-16 animate-pulse rounded-xl bg-neutral-200 shadow-sm"></div>
    <div class="h-16 animate-pulse rounded-xl bg-neutral-200 shadow-sm"></div>
  </div>
)

/**
 * UserTagsList Component
 *
 * Displays the user's current tags with removal functionality.
 * Enhanced with sophisticated tag cards, better removal UX, and engaging empty states.
 */
export const UserTagsList: Component = () => {
  const {
    userTags,
    isLoadingUserTags,
    hasUserTagsError,
    handleRemoveTag,
    userTagsError,
    canAddTagToUser,
  } = useTags()

  const hasTags = () => userTags().length > 0
  const needsMoreTags = () => userTags().length < 4

  return (
    <div class="mt-6">
      <div class="mb-4 flex items-center gap-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FaSolidUser class="h-4 w-4 text-primary" />
          <Show when={canAddTagToUser.data} fallback={<>Your Tags</>}>
            {(data) => (
              <>
                Your Tags ({data().tags}/{data().maxTags})
              </>
            )}
          </Show>
        </h3>
      </div>

      <Switch>
        <Match when={isLoadingUserTags()}>
          <LoadingSkeleton />
        </Match>

        <Match when={hasUserTagsError()}>
          <div class="rounded-xl border border-danger-200 bg-danger-50 p-6">
            <div class="flex items-center justify-center gap-3 text-danger-600">
              <FaSolidCircleExclamation class="h-5 w-5 flex-shrink-0" />
              <div>
                <p class="text-sm font-semibold">Error loading your tags</p>
                <p class="text-xs opacity-90">
                  {userTagsError() || 'Unknown error occurred'}
                </p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={!hasTags()}>
          <EmptyState />
        </Match>

        <Match when={hasTags()}>
          <div class="grid grid-cols-1 ~gap-3/4 sm:grid-cols-2 lg:grid-cols-3">
            <For each={userTags()}>
              {(userTag) => (
                <div
                  class="group relative flex items-center rounded-xl border-2 bg-white p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    'border-color': userTag.tag.color,
                    background: `linear-gradient(135deg, ${userTag.tag.color}08, ${userTag.tag.color}15)`,
                  }}
                >
                  <div class="flex flex-1 items-center gap-3">
                    {/* Color indicator */}
                    <div
                      class="h-4 w-4 flex-shrink-0 rounded-full shadow-sm"
                      style={{ 'background-color': userTag.tag.color }}
                    ></div>

                    {/* Tag info */}
                    <div class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-semibold text-gray-800">
                        {userTag.tag.name}
                      </span>
                      {userTag.tag.description && (
                        <span class="block truncate text-xs text-gray-600 opacity-80">
                          {userTag.tag.description}
                        </span>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(userTag.tagId)}
                      class="flex-shrink-0 rounded-full p-2 opacity-70 outline-none transition-all duration-200 group-hover:opacity-100 hover:scale-110 hover:bg-danger-100 focus:bg-danger-100 focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 focus:ring-offset-white active:scale-95"
                      aria-label={`Remove ${userTag.tag.name} tag`}
                      title="Remove tag"
                    >
                      <FaSolidXmark class="h-4 w-4 text-danger-500 hover:text-danger-600" />
                    </button>
                  </div>

                  {/* Subtle hover effect */}
                  <div
                    class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-5"
                    style={{ 'background-color': userTag.tag.color }}
                  ></div>
                </div>
              )}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  )
}
