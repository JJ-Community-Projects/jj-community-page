import {type Component, For, Show} from "solid-js";
import {useScheduleTest} from "../common/ScheduleProvider.tsx";
import {ScheduleStreamCard} from "../common/StreamCard.tsx";
import {DateTime} from "luxon";
import {FaSolidChevronLeft, FaSolidChevronRight} from "solid-icons/fa";

export const UserSchedulePageBodyMobile: Component = () => {
  const {days} = useScheduleTest();
  return (
    <Show when={days().length > 0}>
      <div class="md:hidden flex flex-col gap-4 w-full p-4">
        <NextStreams/>
        <DaysPager/>
      </div>
    </Show>
  )
}

const NextStreams: Component = () => {
  const {nextStream} = useScheduleTest();
  const stream = nextStream();

  return (
    <div class="w-full">
      <h2 class="text-xl font-bold text-white mb-2">Next Stream</h2>
      <Show when={stream} fallback={<p class="text-white">No upcoming streams</p>}>
        <ScheduleStreamCard
          stream={stream!}
          type="top-bar"
          hover={false}
        />
      </Show>
    </div>
  )
}

const DaysPager: Component = () => {
  const {days, nextDay, prevDay, dayIndex} = useScheduleTest();
  const currentDay = () => days()[dayIndex()];

  return (
    <div class="w-full">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xl font-bold text-white">Schedule</h2>
        <div class="text-white text-sm">
          {(currentDay().date).toFormat("EEE, MMM d")}
        </div>
      </div>

      <div class="flex items-center justify-between mb-4">
        <button
          class="h-8 w-8 rounded-full bg-accent text-white shadow-md flex items-center justify-center"
          onClick={prevDay}
        >
          <FaSolidChevronLeft/>
        </button>

        <button
          class="h-8 w-8 rounded-full bg-accent text-white shadow-md flex items-center justify-center"
          onClick={nextDay}
        >
          <FaSolidChevronRight/>
        </button>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <Show when={currentDay().streams.length > 0}
              fallback={<p class="text-white">No streams scheduled for this day.</p>}>
          <For each={currentDay().streams}>
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
    </div>
  )
}
