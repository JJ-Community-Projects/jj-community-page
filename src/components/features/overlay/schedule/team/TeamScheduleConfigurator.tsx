import { type Component, createMemo, createSignal, Show } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import {
  buildUrl,
  ConfiguratorBody,
  NO_CHOICE,
  titleCase,
} from '../../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../../overview/formats.ts'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { Select } from '../../../../ui/Select'
import { Alert, Spinner } from '../../../../ui/Status'

type Theme = 'default' | 'red' | 'blue'
type StreamStyle = 'filled' | 'striped'

const LIMITS = ['3', '4', '5', '6', '7', '8', '9', '10']

export const TeamScheduleConfigurator: Component = () => {
  const [theme, setTheme] = createSignal<Theme>('default')
  const [streamStyle, setStreamStyle] = createSignal<StreamStyle>('filled')
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
  const teams = () => qTeams.data ?? []
  const teamName = (id: string) =>
    teams().find((t) => String(t.id) === id)?.name ?? 'Choose a team'

  return (
    <ConfiguratorBody
      description="A team's upcoming streams in a compact panel. Choose the team, a theme, filled or striped cards, and how many streams to show."
      format={OVERLAY_FORMATS['team-schedule']}
      previewUrl={scheduleUrl()}
      linkUrl={scheduleUrl()}
    >
      <Show when={!qTeams.isLoading} fallback={<Spinner label="Loading your teams…" />}>
        <Show
          when={teams().length > 0}
          fallback={
            <Alert tone="warning" role="status" class="sm:col-span-2">
              You are not part of any team yet. Create or join a team to use
              the Team Schedule overlay.
            </Alert>
          }
        >
          <Select
            label="Team"
            showLabel
            options={[NO_CHOICE, ...teams().map((t) => String(t.id))]}
            value={teamId() ? String(teamId()) : NO_CHOICE}
            onChange={(v) => setTeamId(v === NO_CHOICE ? undefined : Number(v))}
            format={teamName}
          />
        </Show>
      </Show>
      <Select
        label="Theme"
        showLabel
        options={['default', 'red', 'blue'] as Theme[]}
        value={theme()}
        onChange={setTheme}
        format={titleCase}
      />
      <Select
        label="Stream style"
        showLabel
        options={['filled', 'striped'] as StreamStyle[]}
        value={streamStyle()}
        onChange={setStreamStyle}
        format={(v) => (v === 'filled' ? 'Filled' : 'Striped')}
      />
      <Select
        label="Streams shown"
        showLabel
        options={LIMITS}
        value={String(limit())}
        onChange={(v) => setLimit(Number(v))}
        format={(v) => v}
      />
    </ConfiguratorBody>
  )
}
