import {type Component} from "solid-js";
import type {Stats} from "../../../../lib/model/Stats.ts";
import {StatsChart} from "./StatsChart.tsx";
import {CreatorStatsControls} from "../controls/CreatorStatsControls.tsx";
import {CreatorStatsSettingsProvider} from "../provider/CreatorStatsSettings.tsx";
import {CreatorStatsProvider, useCreatorStats} from "../provider/CreatorStatsProvider.tsx";

interface StreamStatsProps {
  stats: Stats
}

export const CreatorStats: Component<StreamStatsProps> = (props) => {
  return (
    <CreatorStatsSettingsProvider>
      <CreatorStatsProvider stats={props.stats}>
        <Chart/>
      </CreatorStatsProvider>
    </CreatorStatsSettingsProvider>
  );
}

const Chart: Component = () => {
  const {chartOptions} = useCreatorStats()
  return (
    <div class="flex flex-col gap-3">
      <CreatorStatsControls/>
      <div class="rounded-group bg-surface-strong ring-line p-2 ring-1">
        <StatsChart height={400} option={chartOptions()}/>
      </div>
    </div>
  );
}
