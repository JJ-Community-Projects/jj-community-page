import { type Component, createSignal, For, Show } from 'solid-js'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import { ScheduleStreamCard } from '../schedules/common/StreamCard.tsx'

export const UpcomingStreams: Component = () => {
  const { upcomingStreams } = useCommunityPage()
  const [showAll, setShowAll] = createSignal(false)

  const items = () => upcomingStreams.data?.streams ?? []
  const firstFour = () => items().slice(0, 4)
  const remainingCount = () => Math.max(items().length - 4, 0)
  const visibleItems = () => (showAll() ? items() : firstFour())

  return (
    <div class="mt-6">
      <h2 class="mb-3 text-lg font-semibold text-white">Upcoming streams</h2>
      <Show when={upcomingStreams.isLoading}>
        <p class="text-white/80">Loading upcoming streams…</p>
      </Show>
      <Show when={upcomingStreams.isError}>
        <p class="text-red-400">Failed to load upcoming streams.</p>
      </Show>
      <Show when={upcomingStreams.isSuccess && items().length > 0}>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <For each={visibleItems()}>
            {(item) => {
              const { stream, owner } = item
              return (
                <ScheduleStreamCard
                  stream={stream}
                  user={owner}
                  type={'top-bar'}
                  hover={true}
                />
              )
            }}
          </For>
        </div>
        <Show when={remainingCount() > 0}>
          <div class="mt-3 flex justify-center">
            <button
              class="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll() ? 'Show less' : `Show ${remainingCount()} more`}
            </button>
          </div>
        </Show>
      </Show>
    </div>
  )
}
