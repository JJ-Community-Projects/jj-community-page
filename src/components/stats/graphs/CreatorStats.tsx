import {type Component} from "solid-js";
import type {Stats} from "../../../lib/model/Stats.ts";
import {ECharts} from "echarts-solid";
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
    <div>
      <CreatorStatsControls/>
      <div class={'bg-white'}>
        <ECharts height={400} width={800} option={chartOptions()}/>
      </div>
    </div>
  );
}
