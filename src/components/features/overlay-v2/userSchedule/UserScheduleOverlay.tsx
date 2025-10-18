import { type Component, createMemo, For, Show } from 'solid-js'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { OverlayStreamCardFilled, OverlayStreamCardSidebar, } from './OverlayStreamCard.tsx'
import { UserScheduleOverlayHeader } from './UserScheduleOverlayHeader.tsx'

type Props = {
  user?: string
  timezone?: string
  theme?: 'default' | 'red' | 'blue'
  style?: 'filled' | 'stripe'
  limit?: number
}

const Body: Component<Props> = (props) => {
  const input = createMemo(() => ({
    user: props.user,
    timezone: props.timezone,
    limit: props.limit,
  }))

  const hasParam = () => Boolean(input().user) && Boolean(input().timezone)

  const q = useQuery(() =>
    orpcPrivate.overlay.schedulePrimary.queryOptions({
      input: input(),
      enabled: hasParam(),
      staleTime: 60_000 * 5,
      refetchInterval: 60_000 * 5,
      refetchOnWindowFocus: false,
    }),
  )

  const theme = () => props.theme ?? 'default'
  const style = () => props.style ?? 'filled'

  return (
    <div class="p-2">
      <Show when={hasParam()}>
        <Show when={q.isLoading}>
          <p class="opacity-80">Loading schedule…</p>
        </Show>
        <Show when={q.error}>
          <p class="text-red-400">
            {q.error?.message ?? 'Failed to load schedule'}
          </p>
        </Show>
        <Show when={q.data}>
          {(data) => (
            <div class="flex flex-col gap-1">
              <UserScheduleOverlayHeader
                title={data().schedule.name}
                timezone={data().timezone}
                theme={theme()}
              />
              <For each={data().blocks}>
                {(b) =>
                  style() === 'stripe' ? (
                    <OverlayStreamCardSidebar
                      stream={b}
                      timezone={data().timezone}
                    />
                  ) : (
                    <OverlayStreamCardFilled
                      stream={b}
                      timezone={data().timezone}
                    />
                  )
                }
              </For>
            </div>
          )}
        </Show>
      </Show>
    </div>
  )
}

export const UserScheduleOverlay: Component<Props> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Body {...props} />
    </QueryClientProvider>
  )
}
