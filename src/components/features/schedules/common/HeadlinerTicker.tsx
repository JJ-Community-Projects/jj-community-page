import { type Component, For, Show } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { UpcomingStreamRow } from './StreamCard.tsx'
import './HeadlinerTicker.css'
import type { UserStream } from '../../../../lib/orpc/private/jjData/contract.ts'

export const HeadlinerTicker: Component = () => {
  const headliner = useQuery(() =>
    orpcPrivate.jj.headliner.queryOptions({
      staleTime: 60_000,
      refreshInterval: 60_000 * 15,
    }),
  )

  const items = () => headliner.data ?? []

  // Speed scales with number of items; ensure a sensible minimum
  const duration = () => Math.max(16, 4 * items().length * 2)

  return (
    <Show when={items().length > 0}>
      <section
        class="flex w-full flex-col gap-1.5"
        aria-label="Upcoming headliners"
      >
        <h2 class="text-on-canvas text-sm font-semibold">Upcoming headliner</h2>
        <Show
          when={items().length > 1}
          fallback={
            <div class="w-full sm:w-80">
              <UpcomingStreamRow
                stream={items()[0].stream}
                user={items()[0].owner}
              />
            </div>
          }
        >
          <div class="ticker-fade relative flex overflow-x-hidden">
            {/* First lane */}
            <div
              style={{ animation: `marquee ${duration()}s linear infinite` }}
              class="flex flex-row whitespace-nowrap"
            >
              <For each={items()}>{(stream) => <Item stream={stream} />}</For>
            </div>

            {/* Second lane (offset) */}
            <div
              style={{ animation: `marquee2 ${duration()}s linear infinite` }}
              class="absolute top-0 w-full flex-row whitespace-nowrap"
            >
              <For each={items()}>{(stream) => <Item stream={stream} />}</For>
            </div>
          </div>
        </Show>
      </section>
    </Show>
  )
}

const Item: Component<{ stream: UserStream }> = (props) => (
  <div class="inline-block w-72 px-1 py-0.5 align-top whitespace-normal">
    <UpcomingStreamRow stream={props.stream.stream} user={props.stream.owner} />
  </div>
)
