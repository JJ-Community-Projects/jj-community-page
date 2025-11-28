import { type Component, createSignal, For, Show } from 'solid-js'
import { FaSolidChevronRight } from 'solid-icons/fa'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import {
  UpcomingStreamsStreamCard,
} from '../schedules/common/StreamCard.tsx'

export const UpcomingStreams: Component = () => {
  const { upcomingStreams } = useCommunityPage()
  const [showAll, setShowAll] = createSignal(false)

  const items = () => upcomingStreams.data?.streams ?? []
  const firstFour = () => items().slice(0, 4)
  const remainingCount = () => Math.max(items().length - 4, 0)
  const visibleItems = () => (showAll() ? items() : firstFour())

  return (
    <div class="w-full flex flex-col gap-2">
      <div class="w-full flex flex-col">
        <h2 class="text-lg font-semibold text-white">Upcoming streams</h2>
        <a
          href="/community/schedule"
          class="group inline-flex items-center gap-1 text-sm font-semibold text-white/80 hover:text-white transition-colors"
        >
          <span>full schedule</span>
          <FaSolidChevronRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
      <Show when={upcomingStreams.isLoading}>
        <p class="text-white/80">Loading upcoming streams…</p>
      </Show>
      <Show when={upcomingStreams.isError}>
        <p class="text-red-400">Failed to load upcoming streams.</p>
      </Show>
      <Show when={upcomingStreams.isSuccess && items().length > 0}>
        <div class="w-full grid grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] gap-2 ">
          <For each={visibleItems()}>
            {(item) => {
              const { stream, owner } = item
              return (
                <UpcomingStreamsStreamCard
                  stream={stream}
                  user={owner}
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
