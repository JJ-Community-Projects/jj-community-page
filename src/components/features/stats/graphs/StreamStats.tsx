import {type Component} from "solid-js";
import type {Stats} from "../../../../lib/model/Stats.ts";
import {StatsSettingsProvider} from "../provider/StatsSettings.tsx";
import {StatsProvider, useStats} from "../provider/StatsProvider.tsx";
import {StatsChart} from "./StatsChart.tsx";
import {StatsControls} from "../controls/StatsControls.tsx";

interface StreamStatsProps {
  stats: Stats
}

export const StreamStats: Component<StreamStatsProps> = (props) => {
  return (
    <StatsSettingsProvider>
      <StatsProvider stats={props.stats}>
        <Chart/>
      </StatsProvider>
    </StatsSettingsProvider>
  );
}

const Chart: Component = () => {
  const {chartOptions} = useStats()
  return (
    <div class="flex flex-col gap-3">
      <StatsControls/>
      <div class="rounded-group bg-surface-strong ring-line p-2 ring-1">
        <StatsChart height={400} option={chartOptions()}/>
      </div>
    </div>
  );
}

//         <ECharts height={400} width={800} option={chartOptions()}/>
