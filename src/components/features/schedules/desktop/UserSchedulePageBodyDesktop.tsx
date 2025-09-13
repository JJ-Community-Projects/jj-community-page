import { type Component, createSignal, For, Show } from 'solid-js'
import { useScheduleTest } from '../common/ScheduleProvider.tsx'
import { ScheduleStreamCard } from '../common/StreamCard.tsx'
import { Accordion } from '@kobalte/core'
import { FaSolidCalendarDays, FaSolidChevronDown, FaSolidPlay, } from 'solid-icons/fa'
import { DateTime } from 'luxon'
import { getStreamColor } from '../../../../functions/jjDatesToColors.ts'
import './UserSchedulePageBodyDesktop.css'
import { getTextColor } from '../../../../lib/utils/textColors.ts'
import type { ScheduleDay } from '../../../../lib/orpc/public/schemas/schedules.ts'

export const UserSchedulePageBodyDesktop: Component = () => {
  return (
    <div class="mx-auto hidden w-full max-w-6xl flex-col gap-6 p-4 md:flex">
      <NextThreeStreams />
      <DaysAccordion />
    </div>
  )
}

export const NextThreeStreams: Component = () => {
  const { nextThreeStreams } = useScheduleTest()
  const streams = nextThreeStreams()

  return (
    <div class="group/next-stream w-full rounded-xl border-2 bg-white p-4 shadow-md transition-all duration-300 group-hover:border-accent-200 hover:shadow-lg">
      <div class="mb-4 flex items-center gap-2 text-lg font-semibold">
        <FaSolidPlay class="h-5 w-5 text-black transition-all duration-300 group-hover/next-stream:text-accent" />
        <h2 class="font-babas text-black transition-all duration-300 ~text-xl/2xl group-hover/next-stream:text-accent">
          Next Streams
        </h2>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <For each={streams}>
          {(stream) => (
            <ScheduleStreamCard stream={stream} type="top-bar" hover={true} />
          )}
        </For>
      </div>
    </div>
  )
}

export const DaysAccordion: Component = () => {
  const { days } = useScheduleTest()
  const [expandedDays, setExpandedDays] = createSignal<string[]>([])

  return (
    <div class="group w-full rounded-xl border-2 bg-white p-4 shadow-md transition-all duration-300 group-hover:border-accent-200 hover:shadow-lg">
      <div class="mb-4 flex items-center gap-2 text-lg font-semibold">
        <FaSolidCalendarDays class="h-5 w-5 text-black transition-all duration-300 group-hover/next-stream:text-accent" />
        <h2 class="font-babas text-black transition-all duration-300 ~text-xl/2xl group-hover/next-stream:text-accent">
          Schedule
        </h2>
      </div>
      <Accordion.Root
        class="flex w-full flex-col gap-2"
        collapsible={true}
        value={expandedDays()}
        onChange={setExpandedDays}
      >
        <For each={days()}>
          {(day, index) => (
            <DayAccordionItem
              day={day}
              index={index()}
              expandedDays={expandedDays}
            />
          )}
        </For>
      </Accordion.Root>
    </div>
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
    <Accordion.Item value={props.index.toString()} class="accordion__item">
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
            {formatDate(props.day.day)}
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
            <For each={props.day.streams}>
              {(stream) => (
                <ScheduleStreamCard
                  stream={stream}
                  type="left-bar"
                  hover={false}
                />
              )}
            </For>
          </Show>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}
