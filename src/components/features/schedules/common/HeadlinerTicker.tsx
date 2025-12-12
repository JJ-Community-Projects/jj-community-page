import { type Component, For, Show } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { UpcomingStreamsStreamCard } from './StreamCard.tsx'
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
    <>
      <Show when={items().length > 1}>
        <div class={'flex w-full flex-col gap-2'}>
          <h3 class={'text-lg font-semibold text-white'}>Upcoming Headliner</h3>
          <div class="ticker-fade relative flex overflow-x-hidden">
            {/* First lane */}
            <div
              style={{
                animation: `marquee ${duration()}s linear infinite`,
              }}
              class="flex flex-row whitespace-nowrap"
            >
              <For each={items()}>{(stream) => <Item stream={stream} />}</For>
            </div>

            {/* Second lane (offset) */}
            <div
              style={{
                animation: `marquee2 ${duration()}s linear infinite`,
              }}
              class="absolute top-0 w-full flex-row whitespace-nowrap"
            >
              <For each={items()}>{(stream) => <Item stream={stream} />}</For>
            </div>
          </div>
        </div>
      </Show>
      <Show when={items().length === 1}>
        <div class={'flex w-full flex-col gap-2'}>
          <h3 class={'text-lg font-semibold text-white'}>Upcoming Headliner</h3>
          <Item stream={items()[0]} />
        </div>
      </Show>
    </>
  )
}

interface ItemProps {
  stream: UserStream
}

const Item: Component<ItemProps> = (props) => {
  return (
    <div class="inline-block px-2 py-1">
      <div class="max-h-32 w-72">
        <UpcomingStreamsStreamCard
          stream={props.stream.stream}
          user={props.stream.owner}
        />
      </div>
    </div>
  )
}
