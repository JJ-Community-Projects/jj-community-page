import { type Component, createMemo, createSignal, Show } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import {
  buildUrl,
  ConfiguratorBody,
  type Currency,
  CurrencySelect,
  NO_CHOICE,
  PreviewDataField,
  type PreviewDataMode,
  titleCase,
} from '../../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../../overview/formats.ts'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { Checkbox } from '../../../../ui/Form'
import { Select } from '../../../../ui/Select'
import { Alert, Spinner } from '../../../../ui/Status'

type Theme = 'default' | 'red' | 'blue'

export const FundraisersByTeamConfigurator: Component = () => {
  const [theme, setTheme] = createSignal<Theme>('default')
  const [showRaised, setShowRaised] = createSignal<boolean>(true)
  const [teamSlug, setTeamSlug] = createSignal<string>('')
  const [currency, setCurrency] = createSignal<Currency>('GBP')
  const [previewData, setPreviewData] = createSignal<PreviewDataMode>('test')

  const qTeams = useQuery(() =>
    orpcPrivate.teams.getUserTeams.queryOptions({
      staleTime: 60_000 * 10,
      refetchOnWindowFocus: false,
    }),
  )

  const teams = () => qTeams.data ?? []
  const teamName = (slug: string) =>
    teams().find((t) => t.slug === slug)?.name ?? 'All teams'

  const url = createMemo(() =>
    buildUrl('/overlays/team-fundraiser', {
      team: teamSlug() || undefined,
      theme: theme(),
      showraised: showRaised(),
      currency: currency(),
    }),
  )

  // Preview requests demo fixtures by default so the ticker is populated even
  // when no team/live data is available; the OBS URL never includes `demo`.
  const previewUrl = createMemo(() =>
    buildUrl('/overlays/team-fundraiser', {
      team: teamSlug() || undefined,
      theme: theme(),
      showraised: showRaised(),
      currency: currency(),
      demo: previewData() === 'test',
    }),
  )

  return (
    <ConfiguratorBody
      description="A horizontal scrolling ticker of the fundraisers in one of your teams."
      format={OVERLAY_FORMATS['team-fundraiser']}
      previewUrl={previewUrl()}
      linkUrl={url()}
    >
      <PreviewDataField value={previewData()} onChange={setPreviewData} />
      <Show when={!qTeams.isLoading} fallback={<Spinner label="Loading your teams…" />}>
        <Show when={teams().length === 0}>
          <Alert tone="warning" role="status" class="sm:col-span-2">
            You are not part of any team yet. Create or join a team to filter
            by team.
          </Alert>
        </Show>
        <Select
          label="Team"
          showLabel
          options={[NO_CHOICE, ...teams().map((t) => t.slug)]}
          value={teamSlug() || NO_CHOICE}
          onChange={(v) => setTeamSlug(v === NO_CHOICE ? '' : v)}
          format={teamName}
        />
      </Show>
      <Select
        label="Theme"
        showLabel
        options={['default', 'red', 'blue'] as Theme[]}
        value={theme()}
        onChange={setTheme}
        format={titleCase}
      />
      <CurrencySelect value={currency()} onChange={setCurrency} />
      <Checkbox
        label="Show raised amounts"
        checked={showRaised()}
        onChange={setShowRaised}
        class="self-end"
      />
    </ConfiguratorBody>
  )
}
