import { type Component, For, Show } from 'solid-js'
import { DateTime } from 'luxon'
import { FaSolidPlay } from 'solid-icons/fa'
import {
  ScheduleProvider,
  useScheduleTest,
} from './common/ScheduleProvider.tsx'
import { StreamTimeRow, UpcomingStreamRow } from './common/StreamCard.tsx'
import type { FullSchedule } from '../../../lib/orpc/public/schemas/schedules.ts'
import { DateDivider } from '../../ui/Labels'
import { Section } from '../../ui/Tile'

interface UserSchedulePageProps {
  initSchedule: FullSchedule
}

/** The next three streams of the schedule, with the owner on each row. */
const NextStreams: Component = () => {
  const { nextThreeStreams, schedule } = useScheduleTest()
  return (
    <Section title="Next Streams" icon={<FaSolidPlay />}>
      <Show
        when={nextThreeStreams().length > 0}
        fallback={<p class="text-fg-muted text-sm">No upcoming streams.</p>}
      >
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <For each={nextThreeStreams()}>
            {(stream) => (
              <UpcomingStreamRow stream={stream} user={schedule.owner} />
            )}
          </For>
        </div>
      </Show>
    </Section>
  )
}

/** Every day of the schedule: a date divider and its streams as time-block rows. */
const ScheduleDays: Component = () => {
  const { days } = useScheduleTest()
  const label = (day: Date) =>
    DateTime.fromJSDate(day, { zone: 'utc' })
      .toLocal()
      .toLocaleString({ weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <section class="flex flex-col gap-3" aria-label="Schedule">
      <h2 class="sr-only">Schedule</h2>
      <For each={days()}>
        {(day) => (
          <div class="flex flex-col gap-2">
            <DateDivider>{label(day.day)}</DateDivider>
            <Show
              when={day.streams.length > 0}
              fallback={
                <p class="text-on-canvas-muted text-center text-sm">
                  No streams scheduled for this day.
                </p>
              }
            >
              <div class="flex flex-col gap-2">
                <For each={day.streams}>
                  {(stream) => <StreamTimeRow stream={stream} />}
                </For>
              </div>
            </Show>
          </div>
        )}
      </For>
    </section>
  )
}

// Focused islands for page-level section composition
export const NextStreamsIsland: Component<UserSchedulePageProps> = (props) => (
  <ScheduleProvider schedule={props.initSchedule}>
    <NextStreams />
  </ScheduleProvider>
)

export const FullScheduleIsland: Component<UserSchedulePageProps> = (props) => (
  <ScheduleProvider schedule={props.initSchedule}>
    <ScheduleDays />
  </ScheduleProvider>
)
