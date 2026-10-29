import { type Component, Match, Show, Switch } from 'solid-js'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client.ts'
import { QueryClient } from '@tanstack/query-core'
import { JJStartCountdown, JJStartTimes } from '../../ui/Countdown'
import { Tile } from '../../ui/Tile'
import { Alert } from '../../ui/Status'
import { PlaceholderSchedule } from './placeholder/PlaceholderSchedule.tsx'
import { YogsSeasonBody } from './YogsSeasonSchedule.tsx'
import { YogsScheduleNotice } from '../common/YogsScheduleNotice.tsx'

const refetch = {
  staleTime: 60_000,
  refetchInterval: 60_000 * 5,
  refetchOnMount: true,
  refetchOnReconnect: true,
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: false,
}

/**
 * The current schedule for the client-only pages (/pwa/yogs, /embed/yogs): fetches config and
 * schedule, then renders the same season layout as /yogs.
 */
export const YogsCurrentScheduleLoader: Component = () => {
  return (
    <div class={'min-h-20'}>
      <QueryClientProvider client={new QueryClient()}>
        <ConfigLoader />
      </QueryClientProvider>
    </div>
  )
}

const ConfigLoader: Component = () => {
  const config = useQuery(() => orpcPrivate.yogs.config.queryOptions(refetch))
  return (
    <Switch>
      <Match when={config.data}>
        <Show when={config.data?.showSchedule} fallback={<NotAnnounced />}>
          <Body />
        </Show>
      </Match>
    </Switch>
  )
}

/** Before the schedule is shown: countdown and start times. */
const NotAnnounced: Component = () => (
  <Tile class="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 text-center">
    <h1 class="text-xl font-bold tracking-tight sm:text-2xl">
      Yogscast Jingle Jam Schedule
    </h1>
    <p class="text-fg-muted text-sm sm:text-base">
      The Yogscast Jingle Jam in your timezone with links to participants, VODs
      and more.
    </p>
    <JJStartCountdown />
    <JJStartTimes class="max-w-lg" />
    <p class="text-sm">
      The <span class={'font-bold'}>Yogscast Jingle Jam Schedule</span> will be
      shown once it is announced on social media.
    </p>
    <YogsScheduleNotice variant="tile" />
  </Tile>
)

const Body: Component = () => {
  const schedule = useQuery(() =>
    orpcPrivate.yogs.schedule.queryOptions(refetch),
  )

  return (
    <Switch>
      <Match when={schedule.data}>
        {(data) => <YogsSeasonBody schedule={data()} />}
      </Match>
      <Match when={schedule.isPending}>
        <PlaceholderSchedule />
      </Match>
      <Match when={schedule.error}>
        <Alert tone="danger" class="mx-auto max-w-2xl">
          {schedule.error?.message}
        </Alert>
      </Match>
    </Switch>
  )
}
