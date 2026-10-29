import { type Component, createSignal, For, Show } from 'solid-js'
import { FaSolidCalendarWeek } from 'solid-icons/fa'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import { UpcomingStreamRow } from '../schedules/common/StreamCard.tsx'
import { Button } from '../../ui/Button'
import { Alert, Spinner } from '../../ui/Status'
import { Section } from '../../ui/Tile'

export const UpcomingStreams: Component = () => {
  const { upcomingStreams } = useCommunityPage()
  const [showAll, setShowAll] = createSignal(false)

  const items = () => upcomingStreams.data?.streams ?? []
  const remainingCount = () => Math.max(items().length - 4, 0)
  const visibleItems = () => (showAll() ? items() : items().slice(0, 4))

  return (
    <Section
      title="Upcoming streams"
      icon={<FaSolidCalendarWeek />}
      action={
        <Button href="/community/schedule" size="sm" variant="ghost">
          Full schedule
        </Button>
      }
    >
      <Show when={upcomingStreams.isLoading}>
        <Spinner label="Loading upcoming streams…" />
      </Show>
      <Show when={upcomingStreams.isError}>
        <Alert tone="danger">Failed to load upcoming streams.</Alert>
      </Show>
      <Show when={upcomingStreams.isSuccess && items().length === 0}>
        <p class="text-fg-muted text-sm">No upcoming streams right now.</p>
      </Show>
      <Show when={upcomingStreams.isSuccess && items().length > 0}>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <For each={visibleItems()}>
            {(item) => (
              <UpcomingStreamRow stream={item.stream} user={item.owner} />
            )}
          </For>
        </div>
        <Show when={remainingCount() > 0}>
          <div class="mt-2 flex justify-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll() ? 'Show less' : `Show ${remainingCount()} more`}
            </Button>
          </div>
        </Show>
      </Show>
    </Section>
  )
}
