import { type Component, Show } from 'solid-js'
import { YogsScheduleProvider } from './provider/YogsScheduleProvider.tsx'
import { CreatorFilterProvider } from './provider/CreatorFilterProvider.tsx'
import { YogsScheduleWeek } from './YogsScheduleWeek.tsx'
import { MobileYogsSchedule } from './mobile/MobileYogsSchedule.tsx'
import {
  type CompactYogsSchedule,
  expandYogsSchedule,
} from '../../../lib/utils/compactYogsSchedule.ts'
import { YogsAndFriends } from '../creators/YogsAndFriends.tsx'
import { YogsScheduleNotice } from '../common/YogsScheduleNotice.tsx'

interface YogsResponsiveScheduleProps {
  schedule: CompactYogsSchedule
  /** "Yogs & Friends" after the notice; they need the same creators, so no second island. */
  showCreators?: boolean
}

/**
 * Desktop week grid and mobile day list in one island (hub, archive pages): the schedule is
 * serialized once, and yogs-schedule.css picks the view. Server-rendered and hydrated (see
 * YogsScheduleProvider for what waits until the island is mounted). Then the notice and, when
 * asked for, Yogs & Friends.
 */
export const YogsResponsiveSchedule: Component<YogsResponsiveScheduleProps> = (
  props,
) => {
  const schedule = expandYogsSchedule(props.schedule)
  return (
    <YogsScheduleProvider schedule={schedule} creators={schedule.creators}>
      <CreatorFilterProvider>
        <div class="desktop-schedule flex w-full flex-col items-center">
          <YogsScheduleWeek />
        </div>
        <div class="mobile-schedule w-full">
          <MobileYogsSchedule />
        </div>
        <YogsScheduleNotice variant="canvas" class="mt-2" />
        <Show when={props.showCreators}>
          <YogsAndFriends creators={schedule.creators} />
        </Show>
      </CreatorFilterProvider>
    </YogsScheduleProvider>
  )
}
