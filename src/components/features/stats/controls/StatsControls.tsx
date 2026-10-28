import { type Component, Index } from 'solid-js'
import { ToggleButton } from '@kobalte/core/toggle-button'
import { useStatsSettings } from '../provider/StatsSettings'
import { StatsValueType } from '../../../../lib/model/Stats.ts'
import { useStats } from '../provider/StatsProvider.tsx'
import { useCreator } from '../provider/CreatorProvider.tsx'
import { Segmented } from '../../../ui/Form'
import { Select } from '../../../ui/Select'
import { cn, focusRing } from '../../../ui/cn'

const valueLabels: Record<StatsValueType, string> = {
  [StatsValueType.Total]: 'Total',
  [StatsValueType.TotalPerMinute]: 'Total Per Minute',
  [StatsValueType.Yogs]: 'Yogs',
  [StatsValueType.YogsPerMinute]: 'Donations Per Minute to Yogs',
  [StatsValueType.Fundraiser]: 'Fundraiser',
  [StatsValueType.FundraiserPerMinute]: 'Donations Per Minute to Fundraisers',
  [StatsValueType.Collections]: 'Collections',
  [StatsValueType.CollectionsPerMinute]: 'Collections Per Minute',
  [StatsValueType.Donations]: 'Donations',
  [StatsValueType.DonationsPerMinute]: 'Donations Per Minute',
  [StatsValueType.AvgDonationAmount]: 'Avg Donation Amount',
}

/** A two-way switch between two labelled states. */
export const StatsToggle: Component<{
  label: string
  off: string
  on: string
  pressed: boolean
  onChange: (pressed: boolean) => void
}> = (props) => (
  <Segmented
    label={props.label}
    size="sm"
    value={props.pressed ? 'on' : 'off'}
    onChange={(value) => props.onChange(value === 'on')}
    options={[
      { value: 'off', label: props.off },
      { value: 'on', label: props.on },
    ]}
  />
)

export const StatsControls: Component = () => {
  const { settings, setSettings } = useStatsSettings()
  return (
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <Select
          label="Value"
          size="sm"
          options={Object.values(StatsValueType)}
          value={settings.value}
          onChange={(value) => setSettings('value', value)}
          format={(value) => valueLabels[value]}
        />
        <CreatorSelector />
        <StatsToggle
          label="Streams shown"
          off="All"
          on="Top 15"
          pressed={settings.onlyTop15}
          onChange={(pressed) => setSettings('onlyTop15', pressed)}
        />
        <StatsToggle
          label="Order"
          off="Date"
          on="Amount"
          pressed={settings.order === 'amount'}
          onChange={(pressed) =>
            setSettings('order', pressed ? 'amount' : 'date')
          }
        />
        <StatsToggle
          label="Day 1"
          off="Exclude Day 1"
          on="Include Day 1"
          pressed={settings.showDay1}
          onChange={(pressed) => setSettings('showDay1', pressed)}
        />
        <StatsToggle
          label="Nights"
          off="Exclude nights"
          on="Include nights"
          pressed={settings.showNights}
          onChange={(pressed) => setSettings('showNights', pressed)}
        />
        <StatsToggle
          label="Bars"
          off="Hours"
          on="Streams"
          pressed={settings.bar === 'streams'}
          onChange={(pressed) =>
            setSettings('bar', pressed ? 'streams' : 'hours')
          }
        />
      </div>
      <DaysSelector />
    </div>
  )
}

// Allows selecting specific December days (1–14) to filter streams by date
const DaysSelector: Component = () => {
  const { settings, setSettings } = useStatsSettings()

  const has = (day: number) => settings.days.includes(day)
  const toggleDay = (day: number) =>
    setSettings(
      'days',
      has(day)
        ? settings.days.filter((d) => d !== day)
        : [...settings.days, day],
    )

  return (
    <div
      class="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label="December days"
    >
      <span class="text-fg-muted mr-1 text-xs font-semibold">Days</span>
      <Index each={Array.from({ length: 14 })}>
        {(_, i) => (
          <ToggleButton
            pressed={has(i + 1)}
            onChange={() => toggleDay(i + 1)}
            class={cn(
              'ring-line-strong text-fg-muted hover:text-fg min-w-8 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 transition-colors',
              'data-pressed:bg-accent data-pressed:ring-accent data-pressed:text-white',
              focusRing,
            )}
          >
            {i + 1}
          </ToggleButton>
        )}
      </Index>
      <button
        type="button"
        class={cn(
          'text-fg-muted hover:text-fg ml-1 text-xs underline',
          focusRing,
        )}
        onClick={() => setSettings('days', [])}
      >
        All days
      </button>
    </div>
  )
}

const ALL_CREATORS = '__all__'

// Allows selecting a single creator to filter streams by that creator
const CreatorSelector: Component = () => {
  const { settings, setSettings } = useStatsSettings()
  const { creators } = useStats()
  const { getCreator } = useCreator()

  const fullCreators = () =>
    creators()
      .map((c) => getCreator(c.id))
      .filter((c) => c !== undefined)
      .filter((c) => c.type === 'yogs')
      .toSorted((a, b) => a.name.localeCompare(b.name))

  return (
    <Select
      label="Creator"
      size="sm"
      // First option is All (no filter), then creators from stats. Kobalte treats '' as "no
      // selection", so All is a sentinel value.
      options={[ALL_CREATORS, ...fullCreators().map((c) => c.id)]}
      value={settings.creators[0] ?? ALL_CREATORS}
      onChange={(value) =>
        setSettings('creators', value === ALL_CREATORS ? [] : [value])
      }
      format={(value) =>
        value === ALL_CREATORS
          ? 'Creator: All'
          : `Creator: ${getCreator(value).name}`
      }
    />
  )
}
