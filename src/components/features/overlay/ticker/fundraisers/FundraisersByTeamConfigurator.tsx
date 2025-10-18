import { type Component, createMemo, createSignal, For, Show } from 'solid-js'
import {
  buildUrl,
  FieldRow,
  LinkPreview,
  PreviewFrame,
} from '../../overview/Common.tsx'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'

const Body: Component<{ visible?: boolean }> = (p) => {
  const [theme, setTheme] = createSignal<'default' | 'red' | 'blue'>('default')
  const [showRaised, setShowRaised] = createSignal<boolean>(true)
  const [teamSlug, setTeamSlug] = createSignal<string>('')
  const [currency, setCurrency] = createSignal<'GBP' | 'USD'>('GBP')

  const qTeams = useQuery(() =>
    orpcPrivate.teams.getUserTeams.queryOptions({
      staleTime: 60_000 * 10,
      refetchOnWindowFocus: false,
    }),
  )

  const noTeams = () => (qTeams.data?.length ?? 0) === 0

  const url = createMemo(() =>
    buildUrl('/overlays/team-fundraiser', {
      team: teamSlug() || undefined,
      theme: theme(),
      showraised: showRaised(),
      currency: currency(),
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <Show when={!qTeams.isLoading && noTeams()}>
        <div class="mb-2 rounded border border-yellow-400/40 bg-yellow-500/10 p-2 text-sm text-yellow-300">
          You are not part of any team yet. Create or join a team to filter by
          team.
        </div>
      </Show>
      <FieldRow label="Team">
        <Show when={!qTeams.isLoading} fallback={<span>Loading…</span>}>
          <select
            class="w-60 rounded bg-black/40 px-2 py-1"
            value={teamSlug()}
            onChange={(e) => setTeamSlug(e.currentTarget.value)}
            title={
              noTeams() ? 'Join or create a team to select it here' : undefined
            }
          >
            <option value="">All teams</option>
            <For each={qTeams.data ?? []}>
              {(t) => (
                <option value={t.slug}>
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
      <FieldRow label="Currency">
        <select
          value={currency()}
          onChange={(e) => setCurrency(e.currentTarget.value as 'GBP' | 'USD')}
          class="w-40 rounded bg-black/40 px-2 py-1"
        >
          <option value="GBP">GBP</option>
          <option value="USD">USD</option>
        </select>
      </FieldRow>
      <FieldRow label="Show Raised">
        <input
          type="checkbox"
          checked={showRaised()}
          onChange={(e) => setShowRaised(e.currentTarget.checked)}
        />
      </FieldRow>
      <LinkPreview url={url()} />
      <PreviewFrame url={url()} visible={p.visible} />
    </div>
  )
}

export const FundraisersByTeamConfigurator: Component<{ visible?: boolean }> = (
  p,
) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Body visible={p.visible} />
    </QueryClientProvider>
  )
}
