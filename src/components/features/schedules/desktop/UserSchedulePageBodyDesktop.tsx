import {type Component, createSignal, For, Show} from "solid-js";
import {useScheduleTest} from "../common/ScheduleProvider.tsx";
import {ScheduleStreamCard} from "../common/StreamCard.tsx";
import {Accordion} from "@kobalte/core";
import {FaSolidCalendarDays, FaSolidChevronDown, FaSolidPlay} from "solid-icons/fa";
import {DateTime} from "luxon";
import {getStreamColor} from "../../../../functions/jjDatesToColors.ts";
import './UserSchedulePageBodyDesktop.css'
import {getTextColor} from "../../../../lib/utils/textColors.ts";
import type {ScheduleDay} from "../../../../lib/orpc/public/schemas/schedules.ts";

export const UserSchedulePageBodyDesktop: Component = () => {
  return (
    <div class="hidden md:flex flex-col gap-6 w-full max-w-6xl mx-auto p-4">
      <NextThreeStreams/>
      <DaysAccordion/>
    </div>
  )
}

const NextThreeStreams: Component = () => {
  const {nextThreeStreams} = useScheduleTest();
  const streams = nextThreeStreams();

  return (
    <div class="w-full">
      <div
        class="bg-white block w-fit px-4 py-2 rounded-lg shadow mx-auto mb-4 ">
        <h2 class="text-2xl font-bold text-gray-900 text-center inline-flex items-center gap-2">
          <FaSolidPlay class="w-5 h-5 text-gray-700"/>
          <span>Next Streams</span>
        </h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <For each={streams}>
          {(stream) => (
            <ScheduleStreamCard
              stream={stream}
              type="top-bar"
              hover={true}
            />
          )}
        </For>
      </div>
    </div>
  )
}

const DaysAccordion: Component = () => {
  const {days} = useScheduleTest();
  const [expandedDays, setExpandedDays] = createSignal<string[]>([]);

  return (
    <div class="w-full">
      <div
        class="bg-white block w-fit px-4 py-2 rounded-lg shadow mx-auto mb-4">
        <h2 class="text-2xl font-bold text-gray-900 text-center flex items-center gap-2">
          <FaSolidCalendarDays class="w-5 h-5 text-gray-700"/>
          <span>Schedule</span>
        </h2>
      </div>
      <Accordion.Root
        class="flex flex-col gap-2 w-full"
        collapsible={true}
        value={expandedDays()}
        onChange={setExpandedDays}
      >
        <For each={days()}>
          {(day, index) => (
            <DayAccordionItem day={day} index={index()} expandedDays={expandedDays}/>
          )}
        </For>
      </Accordion.Root>
    </div>
  )
}

const DayAccordionItem: Component<{ day: ScheduleDay, index: number, expandedDays: () => string[] }> = (props) => {
  const isOpen = () => {
    return props.expandedDays().includes(props.index.toString());
  };

  // Get highlight color based on the day's date
  const getHighlightColor = () => {
    // Convert JS Date to DateTime for color calculation
    // For color calculation, we still use UTC to maintain consistent colors
    const dayDate = DateTime.fromJSDate(props.day.day, {zone: 'utc'});
    return getStreamColor(dayDate);
  };

  const highlightColor = getHighlightColor();
  const textColor = getTextColor(highlightColor);

  // Format date for display
  const formatDate = (date: Date) => {
    // Create DateTime from JS Date, assuming it's in UTC, then convert to local time for display
    return DateTime.fromJSDate(date, {zone: 'utc'}).toLocal().toLocaleString({
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Accordion.Item
      value={props.index.toString()}
      class="accordion__item"
    >
      <Accordion.Header class="accordion__item-header">
        <Accordion.Trigger
          class="accordion__item-trigger bg-white rounded-lg"
          style={{
            '--highlight-color': highlightColor,
            '--text-color': textColor
          }}
        >
          {/* Colored stripe on left */}
          <div
            class="absolute left-0 top-0 w-4 h-full"
            style={{'background-color': highlightColor}}
          />

          {/* Overlay that fills from left to right when accordion is open */}
          <div class="accordion__item-trigger-bg"/>

          <span class="accordion__item-trigger-text">
            {formatDate(props.day.day)}
          </span>
          <FaSolidChevronDown class="accordion__item-trigger-chevron"/>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion__item-content p-4 pt-4">
        <div class="grid grid-cols-1 gap-4">
          <Show when={props.day.streams.length > 0} fallback={<p>No streams scheduled for this day.</p>}>
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
  );
}
