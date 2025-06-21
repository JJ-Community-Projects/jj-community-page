import {type Component, For, Show} from "solid-js";
import type {ScheduleUI} from "../../../../../lib/db/models/schedule-ui.ts";
import {ScheduleProvider, useScheduleTest} from "../../../schedules/common/ScheduleProvider.tsx";
import {ScheduleStreamCard} from "../../../schedules/common/StreamCard.tsx";

interface ActiveScheduleProps {
  initSchedule: ScheduleUI
}

export const ActiveSchedule: Component<ActiveScheduleProps> = (props) => {
  return (
    <ScheduleProvider schedule={props.initSchedule}>
      <ActiveScheduleBody/>
    </ScheduleProvider>
  );
}


const ActiveScheduleBody: Component = () => {
  const scheduleContext = useScheduleTest();
  const nextStreams = () => scheduleContext.nextThreeStreams();
  const schedule = () => scheduleContext.schedule;

  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-xl font-bold">Upcoming Streams</h2>

      <Show when={nextStreams().length > 0} fallback={<p>No upcoming streams scheduled.</p>}>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <For each={nextStreams()}>
            {(stream) => (
              <div class="w-full">
                <ScheduleStreamCard
                  stream={stream}
                  type="top-bar"
                  hover={true}
                />
              </div>
            )}
          </For>
        </div>
      </Show>

      <div class="mt-4 text-center">
        <a
          href={`/schedule/${schedule().schedule?.slug}`}
          class="text-accent hover:underline font-medium"
        >
          View Full Schedule
        </a>
      </div>
    </div>
  )
}
