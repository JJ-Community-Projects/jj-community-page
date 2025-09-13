import { type Component } from 'solid-js'
import { ScheduleProvider } from './common/ScheduleProvider.tsx'
import {
  DaysAccordion,
  NextThreeStreams,
  UserSchedulePageBodyDesktop,
} from './desktop/UserSchedulePageBodyDesktop.tsx'
import type { FullSchedule } from '../../../lib/orpc/public/schemas/schedules.ts'

interface UserSchedulePageProps {
  initSchedule: FullSchedule
}

export const UserSchedulePage: Component<UserSchedulePageProps> = (props) => {
  // Header/title should be rendered by the page shell (Astro). Keep this island focused on body content only.
  return (
    <ScheduleProvider schedule={props.initSchedule}>
      <div class="mx-auto w-full max-w-7xl">
        <UserSchedulePageBodyDesktop />
      </div>
    </ScheduleProvider>
  )
}

// Focused islands for page-level section composition
export const NextStreamsIsland: Component<UserSchedulePageProps> = (props) => (
  <ScheduleProvider schedule={props.initSchedule}>
    <NextThreeStreams />
  </ScheduleProvider>
)

export const FullScheduleIsland: Component<UserSchedulePageProps> = (props) => (
  <ScheduleProvider schedule={props.initSchedule}>
    <DaysAccordion />
  </ScheduleProvider>
)
