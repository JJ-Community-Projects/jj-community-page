import {type Component, For, Show, createSignal} from "solid-js";
import {useScheduleTest} from "../common/ScheduleProvider.tsx";
import {ScheduleStreamCard} from "../common/StreamCard.tsx";
import {Accordion} from "@kobalte/core";
import {FaSolidChevronDown} from "solid-icons/fa";
import {twMerge} from "tailwind-merge";
import {DateTime} from "luxon";

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
      <h2 class="text-2xl font-bold text-white mb-4">Next Streams</h2>
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
      <h2 class="text-2xl font-bold text-white mb-4">Schedule</h2>
      <Accordion.Root
        class="flex flex-col gap-2 w-full"
        value={expandedDays()}
        onChange={setExpandedDays}
      >
        <For each={days()}>
          {(day, index) => (
            <DayAccordionItem day={day} index={index()} />
          )}
        </For>
      </Accordion.Root>
    </div>
  )
}

const DayAccordionItem: Component<{day: any, index: number}> = (props) => {
  const isOpen = () => {
    const expandedDays = document.querySelector('[data-expanded="true"]');
    return expandedDays?.getAttribute('data-value') === props.index.toString();
  };

  return (
    <Accordion.Item
      value={props.index.toString()}
      class="bg-white rounded-lg overflow-hidden"
    >
      <Accordion.Header>
        <Accordion.Trigger
          class="w-full flex items-center justify-between p-4 text-left font-medium focus:outline-none"
        >
          <span>{DateTime.fromJSDate(props.day.date).toFormat("EEEE, MMMM d")}</span>
          <FaSolidChevronDown
            class={twMerge('transition-transform duration-300', isOpen() && 'rotate-180')}
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="p-4 pt-0">
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
