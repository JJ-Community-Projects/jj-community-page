import {type Component} from "solid-js";
import {StatsProvider, useStats} from "./StatsProvider.tsx";
import {StatsSettingsProvider} from "./StatsSettings.tsx";
import Stats2023 from '../../stats/2023.json'
import Stats2022 from '../../stats/2022.json'
import Stats2021 from '../../stats/2022.json'
import All from '../../stats/all.json'
import {type Stats} from "../../lib/model/Stats.ts";
import {ECharts} from 'echarts-solid'
import {StatsControls} from "./StatsControls.tsx";

export const StatsPageRoot: Component = (props) => {
  const stats2023: Stats = Stats2023
  const stats2022: Stats = Stats2022
  const stats2021: Stats = Stats2021
  const all: Stats = All

  return (
    <div class={'flex flex-col gap-10 text-white'}>
      <div class={'flex flex-col gap-2'}>
        <p class={'text-lg'}>2021-2023</p>
        <StatsSettingsProvider>
          <StatsProvider stats={all}>
            <Chart/>
          </StatsProvider>
        </StatsSettingsProvider>
      </div>
      <div class={'flex flex-col gap-2'}>
        <p class={'text-lg'}>2023</p>
        <StatsSettingsProvider>
          <StatsProvider stats={stats2023}>
            <Chart/>
          </StatsProvider>
        </StatsSettingsProvider>
      </div>
      <div class={'flex flex-col gap-2'}>
        <p class={'text-lg'}>2022</p>
        <StatsSettingsProvider>
          <StatsProvider stats={stats2022}>
            <Chart/>
          </StatsProvider>
        </StatsSettingsProvider>
      </div>
      <div class={'flex flex-col gap-2'}>
        <p class={'text-lg'}>2021</p>
        <StatsSettingsProvider>
          <StatsProvider stats={stats2021}>
            <Chart/>
          </StatsProvider>
        </StatsSettingsProvider>
      </div>

    </div>
  );
}


const Chart: Component = () => {
  const {chartOptions} = useStats()
  return (
    <div>
      <div class={'bg-white'}>
        <ECharts height={400} width={800} option={chartOptions()}/>
      </div>
      <StatsControls/>
    </div>
  )
    ;
}
