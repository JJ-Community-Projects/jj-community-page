import { type Component, createMemo, createSignal, For, Show } from 'solid-js'
import { buildUrl, FieldRow, LinkPreview, PreviewFrame, } from '../overview/Common.tsx'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'

const Body: Component<{ visible?: boolean }> = (p) => {
  const [theme, setTheme] = createSignal<'default' | 'red' | 'blue'>('default')
  const [streamStyle, setStreamStyle] = createSignal<'filled' | 'striped'>(
    'filled',
  )
  const [limit, setLimit] = createSignal<number>(4)

  const qTeams = useQuery(() =>
    orpcPrivate.teams.getUserTeams.queryOptions({
      staleTime: 60_000 * 10,
      refetchOnWindowFocus: false,
    }),
  )

  const [teamId, setTeamId] = createSignal<number | undefined>(undefined)

  const scheduleUrl = createMemo(() =>
    buildUrl('/overlays/team-schedule', {
      teamId: teamId(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      theme: theme(),
      style: streamStyle(),
      limit: limit(),
    }),
  )
  const noTeams = createMemo(() => (qTeams.data?.length ?? 0) === 0)

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <div class="mb-2 rounded border border-white/10 bg-white/5 p-2 text-sm text-white/80">
        Show a selected team’s upcoming streams in a compact panel. Choose a
        theme, pick filled or striped style, and set the item limit. Set your
        OBS Browser Source to 300x450 px.
      </div>
      <div class={'flex flex-row gap-1'}>
        <div class={'flex flex-1 flex-col gap-2'}>
          <Show when={!qTeams.isLoading && noTeams()}>
            <div class="mb-2 rounded border border-yellow-400/40 bg-yellow-500/10 p-2 text-sm text-yellow-300">
              You are not part of any team yet. Create or join a team to use the
              Team Schedule overlay.
            </div>
          </Show>
          <FieldRow label="Team">
            <Show when={!qTeams.isLoading} fallback={<span>Loading…</span>}>
              <select
                value={teamId() ? String(teamId()) : ''}
                onChange={(e) => {
                  const v = Math.floor(Number(e.currentTarget.value))
                  setTeamId(Number.isFinite(v) ? v : undefined)
                }}
                class="w-60 rounded bg-black/40 px-2 py-1"
                disabled={noTeams()}
                title={
                  noTeams()
                    ? 'Join or create a team to select it here'
                    : undefined
                }
              >
                <option value="">Select a team…</option>
                <For each={qTeams.data ?? []}>
                  {(t) => (
                    <option value={String(t.id)}>
                      {t.name} (#{t.id})
                    </option>
                  )}
                </For>
              </select>
            </Show>
          </FieldRow>
          <FieldRow label="Theme">
            <select
              value={theme()}
              onChange={(e) => setTheme(e.currentTarget.value as any)}
              class="w-40 rounded bg-black/40 px-2 py-1"
            >
              <option value="default">Default</option>
              <option value="red">Red</option>
              <option value="blue">Blue</option>
            </select>
          </FieldRow>
          <FieldRow label="Stream Style">
            <select
              value={streamStyle()}
              onChange={(e) =>
                setStreamStyle(e.currentTarget.value as 'filled' | 'striped')
              }
              class="w-40 rounded bg-black/40 px-2 py-1"
            >
              <option value="filled">Filled</option>
              <option value="striped">Striped</option>
            </select>
          </FieldRow>
          <FieldRow label="Limit">
            <select
              value={String(limit())}
              onChange={(e) => {
                const v = Math.floor(Number(e.currentTarget.value))
                if (Number.isFinite(v)) setLimit(Math.max(3, Math.min(10, v)))
              }}
              class="w-40 rounded bg-black/40 px-2 py-1"
            >
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
            </select>
          </FieldRow>
        </div>
        <div class={'flex flex-1 flex-col gap-2'}>
          <PreviewFrame url={scheduleUrl()} visible={p.visible} />
        </div>
      </div>
      <LinkPreview url={scheduleUrl()} />
    </div>
  )
}

export const TeamScheduleConfigurator: Component<{ visible?: boolean }> = (
  p,
) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Body visible={p.visible} />
    </QueryClientProvider>
  )
}
