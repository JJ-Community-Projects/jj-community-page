import {type Component} from "solid-js";
import type {Stats} from "../../../lib/model/Stats.ts";
import {StatsSettingsProvider} from "../provider/StatsSettings.tsx";
import {StatsProvider, useStats} from "../provider/StatsProvider.tsx";
import {ECharts} from "echarts-solid";
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
    <div>
      <StatsControls/>
      <div class={'bg-white'}>
        <ECharts height={400} width={800} option={chartOptions()}/>
      </div>
    </div>
  );
}

//         <ECharts height={400} width={800} option={chartOptions()}/>
