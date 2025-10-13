import { type Component, createMemo, createSignal, For } from 'solid-js'
import { buildUrl, FieldRow, LinkPreview, PreviewFrame } from './Common'
import { useUser } from '../../users/user-dashboard/providers/UserProvider.tsx'
import { orpcPublic } from '../../../../lib/orpc/client'
import { useQuery } from '@tanstack/solid-query'

export const TeamFundraiserSection: Component<{ visible?: boolean }> = (p) => {
  const [theme, setTheme] = createSignal<'default' | 'red' | 'blue'>('default')
  const [showRaised, setShowRaised] = createSignal<boolean>(true)
  const [teamSlug, setTeamSlug] = createSignal<string>('')

  const { user } = useUser()

  // Load user's teams to populate selector
  const teamsQ = useQuery(() =>
    orpcPublic.users.teams.getTeamsByUserSlug.queryOptions({
      input: { slug: user.tiltifyName },
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }),
  )

  const teams = () => teamsQ.data?.teams ?? []

  const url = createMemo(() =>
    buildUrl('/overlays-v2/team-fundraiser', {
      team: teamSlug() || undefined,
      theme: theme(),
      showraised: showRaised(),
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <FieldRow label="Team">
        <select
          class="w-60 rounded bg-black/40 px-2 py-1"
          value={teamSlug()}
          onChange={(e) => setTeamSlug(e.currentTarget.value)}
        >
          <option value="">All teams</option>
          <For each={teams()}>
            {(t) => <option value={t.slug}>{t.name}</option>}
          </For>
        </select>
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

export default TeamFundraiserSection
