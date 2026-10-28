import { type Component, For, Match, Show, Switch } from 'solid-js'
import { useBlocks } from './UserBlockProvider.tsx'
import {
  FaSolidBan,
  FaSolidCircleExclamation,
  FaSolidMagnifyingGlass,
  FaSolidUsers,
  FaSolidUserSlash,
} from 'solid-icons/fa'

const StatusIndicator = () => {
  const { isLoadingSearch, hasSearchError } = useBlocks()
  return (
    <div class="flex items-center gap-1">
      <Switch>
        <Match when={isLoadingSearch()}>
          <div class="flex items-center gap-2 rounded-full bg-linear-to-r from-danger-100 to-danger-200 px-3 py-1.5 shadow-xs">
            <div class="h-2 w-2 animate-pulse rounded-full bg-danger"></div>
            <span class="text-xs font-medium text-danger-700">Searching</span>
          </div>
        </Match>
        <Match when={hasSearchError()}>
          <div class="flex items-center gap-2 rounded-full bg-linear-to-r from-danger-100 to-danger-200 px-3 py-1.5 shadow-xs">
            <div class="h-2 w-2 rounded-full bg-danger-500"></div>
            <span class="text-xs font-medium text-danger-700">Error</span>
          </div>
        </Match>
      </Switch>
    </div>
  )
}

const UserSkeleton = () => (
  <div class="h-16 w-full animate-pulse rounded-lg bg-black/10 shadow-xs"></div>
)

/**
 * AvailableUsersToBlockList Component
 *
 * Displays search results for users with block functionality.
 * Enhanced with interactive user cards, red theme for blocking, and improved loading states.
 */
export const AvailableUsersToBlockList: Component = () => {
  const {
    searchResults,
    isLoadingSearch,
    hasSearchError,
    debouncedInput,
    handleBlockUser,
    searchErrorMessage,
    isBlockingUser,
    hasBlockError,
    blockErrorMessage,
    blockedUsers,
  } = useBlocks()

  const hasUsers = () => searchResults().length > 0

  const EmptyState = () => (
    <div class="flex flex-col items-center justify-center px-4 py-8">
      <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-black/20 to-black/30">
        <FaSolidUsers class="h-6 w-6 text-white" />
      </div>
      <h4 class="mb-1 text-sm font-semibold text-fg-muted">
        {debouncedInput().length > 0 ? 'No users found' : 'Start searching'}
      </h4>
      <p class="max-w-sm text-center text-xs text-fg-muted">
        {debouncedInput().length > 0
          ? `No users found matching "${debouncedInput()}". Try a different search term.`
          : 'Enter a username above to search for users to block.'}
      </p>
    </div>
  )

  // Check if user is already blocked
  const isAlreadyBlocked = (userId: number) => {
    return blockedUsers().some((user) => user.userId === userId)
  }

  const handleBlockRequest = async (userId: number) => {
    try {
      await handleBlockUser(userId)
    } catch (error) {
      console.error('Failed to block user:', error)
    }
  }

  return (
    <div class="mb-6">
      <div class="mb-4 flex items-center gap-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-fg">
          <FaSolidMagnifyingGlass class="h-4 w-4 text-danger" />
          Search Results
        </h3>
        <StatusIndicator />
      </div>

      {/* Error messages */}
      <Show when={hasBlockError()}>
        <div class="mb-4 rounded-xl border border-danger-200 bg-danger-50 p-4">
          <div class="flex items-center gap-3 text-danger-600">
            <FaSolidCircleExclamation class="h-4 w-4 shrink-0" />
            <p class="text-sm font-medium">
              {blockErrorMessage() || 'Failed to block user'}
            </p>
          </div>
        </div>
      </Show>

      <Switch fallback={<EmptyState />}>
        <Match when={hasSearchError()}>
          <div class="rounded-xl border border-danger-200 bg-danger-50 p-6">
            <div class="flex items-center justify-center gap-3 text-danger-600">
              <FaSolidCircleExclamation class="h-5 w-5 shrink-0" />
              <div>
                <p class="text-sm font-semibold">Error searching users</p>
                <p class="text-xs opacity-90">
                  {searchErrorMessage() || 'Unknown error occurred'}
                </p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={isLoadingSearch() && !hasUsers()}>
          <div class="space-y-3">
            <UserSkeleton />
            <UserSkeleton />
            <UserSkeleton />
            <UserSkeleton />
          </div>
        </Match>

        <Match when={hasUsers()}>
          <div class="space-y-3">
            <For each={searchResults()}>
              {(user) => {
                const isAlreadyBlockedVal = () => isAlreadyBlocked(user.userId)
                const canBlockUser = () =>
                  !isAlreadyBlockedVal() && !isBlockingUser()

                return (
                  <div class="rounded-group bg-surface-strong text-fg ring-1 ring-line group relative overflow-hidden p-4 transition-colors hover:bg-surface">
                    <div class="flex items-center justify-between">
                      {/* User info */}
                      <div class="flex items-center gap-3">
                        {/* Avatar placeholder */}
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-danger-500 to-danger-600 shadow-xs">
                          <span class="text-sm font-semibold text-white">
                            {(user.tiltifyUsername ||
                              user.twitchUsername ||
                              'U')[0].toUpperCase()}
                          </span>
                        </div>

                        {/* User details */}
                        <div>
                          <p class="text-sm font-semibold text-fg">
                            {user.tiltifyUsername ||
                              user.twitchUsername ||
                              'Unknown User'}
                          </p>
                          <Show
                            when={user.twitchUsername && user.tiltifyUsername}
                          >
                            <p class="text-xs text-fg-muted">
                              Twitch: {user.twitchUsername}
                            </p>
                          </Show>
                        </div>
                      </div>

                      {/* Action button */}
                      <button
                        type="button"
                        onClick={() => handleBlockRequest(user.userId)}
                        disabled={!canBlockUser() || isBlockingUser()}
                        class={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium outline-hidden transition-all duration-200 focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-white ${ canBlockUser() && !isBlockingUser() ? 'bg-danger text-white shadow-xs hover:bg-danger-600 hover:shadow-md' : 'cursor-not-allowed bg-surface-2 text-fg-muted' }`}
                        aria-label={`${canBlockUser() ? 'Block' : 'Cannot block'} ${user.tiltifyUsername || user.twitchUsername}`}
                      >
                        <FaSolidBan class="h-4 w-4" />
                        {(() => {
                          if (isBlockingUser()) return 'Blocking...'
                          if (isAlreadyBlockedVal()) return 'Already Blocked'
                          return 'Block User'
                        })()}
                      </button>
                    </div>

                    {/* Status indicators */}
                    <Show when={isAlreadyBlockedVal()}>
                      <div class="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-danger">
                        <FaSolidUserSlash class="h-2.5 w-2.5 text-white" />
                      </div>
                    </Show>

                    {/* Subtle hover effect */}
                    <div class="pointer-events-none absolute inset-0 rounded-xl bg-danger-500 opacity-0 transition-opacity duration-300 group-hover:opacity-5"></div>
                  </div>
                )
              }}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  )
}
