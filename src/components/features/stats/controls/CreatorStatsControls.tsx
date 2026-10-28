import { type Component } from 'solid-js'
import { useCreatorStatsSettings } from '../provider/CreatorStatsSettings.tsx'
import { StatsValueTypeCreator } from '../../../../lib/model/Stats.ts'
import { Select } from '../../../ui/Select'
import { StatsToggle } from './StatsControls.tsx'

const valueLabels: Record<StatsValueTypeCreator, string> = {
  [StatsValueTypeCreator.Appearance]: 'Appearance',
  [StatsValueTypeCreator.Minutes]: 'Minutes',
}

export const CreatorStatsControls: Component = () => {
  const { settings, setSettings } = useCreatorStatsSettings()
  return (
    <div class="flex flex-wrap items-center gap-2">
      <Select
        label="Creator value"
        size="sm"
        options={Object.values(StatsValueTypeCreator)}
        value={settings.value}
        onChange={(value) => setSettings('value', value)}
        format={(value) => valueLabels[value]}
      />
      <StatsToggle
        label="Creators shown"
        off="All"
        on="Top 15"
        pressed={settings.onlyTop15}
        onChange={(pressed) => setSettings('onlyTop15', pressed)}
      />
    </div>
  )
}
