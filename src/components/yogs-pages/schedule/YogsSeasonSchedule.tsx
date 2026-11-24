import { type Component, Show } from 'solid-js'
import { Countdown } from '../../ui/Countdown'
import { Tile } from '../../ui/Tile'
import { cn } from '../../ui/cn'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import {
  useYogsSchedule,
  YogsScheduleProvider,
} from './provider/YogsScheduleProvider.tsx'
import { CreatorFilterProvider } from './provider/CreatorFilterProvider.tsx'
import { YogsScheduleWeek } from './YogsScheduleWeek.tsx'
import { MobileYogsSchedule } from './mobile/MobileYogsSchedule.tsx'
import { YogsAndFriends } from '../creators/YogsAndFriends.tsx'
import { YogsScheduleNotice } from '../common/YogsScheduleNotice.tsx'
import { HeadlinerTicker } from '../../features/schedules/common/HeadlinerTicker.tsx'
import {
  type CompactYogsSchedule,
  expandYogsSchedule,
} from '../../../lib/utils/compactYogsSchedule.ts'
import type { YogsSchedule } from '../../../lib/orpc/private/yogs/contract.ts'
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
 * The current Yogscast schedule on /yogs, server-rendered from the schedule the page loaded and
 * hydrated (one serialized schedule for desktop and mobile).
 */
export const YogsSeasonSchedule: Component<YogsSeasonScheduleProps> = (
  props,
) => <YogsSeasonBody schedule={expandYogsSchedule(props.schedule)} />

/**
 * The season layout: countdown, grid / timeline, a panel with "Updated" + disclaimer + Yogscast
 * links + community note, headliner ticker, Yogs & Friends. Shared by /yogs and by the PWA / embed
 * loader, which fetches the schedule first.
 */
export const YogsSeasonBody: Component<{ schedule: YogsSchedule }> = (props) => {
  const schedule = props.schedule
  return (
    <YogsScheduleProvider schedule={schedule} creators={schedule.creators}>
      <CreatorFilterProvider>
        <div class={'flex w-full flex-col items-center justify-center gap-4'}>
          <CollectionCountdown />
          <div class="desktop-schedule season-schedule flex w-full flex-col items-center justify-center">
            <DesktopWeek />
          </div>
          <div class="mobile-schedule flex w-full flex-col items-center justify-center">
            <MobileYogsSchedule />
          </div>
          <Tile pad="md" class="w-full max-w-2xl">
            <YogsScheduleNotice variant="panel">
              <UpdatedAt />
            </YogsScheduleNotice>
          </Tile>
          <Ticker />
          <YogsAndFriends creators={schedule.creators} />
        </div>
      </CreatorFilterProvider>
    </YogsScheduleProvider>
  )
}

/** The week grid. Shrinks to the grid; .yogs-frame gets the grid's sizes. */
const DesktopWeek: Component = () => {
  const { times } = useYogsSchedule()
  return (
    <div
      class="yogs-frame flex flex-col items-end"
      style={{ '--yogs-rows': 2 + 3 * times().length }}
    >
      <YogsScheduleWeek />
    </div>
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
    <div class={'max-w-[calc(var(--page-w)*0.8)]'}>
      <Show when={mounted()}>
        <QueryClientProvider client={new QueryClient()}>
          <HeadlinerTicker />
        </QueryClientProvider>
      </Show>
    </div>
  )
}

/**
 * The panel's first line. Hidden (space kept) until mounted: the server render is in London time
 * and the line should only ever show the viewer's timezone.
 */
const UpdatedAt: Component = () => {
  const { schedule, toDateTime, mounted } = useYogsSchedule()
  return (
    <Show when={schedule.updatedAt}>
      {(updatedAt) => (
        <p class={cn('font-semibold text-fg', !mounted() && 'invisible')}>
          Updated{' '}
          {toDateTime(updatedAt()).toLocaleString({
            year: 'numeric',
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
