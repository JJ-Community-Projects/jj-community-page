import { type Component, createMemo, createSignal, For, Show } from 'solid-js'
import {
  useIsJJ,
  useJJStartCountdown,
  useNextJJStartDate,
} from '../../../../lib/utils/jjDates.ts'
import { createI18n, I18nProvider } from 'solid-i18n'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { Accordion, useLocale } from '@kobalte/core'
import type { CharitiesStatic } from '../../../../content/schema.ts'
import { CurrencyProvider } from '../../../common/CurrencyProvider.tsx'
import { CharityOverviewProvider } from '../../../common/charityOverview/CharityOverviewProvider.tsx'
import { UpcomingStreamsStreamCard } from '../common/StreamCard.tsx'
import {
  CommunityCharitiesOverview,
  CommunityCharitiesOverviewMobile,
} from '../../../common/charityOverview/CommunityCharitiesOverview.tsx'
import { FaSolidCalendarWeek, FaSolidChevronDown } from 'solid-icons/fa'
import type {
  FullCommunitySchedule,
  ScheduleDay, UserStream,
} from '../../../../lib/orpc/private/jjData/contract.ts'
import { DateTime } from 'luxon'
import { getStreamColor } from '../../../../functions/jjDatesToColors.ts'
import { getTextColor } from '../../../../lib/utils/textColors.ts'
import './CommunitySchedules.css'
import { useNow } from '../../../../lib/utils/useNow.ts'

const Header: Component<{
  schedule?: FullCommunitySchedule
}> = (props) => {
  const nextJJStartDate = useNextJJStartDate()
  const jjStartCountdown = useJJStartCountdown()
  const isJJ = useIsJJ()
  return (
    <div class="rounded-xl border-2 bg-gradient-to-b from-neutral-50 to-neutral-100 p-2 shadow-md transition-all duration-300 hover:shadow-lg">
      <div class="flex w-full flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
        {/* Left: Title, icon, subtitle (left-aligned) */}
        <div class="flex flex-col items-center text-center md:items-start md:text-left">
          <div class="flex items-center gap-2">
            <FaSolidCalendarWeek class="h-8 w-8 text-neutral-600" />
            <h1 class="font-bold text-black ~text-2xl/4xl">Full Schedule</h1>
          </div>
          <Show when={props.schedule}>
            {(schedule) => {
              const streamCount = createMemo(() => {
                const days = schedule().days
                const streams = days.map((d) => d.streams).flat()
                return streams.length
              })
              return <p>{streamCount()} Streams</p>
            }}
          </Show>
        </div>

        {/* Right: Countdown (right-aligned, moves below on small screens) */}
        <Show when={!isJJ()}>
          <div class="flex flex-col items-center text-center md:items-end md:text-right">
            <p class={'text-lg font-semibold'}>
              Jingle Jam {nextJJStartDate().year} starts in
            </p>
            <p class={'font-mono text-xl tabular-nums tracking-tight'}>
              {jjStartCountdown().toFormat("dd'd' hh'h' mm'm' ss's'")}
            </p>
          </div>
        </Show>
      </div>
    </div>
  )
}

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
  const scheduleQuery = useQuery(() =>
    orpcPrivate.jj.fullSchedule.queryOptions({
      staleTime: 60_000 * 12,
      refetchInterval: 60_000 * 15,
    }),
  )

  const schedule = (): FullCommunitySchedule | undefined => scheduleQuery.data

  return (
    <div class={'flex w-full flex-col items-stretch justify-center gap-6'}>
      <Header schedule={schedule()} />
      <div class={'flex w-full flex-row items-start justify-start gap-6'}>
        <div class={'hidden lg:block'}>
          <CommunityCharitiesOverview />
        </div>
        <div class={'flex flex-1 flex-col items-start justify-center gap-6'}>
          <Show when={scheduleQuery.data}>
            {(schedule) => {
              return <FullSchedule schedule={schedule()} />
            }}
          </Show>
          <Show when={scheduleQuery.error}>
            <div class={'rounded-2xl bg-white p-2'}>
              <p class="text-red-400">Failed to load full schedule.</p>
            </div>
          </Show>
          <Show when={scheduleQuery.isLoading}>
            <div class={'rounded-2xl bg-white p-2'}>
              <p>Loading...</p>
            </div>
          </Show>
        </div>
      </div>
      <div class={'block w-full lg:hidden'}>
        <CommunityCharitiesOverviewMobile />
      </div>
    </div>
  )
}

const FullSchedule: Component<{
  schedule: FullCommunitySchedule
}> = (props) => {
  const [expandedDays, setExpandedDays] = createSignal<string[]>([])

  const streams = () => props.schedule.streams

  const groupedStreams = createMemo(() => {

    const streamMap = new Map<string, UserStream[]>()
    const list = streams()
    for(const c of list) {
      const start = DateTime.fromJSDate(c.stream.start).toLocal()
      const key = start.toFormat('yyyy-MM-dd')
      const value = streamMap.get(key) ?? []
      streamMap.set(key, [...value, c])
    }

    return Array.from(streamMap.entries()).map(([key, value]) => ({
      day: DateTime.fromFormat(key, 'yyyy-MM-dd').toJSDate(),
      streams: value,
    }))
  })

  return (
    <Accordion.Root
      class="flex w-full flex-col gap-2"
      collapsible={true}
      value={expandedDays()}
      onChange={setExpandedDays}
    >
      <For each={groupedStreams()}>
        {(day, index) => (
          <DayAccordionItem
            day={day}
            index={index()}
            expandedDays={expandedDays}
          />
        )}
      </For>
    </Accordion.Root>
  )
}

const DayAccordionItem: Component<{
  day: ScheduleDay
  index: number
  expandedDays: () => string[]
}> = (props) => {
  const isOpen = () => {
    return props.expandedDays().includes(props.index.toString())
  }

  // Get highlight color based on the day's date
  const getHighlightColor = () => {
    // Convert JS Date to DateTime for color calculation
    // For color calculation, we still use UTC to maintain consistent colors
    const dayDate = DateTime.fromJSDate(props.day.day, { zone: 'utc' })
    return getStreamColor(dayDate)
  }

  const highlightColor = getHighlightColor()
  const textColor = getTextColor(highlightColor)

  // Format date for display
  const formatDate = (date: Date) => {
    // Create DateTime from JS Date, assuming it's in UTC, then convert to local time for display
    return DateTime.fromJSDate(date, { zone: 'utc' }).toLocal().toLocaleString({
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const streams = () => props.day.streams

  const now = useNow()

  const liveStreams = () => {
    return streams().filter((s) => {
      const start = DateTime.fromJSDate(s.stream.start)
      const end = DateTime.fromJSDate(s.stream.end)
      return start < now() && end > now()
    })
  }

  const liveStreamsCount = () => liveStreams().length

  const liveStreamsCountText = () => {
    const count = liveStreamsCount()
    if (count === 0) return ''
    return count === 1 ? ' (1 live stream)' : ` (${count} live streams)`
  }

  const colors = new Map<number, string>([
    [0, '#1e3a8a'],
    [6, '#15803d'],
    [12, '#eab308'],
    [18, '#b91c1c'],
  ])

  const ranges = [
    {
      start: 0,
      end: 6,
    },
    {
      start: 6,
      end: 12,
    },
    {
      start: 12,
      end: 18,
    },
    {
      start: 18,
      end: 24,
    },
  ]

  const groupedStreams = () => {
    return ranges.map((range) => {
      return {
        start: DateTime.fromObject({
          hour: range.start,
        }),
        end: DateTime.fromObject({
          hour: range.end,
        }),
        streamColor: colors.get(range.start),
        streams: streams()
          .filter((s) => {
            const start = DateTime.fromJSDate(s.stream.start)
            return start.hour >= range.start && start.hour < range.end
          })
          .map((s) => ({
            stream: s.stream,
            owner: s.owner,
          })),
      }
    }).filter(({streams}) => streams.length > 0)
  }

  return (
    <Accordion.Item
      value={props.index.toString()}
      class="accordion__item rounded-2xl bg-white shadow-lg"
    >
      <Accordion.Header class="accordion__item-header">
        <Accordion.Trigger
          class="accordion__item-trigger rounded-lg bg-white"
          style={{
            '--highlight-color': highlightColor,
            '--text-color': textColor,
          }}
        >
          {/* Colored stripe on left */}
          <div
            class="absolute left-0 top-0 h-full w-4"
            style={{ 'background-color': highlightColor }}
          />

          {/* Overlay that fills from left to right when accordion is open */}
          <div class="accordion__item-trigger-bg" />

          <span class="accordion__item-trigger-text">
            {formatDate(props.day.day)} ({props.day.streams.length} streams)
            {liveStreamsCountText()}
          </span>
          <FaSolidChevronDown class="accordion__item-trigger-chevron" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion__item-content p-4 pt-4">
        <div class="grid grid-cols-1 gap-4">
          <Show
            when={props.day.streams.length > 0}
            fallback={<p>No streams scheduled for this day.</p>}
          >
            <For each={groupedStreams()}>
              {(group) => {
                const { start, end, streams, streamColor } = group
                return (
                  <div class={'div flex flex-col gap-2'}>
                    <p>
                      {start.toLocaleString({
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {end.toLocaleString({
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <div class="grid w-full grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] gap-2">
                      <For each={streams}>
                        {(item) => {
                          const { stream, owner } = item
                          return (
                            <UpcomingStreamsStreamCard
                              stream={stream}
                              user={owner}
                              streamColor={streamColor}
                            />
                          )
                        }}
                      </For>
                    </div>
                  </div>
                )
              }}
            </For>
          </Show>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}
