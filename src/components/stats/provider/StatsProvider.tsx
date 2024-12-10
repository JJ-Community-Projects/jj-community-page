import {createContext, type ParentComponent, useContext} from "solid-js";
import {
  type Series,
  type SingleData,
  type Stats,
  type StatsStream,
  StatsValueType,
  type XAxis
} from "../../../lib/model/Stats.ts";
import {useStatsSettings} from "./StatsSettings.tsx";
import {type EChartsOption} from "echarts";
import {useTooltipFormatter} from "./useTooltipFormatter.ts";
import {DateTime} from "luxon";

const round = (n: number, r = 2) => {
  return +n.toFixed(r)
}
const useStatsHook = (
  stats: Stats
) => {
  const {
    settings,
  } = useStatsSettings()

  const value = (stream: StatsStream) => {
    switch (settings.value) {
      case StatsValueType.Total:
        return stream.total
      case StatsValueType.TotalPerMinute:
        return stream.total_per_minute
      case StatsValueType.Yogs:
        return stream.yogs
      case StatsValueType.YogsPerMinute:
        return stream.yogs_per_minute
      case StatsValueType.Fundraiser:
        return stream.fundraiser
      case StatsValueType.FundraiserPerMinute:
        return stream.fundraiser_per_minute
      case StatsValueType.Collections:
        return stream.collections
      case StatsValueType.CollectionsPerMinute:
        return stream.collections_per_minute
      case StatsValueType.Donations:
        return stream.donations
      case StatsValueType.DonationsPerMinute:
        return stream.donations_per_minute
      case StatsValueType.AvgDonationAmount:
        return stream.avg_donation_amount

    }
  }

  const streamToData = (stream: StatsStream): SingleData => {
    return {
      name: stream.title,
      value: value(stream),
      itemStyle: {
        color: stream.color,
      },
    }
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
      // data: labels(),
    }
  }

  const sortByValue = (a: StatsStream, b: StatsStream) => {
    return value(b) - value(a)
  }

  const sortByStartDate = (a: StatsStream, b: StatsStream) => {
    return DateTime.fromISO(a.start).toMillis() - DateTime.fromISO(b.start).toMillis()
  }

  const filterDay1 = (stream: StatsStream) => {
    const start = DateTime.fromISO(stream.start)
    return start.day !== 1
  }

  const data = () => {
    let s: StatsStream[] = []
    if (settings.bar === 'streams') {
      s = stats.streams
    } else {
      s = stats.hours
    }

    const nightStart = 23
    const nightEnd = 11

    if (!settings.showNights) {
      s = s.filter(stream => !stream.title.includes('Night'))

     /*   .filter(stream => {
          const start = DateTime.fromISO(stream.start)
          const end = DateTime.fromISO(stream.end)
          const startHour = start.hour
          const endHour = end.hour
        })
      */
    }

    if (!settings.showDay1) {
      s = s.filter(filterDay1)
    }
    if (settings.onlyTop15) {
      s = s.sort(sortByValue).slice(0, 15)
    }
    if (settings.order === 'date') {
      s = s.sort(sortByStartDate)
    } else {
      s = s.sort(sortByValue)
    }
    return s
    // return s.map(streamToData)
  }

  const {formatter} = useTooltipFormatter(data)

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
        formatter: formatter(),
      },
      data: data().map(streamToData),
    }
  }

  const yAxisName = () => {
    switch (settings.value) {
      case StatsValueType.Total:
        return 'Total'
      case StatsValueType.TotalPerMinute:
        return 'Total per minute'
      case StatsValueType.Yogs:
        return 'Yogs'
      case StatsValueType.YogsPerMinute:
        return 'Yogs per minute'
      case StatsValueType.Fundraiser:
        return 'Fundraiser'
      case StatsValueType.FundraiserPerMinute:
        return 'Fundraiser per minute'
      case StatsValueType.Collections:
        return 'Collections'
      case StatsValueType.CollectionsPerMinute:
        return 'Collections per minute'
      case StatsValueType.Donations:
        return 'Donations'
      case StatsValueType.DonationsPerMinute:
        return 'Donations per minute'
      case StatsValueType.AvgDonationAmount:
        return 'Average donation amount'
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
      series: series(),
    }
  }

  return {chartOptions}
}

interface StatsProps {
  stats: Stats
}

const StatsContext = createContext<ReturnType<typeof useStatsHook>>();

export const StatsProvider: ParentComponent<StatsProps> = (props) => {
  const hook = useStatsHook(
    props.stats,
  )
  return (
    <StatsContext.Provider value={hook}>
      {props.children}
    </StatsContext.Provider>
  );
}
export const useStats = () => useContext(StatsContext)!
