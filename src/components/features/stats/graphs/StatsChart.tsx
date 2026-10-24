import {type Component, createEffect, on, onCleanup, onMount} from "solid-js";
import type {EChartsOption} from "echarts";
import type {EChartsType} from "echarts/core";

interface StatsChartProps {
  option: EChartsOption
  width: number
  height: number
}

/**
 * Renders an echarts chart. echarts is loaded on first mount, so the stats page doesn't download it
 * until a year is opened.
 */
export const StatsChart: Component<StatsChartProps> = (props) => {
  let element!: HTMLDivElement
  let chart: EChartsType | undefined
  let disposed = false

  onMount(async () => {
    const {init} = await import('./echarts.ts')
    if (disposed) return
    chart = init(element, undefined, {width: props.width, height: props.height})
    chart.setOption(props.option)
  })

  createEffect(on(() => props.option, (option) => chart?.setOption(option), {defer: true}))

  onCleanup(() => {
    disposed = true
    chart?.dispose()
  })

  return <div ref={element} style={{width: `${props.width}px`, height: `${props.height}px`}}/>
}
