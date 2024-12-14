import {createContext, type ParentComponent, useContext} from "solid-js";
import {
  type Series,
  type SingleData,
  type Stats,
  type StatsCreator,
  StatsValueTypeCreator,
  type XAxis
} from "../../../lib/model/Stats.ts";
import {type EChartsOption} from "echarts";
import {useCreatorStatsSettings} from "./CreatorStatsSettings.tsx";
import {useCreator} from "./CreatorProvider.tsx";

const round = (n: number, r = 2) => {
  return +n.toFixed(r)
}
const useStatsHook = (
  stats: Stats
) => {
  const {
    settings,
  } = useCreatorStatsSettings()

  const avsAppearance = () => {
    const total = stats.creators.reduce((acc, c) => acc + c.appearance, 0)
    return round(total / stats.creators.length)
  }

  const avsMinutes = () => {
    const total = stats.creators.reduce((acc, c) => acc + c.minutes, 0)
    return round(total / stats.creators.length)
  }

  const {color, name} = useCreator()

  const value = (stream: StatsCreator) => {
    switch (settings.value) {
      case StatsValueTypeCreator.Appearance:
        return stream.appearance
      case StatsValueTypeCreator.Minutes:
        return stream.minutes
    }
  }

  const streamToData = (c: StatsCreator): SingleData => {
    const id = c.id
    return {
      name: name(id),
      value: value(c),
      itemStyle: {
        color: color(id),
      },
    }
  }

  const labels = () => {
    return data().map(c => name(c.id))
  }

  const xAxis = (): XAxis => {
    return {
      axisLabel: {
        rotate: 45,
        hideOverlap: false,
        fontSize: settings.onlyTop15 ? 12 : 8,
      },
      splitLine: {
        lineStyle: {
          type: 'solid',
          width: 2,
        },
      },
      type: 'category',
      data: labels(),
    }
  }

  const sortByValue = (a: StatsCreator, b: StatsCreator) => {
    return value(b) - value(a)
  }


  const data = () => {
    let s = stats.creators.sort(sortByValue)
    if (settings.onlyTop15) {
      s = s.slice(0, 15)
    }
    return s
    // return s.map(streamToData)
  }


  const series = (): Series => {
    return {
      name: 'Total',
      type: 'bar',
      stack: 'total',
      label: {
        show: false,
      },
      tooltip: {
        show: true,
        // formatter: formatter(),
      },
      data: data().map(streamToData),
    }
  }

  const avgValue = () => {
    switch (settings.value) {
      case StatsValueTypeCreator.Appearance:
        return data().map(_ => avsAppearance())
      case StatsValueTypeCreator.Minutes:
        return data().map(_ => avsMinutes())
    }
    return []
  }

  const avsSeries = (): Series => {
    return {
      name: 'Average',
      type: 'line',
      data: avgValue(),
      color: 'transparent',
      markLine: {
        data: [
          {
            name: 'Average',
            type: 'average',
          },
        ],
        lineStyle: {
          color: 'red',
        },
      },
    }
  }

  const yAxisName = () => {
    switch (settings.value) {
      case StatsValueTypeCreator.Appearance:
        return 'Appearance'
      case StatsValueTypeCreator.Minutes:
        return 'Minutes'
    }
  }

  const chartOptions = (): EChartsOption => {
    return {
      backgroundColor: '#fff',
      tooltip: {
        trigger: 'item',
      },
      dataZoom: {
        show: data().length > (8 * 14),
        // show: dataType() === ChartTimeType.hourly,
      },
      // legend: legend(),
      grid: {
        show: true,
        top: '30px',
        left: '10px',
        right: '4px',
        bottom: '4px',
        containLabel: true,
      },
      yAxis: {
        name: yAxisName(),
        nameLocation: 'end',
        type: 'value',
        show: true,
        splitLine: {
          lineStyle: {
            type: 'solid',
            width: 2,
          },
        },
        axisLabel: {
          rotate: 45,
          hideOverlap: true,
          fontSize: 10,
        },
      },
      xAxis: xAxis(),
      series: [
        avsSeries(),
        series(),
      ],
    }
  }

  return {chartOptions}
}

interface CreatorStatsProps {
  stats: Stats
}

const CreatorStatsContext = createContext<ReturnType<typeof useStatsHook>>();

export const CreatorStatsProvider: ParentComponent<CreatorStatsProps> = (props) => {
  const hook = useStatsHook(
    props.stats,
  )
  return (
    <CreatorStatsContext.Provider value={hook}>
      {props.children}
    </CreatorStatsContext.Provider>
  );
}
export const useCreatorStats = () => useContext(CreatorStatsContext)!
