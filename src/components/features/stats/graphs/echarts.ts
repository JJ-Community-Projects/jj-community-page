import { init, use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Only the parts the stats charts use (see StatsProvider / CreatorStatsProvider). A new chart type or
// option component has to be registered here, or echarts ignores it.
use([
  BarChart,
  LineChart,
  DataZoomComponent,
  GridComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
])

export { init }
