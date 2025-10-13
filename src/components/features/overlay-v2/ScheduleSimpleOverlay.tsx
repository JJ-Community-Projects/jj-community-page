import { type Component, createMemo, For, Show } from 'solid-js'
import { orpcPrivate } from '../../../lib/orpc/client'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'

type Props = {
  scheduleId?: number
  scheduleSlug?: string
  includePast?: boolean
  windowSize?: number
}

const Body: Component<Props> = (props) => {
  const input = createMemo(() => ({
    scheduleId: props.scheduleId,
    scheduleSlug: props.scheduleSlug,
  }))
  const hasParam = () =>
    Boolean(input().scheduleId) || Boolean(input().scheduleSlug)

  const q = useQuery(() =>
    orpcPrivate.overlay.scheduleSimple.queryOptions({
      input: {
        ...input(),
        includePast: props.includePast,
        windowSize: props.windowSize,
      },
      enabled: hasParam(),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    }),
  )

  return (
    <div class="p-2">
      <Show when={hasParam()} fallback={<MissingParamHint />}>
        <Show when={q.isLoading}>
          <p class="opacity-80">Loading…</p>
        </Show>
        <Show when={q.error}>
          <p class="text-red-400">
            {q.error?.message ?? 'Failed to load schedule'}
          </p>
        </Show>
        <Show when={q.data}>
          {(data) => (
            <div class="flex flex-col gap-2">
              <header class="text-center">
                <h1 class="text-xl font-semibold">{data().schedule.name}</h1>
              </header>
              <ul class="flex flex-col gap-1">
                <For each={data().blocks}>
                  {(b) => (
                    <li class="rounded bg-black/30 px-3 py-2">
                      <div class="flex justify-between text-sm">
                        <span>
                          {new Date(b.start).toLocaleTimeString()} →{' '}
                          {new Date(b.end).toLocaleTimeString()}
                        </span>
                        <span class="font-semibold">{b.title}</span>
                      </div>
                    </li>
                  )}
                </For>
                <Show when={!data() || data().blocks.length === 0}>
                  <p class="text-center text-sm opacity-70">
                    No upcoming items.
                  </p>
                </Show>
              </ul>
            </div>
          )}
        </Show>
      </Show>
    </div>
  )
}

const MissingParamHint: Component = () => (
  <div class="p-4 text-center">
    <p class="mb-2">Please provide a schedule to display.</p>
    <p class="text-sm opacity-80">
      Try adding ?scheduleSlug=jinglejam-2024 or ?scheduleId=1 to the URL.
    </p>
  </div>
)

export const ScheduleSimpleOverlay: Component<Props> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Body {...props} />
    </QueryClientProvider>
  )
}
