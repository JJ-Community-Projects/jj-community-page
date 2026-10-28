import { type Component, Show } from 'solid-js'
import { Countdown } from '../../ui/Countdown'
import { Tile } from '../../ui/Tile'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import {
  useYogsSchedule,
  YogsScheduleProvider,
} from './provider/YogsScheduleProvider.tsx'
import { CreatorFilterProvider } from './provider/CreatorFilterProvider.tsx'
import { YogsScheduleWeek } from './YogsScheduleWeek.tsx'
import { MobileYogsSchedule } from './mobile/MobileYogsSchedule.tsx'
import {
  Creators,
  ScheduleNotice,
} from './YogsCurrentScheduleLoader.tsx'
import { HeadlinerTicker } from '../../features/schedules/common/HeadlinerTicker.tsx'
import {
  type CompactYogsSchedule,
  expandYogsSchedule,
} from '../../../lib/utils/compactYogsSchedule.ts'
import {
  useIsAfterJJEnd,
  useIsBeforeJJ,
  useJJStartCountdown,
} from '../../../lib/utils/jjDates.ts'
import { useNow } from '../../../lib/utils/useNow.ts'

interface YogsSeasonScheduleProps {
  schedule: CompactYogsSchedule
}

/**
 * The current Yogscast schedule on /yogs: the same layout as YogsCurrentScheduleLoader's schedule
 * view, but server-rendered from the schedule the page loaded and hydrated, with desktop and mobile
 * sharing one provider (one serialized schedule).
 */
export const YogsSeasonSchedule: Component<YogsSeasonScheduleProps> = (
  props,
) => {
  const schedule = expandYogsSchedule(props.schedule)
  return (
    <YogsScheduleProvider schedule={schedule} creators={schedule.creators}>
      <CreatorFilterProvider>
        <div class={'flex flex-col items-center justify-center gap-2'}>
          <CollectionCountdown />
          <div class="desktop-schedule flex w-full flex-col items-center justify-center gap-2">
            <YogsScheduleWeek />
            <UpdatedAt year />
          </div>
          <Ticker />
          <div class="mobile-schedule flex w-full flex-col items-center justify-center gap-2">
            <MobileYogsSchedule />
            <UpdatedAt />
          </div>
          <Creators creators={schedule.creators} />
          <ScheduleNotice class="text-on-canvas-muted" />
        </div>
      </CreatorFilterProvider>
    </YogsScheduleProvider>
  )
}

const CollectionCountdown: Component = () => {
  const now = useNow()
  const isBeforeJJ = useIsBeforeJJ()
  const isAfterJJEnd = useIsAfterJJEnd()
  const jjStartCountdown = useJJStartCountdown()

  const showCountdown = () => {
    const isNov = now().month === 11
    const isDec = now().month === 12
    return isBeforeJJ() && !isAfterJJEnd() && (isNov || isDec)
  }

  return (
    <Show when={showCountdown()}>
      <Tile pad="sm" class="flex justify-center">
        <Countdown
          size="sm"
          label="The collection goes live in"
          duration={jjStartCountdown()}
        />
      </Tile>
    </Show>
  )
}

/** Headliners come from the API; rendered after hydration only (nothing to show on the server). */
const Ticker: Component = () => {
  const { mounted } = useYogsSchedule()
  return (
    <div class={'max-w-[80vw]'}>
      <Show when={mounted()}>
        <QueryClientProvider client={new QueryClient()}>
          <HeadlinerTicker />
        </QueryClientProvider>
      </Show>
    </div>
  )
}

const UpdatedAt: Component<{ year?: boolean }> = (props) => {
  const { schedule, toDateTime } = useYogsSchedule()
  return (
    <Show when={schedule.updatedAt}>
      {(updatedAt) => (
        <p class={'text-center text-white'}>
          Last Updated{' '}
          {toDateTime(updatedAt()).toLocaleString({
            ...(props.year && { year: 'numeric' }),
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            timeZoneName: 'short',
          })}
        </p>
      )}
    </Show>
  )
}
