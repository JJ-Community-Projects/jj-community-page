import {type Stats, type StatsStream, StatsValueType} from "../../../lib/model/Stats.ts";
import {DateTime} from "luxon";
import {useStatsSettings} from "./StatsSettings.tsx";

export const useTooltipFormatter = (streams: () => StatsStream[]) => {
  const {settings} = useStatsSettings()
  const yogsFormatterPounds = (params: any) =>  {
    const dataIndex = params.dataIndex
    const slot = streams().at(dataIndex)!
    const date = DateTime.fromISO(slot.start)
    const f = date.toFormat('MMM dd, HH:mm')
    return `
                  ${params.seriesName}
                  <br>${params.marker}${slot.title} ${f} ${date.offsetNameShort}
                  <span style='float: right; margin-left: 20px'><b>${params.value}£</b></span>`
  }
  const yogsFormatterPercentage = (params: any) =>  {
    const dataIndex = params.dataIndex
    const slot = streams().at(dataIndex)!
    const date = DateTime.fromISO(slot.start)
    const f = date.toFormat('MMM dd, HH:mm')
    return `
                  ${params.seriesName}
                  <br>${params.marker}${slot.title} ${f} ${date.offsetNameShort}
                  <span style='float: right; margin-left: 20px'><b>${params.value}%</b></span>`
  }
  const yogsFormatter = (params: any) =>  {
    const dataIndex = params.dataIndex
    const slot = streams().at(dataIndex)!
    const date = DateTime.fromISO(slot.start)
    const f = date.toFormat('yy MMM dd, HH:mm')
    return `
                  ${params.seriesName}
                  <br>${params.marker}${slot.title} ${f} ${date.offsetNameShort}
                  <span style='float: right; margin-left: 20px'><b>${params.value}</b></span>`
  }
  /*
  const hoursFormatterPounds = (params: any) =>  {
    const dataIndex = params.dataIndex
    const slot = hours().at(dataIndex)
    const date = DateTime.fromISO(slot.start)
    const f = date.toFormat('MMM dd, HH:mm')
    return `
                  ${params.seriesName}
                  <br>${params.marker} ${f} ${date.offsetNameShort}
                  <span style='float: right; margin-left: 20px'><b>${params.value}£</b></span>`
  }
  const hoursFormatterPercantage = (params: any) =>  {
    const dataIndex = params.dataIndex
    const slot = hours().at(dataIndex)
    const date = DateTime.fromISO(slot.start)
    const f = date.toFormat('MMM dd, HH:mm')
    return `
                  ${params.seriesName}
                  <br>${params.marker} ${f} ${date.offsetNameShort}
                  <span style='float: right; margin-left: 20px'><b>${params.value}%</b></span>`
  }
  const hoursFormatter = (params: any) =>  {
    const dataIndex = params.dataIndex
    const slot = hours().at(dataIndex)
    const date = DateTime.fromISO(slot.start)
    const f = date.toFormat('MMM dd, HH:mm')
    return `
                  ${params.seriesName}
                  <br>${params.marker} ${f} ${date.offsetNameShort}
                  <span style='float: right; margin-left: 20px'><b>${params.value}£</b></span>`
  }
  */

  const formatter = () => {

    return yogsFormatter
  }

  return {
    formatter
  }
}
