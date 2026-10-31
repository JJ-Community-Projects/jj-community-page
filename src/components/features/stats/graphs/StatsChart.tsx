import {type Component, createEffect, on, onCleanup, onMount} from "solid-js";
import type {EChartsOption} from "echarts";
import type {EChartsType} from "echarts/core";

interface StatsChartProps {
  option: EChartsOption
  /** Fixed width in px; without it the chart fills its container and follows its size. */
  width?: number
  height: number
}

const isDark = () => document.documentElement.dataset.theme === 'dark'

// The options carry a white background for the light page; in dark mode the chart sits on the tile
const themed = (option: EChartsOption): EChartsOption =>
  isDark() ? {...option, backgroundColor: 'transparent'} : option

/**
 * Renders an echarts chart. echarts is loaded on first mount, so the stats page doesn't download it
 * until a year is opened. Follows the site theme: echarts' dark theme while the page is dark.
 */
export const StatsChart: Component<StatsChartProps> = (props) => {
  let element!: HTMLDivElement
  let chart: EChartsType | undefined
  let init: typeof import('./echarts.ts').init | undefined
  let dark = false
  let disposed = false
  const observer = new ResizeObserver(() => chart?.resize())
  // echarts can't switch themes on a live chart, so a theme change renders it anew
  const themeObserver = new MutationObserver(() => {
    if (isDark() !== dark) render()
  })

  const render = () => {
    if (!init) return
    chart?.dispose()
    dark = isDark()
    chart = init(element, dark ? 'dark' : undefined, {width: props.width, height: props.height})
    chart.setOption(themed(props.option))
  }

  onMount(async () => {
    init = (await import('./echarts.ts')).init
    if (disposed) return
    render()
    if (props.width === undefined) observer.observe(element)
    themeObserver.observe(document.documentElement, {attributeFilter: ['data-theme']})
  })

  createEffect(on(() => props.option, (option) => chart?.setOption(themed(option)), {defer: true}))

  onCleanup(() => {
    disposed = true
    observer.disconnect()
    themeObserver.disconnect()
    chart?.dispose()
  })

  return (
    <div
      ref={element}
      style={{width: props.width ? `${props.width}px` : '100%', height: `${props.height}px`}}
    />
  )
}
