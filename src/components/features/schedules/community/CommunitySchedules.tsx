import { type Component, createSignal, For, Show } from 'solid-js'
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
import type { ScheduleDay } from '../../../../lib/orpc/private/jjData/contract.ts'
import { DateTime } from 'luxon'
import { getStreamColor } from '../../../../functions/jjDatesToColors.ts'
import { getTextColor } from '../../../../lib/utils/textColors.ts'
import './CommunitySchedules.css'

const Header: Component = () => {
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
  return (
    <div class={'flex w-full flex-col items-stretch justify-center gap-6'}>
      <Header />
      <div class={'flex w-full flex-row items-start justify-start gap-6'}>
        <div class={'hidden lg:block'}>
          <CommunityCharitiesOverview />
        </div>
        <div class={'flex flex-1 flex-col items-start justify-center gap-6'}>
          <FullSchedule />
        </div>
      </div>
      <div class={'block w-full lg:hidden'}>
        <CommunityCharitiesOverviewMobile />
      </div>
    </div>
  )
}

const UpcomingStreams: Component = () => {
  const upcomingStreams = useQuery(() =>
    orpcPrivate.jj.upcomingStreams.queryOptions({
      staleTime: 60_000 * 8,
      refetchInterval: 60_000 * 10,
    }),
  )
  const [showAll, setShowAll] = createSignal(false)

  const items = () => upcomingStreams.data?.streams ?? []
  const firstFour = () => items().slice(0, 12)
  const remainingCount = () => Math.max(items().length - 12, 0)
  const visibleItems = () => (showAll() ? items() : firstFour())

  return (
    <div class="flex w-full flex-col gap-2">
      <Show when={upcomingStreams.isLoading}>
        <p class="text-white/80">Loading upcoming streams…</p>
      </Show>
      <Show when={upcomingStreams.isError}>
        <p class="text-red-400">Failed to load upcoming streams.</p>
      </Show>
      <Show when={upcomingStreams.isSuccess && items().length > 0}>
        <div class="grid w-full grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] gap-2">
          <For each={visibleItems()}>
            {(item) => {
              const { stream, owner } = item
              return <UpcomingStreamsStreamCard stream={stream} user={owner} />
            }}
          </For>
        </div>
        <Show when={remainingCount() > 0}>
          <div class="mt-3 flex justify-center">
            <button
              class="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll() ? 'Show less' : `Show ${remainingCount()} more`}
            </button>
          </div>
        </Show>
      </Show>
    </div>
  )
}

const FullSchedule = () => {
  const schedule = useQuery(() =>
    orpcPrivate.jj.fullSchedule.queryOptions({
      staleTime: 60_000 * 12,
      refetchInterval: 60_000 * 15,
    }),
  )
  const [expandedDays, setExpandedDays] = createSignal<string[]>([])
  return (
    <>
      <Show when={schedule.data}>
        {(schedule) => {
          return (
            <Accordion.Root
              class="flex w-full flex-col gap-2"
              collapsible={true}
              value={expandedDays()}
              onChange={setExpandedDays}
            >
              <For each={schedule().days}>
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
        }}
      </Show>
    </>
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

  return (
    <Accordion.Item value={props.index.toString()} class="accordion__item bg-white rounded-2xl shadow-lg">
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
            <div class="grid w-full grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] gap-2">
              <For each={props.day.streams}>
                {(item) => {
                  const { stream, owner } = item
                  return (
                    <UpcomingStreamsStreamCard stream={stream} user={owner} />
                  )
                }}
              </For>
            </div>
          </Show>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}
