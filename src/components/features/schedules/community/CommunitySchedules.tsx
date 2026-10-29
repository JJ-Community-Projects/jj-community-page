import { type Component, createMemo, For, Show } from 'solid-js'
import { useIsJJ } from '../../../../lib/utils/jjDates.ts'
import { createI18n, I18nProvider } from 'solid-i18n'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { useLocale } from '@kobalte/core'
import type { CharitiesStatic } from '../../../../content/schema.ts'
import { CurrencyProvider } from '../../../common/CurrencyProvider.tsx'
import { CharityOverviewProvider } from '../../../common/charityOverview/CharityOverviewProvider.tsx'
import { UpcomingStreamRow } from '../common/StreamCard.tsx'
import {
  CommunityCharitiesOverview,
  CommunityCharitiesOverviewMobile,
} from '../../../common/charityOverview/CommunityCharitiesOverview.tsx'
import type {
  FullCommunitySchedule,
  UserStream,
} from '../../../../lib/orpc/private/jjData/contract.ts'
import { DateTime } from 'luxon'
import { useNow } from '../../../../lib/utils/useNow.ts'
import { HeadlinerTicker } from '../common/HeadlinerTicker.tsx'
import { JJStartCountdown } from '../../../ui/Countdown'
import { DateDivider } from '../../../ui/Labels'
import { Alert, Spinner } from '../../../ui/Status'
import { Tile } from '../../../ui/Tile'

export const CommunitySchedulesPage: Component<{
  charitiesData?: CharitiesStatic
}> = (props) => {
  const i18n = createI18n({ language: useLocale().locale() })
  return (
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider i18n={i18n}>
        <CurrencyProvider>
          <CharityOverviewProvider charitiesData={props.charitiesData}>
            <Body />
          </CharityOverviewProvider>
        </CurrencyProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}

const Body: Component = () => {
  const isJJ = useIsJJ()
  const scheduleQuery = useQuery(() =>
    orpcPrivate.jj.fullSchedule.queryOptions({
      staleTime: 60_000 * 12,
      refetchInterval: 60_000 * 15,
    }),
  )

  return (
    <div class="flex w-full flex-col gap-3">
      <Show when={!isJJ()}>
        <Tile class="flex justify-center">
          <JJStartCountdown size="sm" />
        </Tile>
      </Show>
      <div class="flex w-full items-start gap-3">
        <aside class="hidden shrink-0 lg:block" aria-label="Charities">
          <CommunityCharitiesOverview />
        </aside>
        <div class="flex min-w-0 flex-1 flex-col gap-3">
          <HeadlinerTicker />
          <Show when={scheduleQuery.data}>
            {(schedule) => <FullSchedule schedule={schedule()} />}
          </Show>
          <Show when={scheduleQuery.error}>
            <Alert tone="danger">Failed to load full schedule.</Alert>
          </Show>
          <Show when={scheduleQuery.isLoading}>
            <Tile class="flex justify-center">
              <Spinner size="md" label="Loading the schedule…" />
            </Tile>
          </Show>
        </div>
      </div>
      <div class="w-full lg:hidden">
        <CommunityCharitiesOverviewMobile />
      </div>
    </div>
  )
}

const FullSchedule: Component<{ schedule: FullCommunitySchedule }> = (
  props,
) => {
  const days = createMemo(() => {
    const byDay = new Map<string, UserStream[]>()
    for (const item of props.schedule.streams) {
      const key = DateTime.fromJSDate(item.stream.start)
        .toLocal()
        .toFormat('yyyy-MM-dd')
      byDay.set(key, [...(byDay.get(key) ?? []), item])
    }
    return Array.from(byDay.entries()).map(([key, streams]) => ({
      day: DateTime.fromFormat(key, 'yyyy-MM-dd'),
      streams,
    }))
  })

  return (
    <div class="flex flex-col gap-3">
      <p class="text-on-canvas-muted text-sm">
        {props.schedule.streams.length} streams, in your time zone
      </p>
      <For each={days()}>
        {(day) => <ScheduleDay day={day.day} streams={day.streams} />}
      </For>
    </div>
  )
}

const ScheduleDay: Component<{ day: DateTime; streams: UserStream[] }> = (
  props,
) => {
  const now = useNow()
  const liveCount = () =>
    props.streams.filter(
      (s) =>
        DateTime.fromJSDate(s.stream.start) < now() &&
        DateTime.fromJSDate(s.stream.end) > now(),
    ).length
  const label = () =>
    [
      props.day.toLocaleString({
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      `${props.streams.length} ${props.streams.length === 1 ? 'stream' : 'streams'}`,
      liveCount() > 0 ? `${liveCount()} live` : undefined,
    ]
      .filter(Boolean)
      .join(' · ')

  return (
    <section class="flex flex-col gap-2" aria-label={label()}>
      <DateDivider>{label()}</DateDivider>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <For each={props.streams}>
          {(item) => (
            <UpcomingStreamRow stream={item.stream} user={item.owner} />
          )}
        </For>
      </div>
    </section>
  )
}
