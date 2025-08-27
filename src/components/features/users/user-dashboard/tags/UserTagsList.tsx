import {type Component, For, Match, Switch} from "solid-js";
import {useTags} from "./UserTagsProvider.tsx";
import {FaSolidCheck, FaSolidCircleExclamation, FaSolidTag, FaSolidUser, FaSolidXmark} from "solid-icons/fa";

const RecommendationHint = () => (
  <div class="bg-accent-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
    <p class="text-xs text-accent-700 text-center font-medium">
      💡 <span class="font-semibold">Recommendation:</span> Add at least one charity tag and a few other tags to make your profile more discoverable!
    </p>
  </div>
);

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
      <FaSolidTag class="w-8 h-8 text-white" />
    </div>
    <h3 class="text-xl font-semibold text-gray-800 mb-2">No tags added yet</h3>
    <p class="text-gray-600 text-center max-w-md mb-4 leading-relaxed">
      Start building your profile by selecting tags that represent your interests, games, or causes.
      This helps viewers discover and connect with your content.
    </p>
    <div class="flex items-center gap-2 text-accent font-medium">
      <span class="text-sm">Browse available tags above</span>
      <svg class="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <div class="animate-pulse bg-neutral-200 rounded-xl h-16 shadow-sm"></div>
    <div class="animate-pulse bg-neutral-200 rounded-xl h-16 shadow-sm"></div>
    <div class="animate-pulse bg-neutral-200 rounded-xl h-16 shadow-sm"></div>
  </div>
);

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
    userTagsError
  } = useTags();

  const hasTags = () => userTags().length > 0;
  const needsMoreTags = () => userTags().length < 4;


  return (
    <div class="mt-6">
      <div class="flex items-center gap-3 mb-4">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaSolidUser class="w-4 h-4 text-primary" />
          Your Tags
        </h3>
        {hasTags() && (
          <div class="bg-gradient-to-r from-primary-100 to-primary-200 px-3 py-1 rounded-full">
            <span class="text-primary-700 text-xs font-medium">
              {userTags().length} tag{userTags().length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Show recommendation hint for users with less than 4 tags */}
      {needsMoreTags() && !isLoadingUserTags() && !hasUserTagsError() && (
        <RecommendationHint />
      )}

      <Switch>
        <Match when={isLoadingUserTags()}>
          <LoadingSkeleton />
        </Match>

        <Match when={hasUserTagsError()}>
          <div class="bg-danger-50 rounded-xl p-6 border border-danger-200">
            <div class="flex items-center justify-center gap-3 text-danger-600">
              <FaSolidCircleExclamation class="w-5 h-5 flex-shrink-0" />
              <div>
                <p class="font-semibold text-sm">Error loading your tags</p>
                <p class="text-xs opacity-90">{userTagsError() || "Unknown error occurred"}</p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={!hasTags()}>
          <EmptyState />
        </Match>

        <Match when={hasTags()}>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ~gap-3/4">
            <For each={userTags()}>
              {(userTag) => (
                <div
                  class="group relative bg-white rounded-xl p-4 shadow-md border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center"
                  style={{
                    'border-color': userTag.tag.color,
                    'background': `linear-gradient(135deg, ${userTag.tag.color}08, ${userTag.tag.color}15)`
                  }}
                >
                  <div class="flex items-center gap-3 flex-1">
                    {/* Color indicator */}
                    <div
                      class="w-4 h-4 rounded-full shadow-sm flex-shrink-0"
                      style={{'background-color': userTag.tag.color}}
                    ></div>

                    {/* Tag info */}
                    <div class="flex-1 min-w-0">
                      <span class="font-semibold text-gray-800 text-sm block truncate">
                        {userTag.tag.name}
                      </span>
                      {userTag.tag.description && (
                        <span class="text-xs text-gray-600 opacity-80 block truncate">
                          {userTag.tag.description}
                        </span>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(userTag.tagId)}
                      class="
                        flex-shrink-0 p-2 rounded-full transition-all duration-200
                        hover:bg-danger-100 focus:bg-danger-100
                        group-hover:opacity-100 opacity-70
                        focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 focus:ring-offset-white outline-none
                        hover:scale-110 active:scale-95
                      "
                      aria-label={`Remove ${userTag.tag.name} tag`}
                      title="Remove tag"
                    >
                      <FaSolidXmark class="w-4 h-4 text-danger-500 hover:text-danger-600" />
                    </button>
                  </div>

                  {/* Subtle hover effect */}
                  <div
                    class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
                    style={{'background-color': userTag.tag.color}}
                  ></div>
                </div>
              )}
            </For>
          </div>

          {/* Tags summary */}
          <div class="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2 text-gray-600">
                <FaSolidCheck class="w-4 h-4" />
                <span>
                  You have {userTags().length} active tag{userTags().length !== 1 ? 's' : ''}
                </span>
              </div>
              <div class="text-xs text-gray-500">
                Click × to remove tags
              </div>
            </div>
          </div>
        </Match>
      </Switch>
    </div>
  );
};
