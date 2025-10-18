import { type Component, createMemo, For, Show } from 'solid-js'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { TeamOverlayStreamCardFilled, TeamOverlayStreamCardSidebar } from './OverlayStreamCard.tsx'
import { TeamScheduleOverlayHeader } from './TeamScheduleOverlayHeader.tsx'

export type TeamScheduleOverlayProps = {
  teamId?: number
  timezone?: string
  theme?: 'default' | 'red' | 'blue'
  style?: 'filled' | 'striped'
  limit?: number
}

const Body: Component<TeamScheduleOverlayProps> = (props) => {
  const input = createMemo(() => ({
    teamId: props.teamId!,
    timezone: props.timezone,
    limit: props.limit,
  }))

  const hasParam = () => Boolean(props.teamId) && Boolean(props.timezone)

  const q = useQuery(() =>
    orpcPrivate.overlay.scheduleByTeamId.queryOptions({
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
          <p class="text-red-400">{q.error?.message ?? 'Failed to load schedule'}</p>
        </Show>
        <Show when={q.data}>
          {(data) => (
            <div class="flex flex-col gap-1">
              <TeamScheduleOverlayHeader
                title={data().schedule.name}
                timezone={data().timezone}
                theme={theme()}
              />
              <For each={data().blocks}>
                {(b) =>
                  style() === 'striped' ? (
                    <TeamOverlayStreamCardSidebar stream={b as any} timezone={data().timezone} />
                  ) : (
                    <TeamOverlayStreamCardFilled stream={b as any} timezone={data().timezone} />
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

export const TeamScheduleOverlay: Component<TeamScheduleOverlayProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Body {...props} />
    </QueryClientProvider>
  )
}
