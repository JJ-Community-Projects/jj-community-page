import { type Component } from 'solid-js'
import { YogsScheduleProvider } from './provider/YogsScheduleProvider.tsx'
import { YogsScheduleWeek } from './YogsScheduleWeek.tsx'
import { CreatorFilterProvider } from './provider/CreatorFilterProvider.tsx'
import type {
  YogsCreator,
  YogsSchedule,
} from '../../../lib/orpc/private/yogs/contract.ts'

interface YogsScheduleComponentProps {
  schedule: YogsSchedule
  creators: YogsCreator[]
}

export const YogsScheduleComponent: Component<YogsScheduleComponentProps> = (
  props,
) => {
  return (
    <YogsScheduleProvider schedule={props.schedule} creators={props.creators}>
      <CreatorFilterProvider>
        <YogsScheduleWeek />
      </CreatorFilterProvider>
    </YogsScheduleProvider>
  )
}
