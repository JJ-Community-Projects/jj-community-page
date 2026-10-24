import { type ParentComponent, Show } from 'solid-js'
import { YogsScheduleProvider } from './provider/YogsScheduleProvider.tsx'
import { CreatorFilterProvider } from './provider/CreatorFilterProvider.tsx'
import { YogsScheduleWeek } from './YogsScheduleWeek.tsx'
import { MobileYogsSchedule } from './mobile/MobileYogsSchedule.tsx'
import {
  type CompactYogsSchedule,
  expandYogsSchedule,
} from '../../../lib/utils/compactYogsSchedule.ts'
import { YogsCreatorPills } from '../creators/YogsCreatorPills.tsx'

interface YogsResponsiveScheduleProps {
  schedule: CompactYogsSchedule
  /** "Yogs & Friends" pills after the children; they need the same creators, so no second island. */
  showCreators?: boolean
}

/**
 * Desktop week grid and mobile day list in one island: the schedule is serialized once, and the
 * page's `.desktop-schedule` / `.mobile-schedule` media queries pick the view. Server-rendered and
 * hydrated (see YogsScheduleProvider for what waits until the island is mounted). Children (an
 * Astro slot) go between the schedule and the creator pills.
 */
export const YogsResponsiveSchedule: ParentComponent<
  YogsResponsiveScheduleProps
> = (props) => {
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
        {props.children}
        <Show when={props.showCreators}>
          <YogsCreatorPills creators={schedule.creators} />
        </Show>
      </CreatorFilterProvider>
    </YogsScheduleProvider>
  )
}
