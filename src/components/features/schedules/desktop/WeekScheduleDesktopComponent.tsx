import {type Component, For, Show} from "solid-js";
import type {ScheduleDay, ScheduleWeek} from "../../../../lib/orpc/public/schemas/schedules.ts";
import {ScheduleStreamCard} from "../common/StreamCard.tsx";

interface WeekScheduleDesktopComponentProps {
  week: ScheduleWeek
}

export const WeekScheduleDesktopComponent: Component<WeekScheduleDesktopComponentProps> = (props) => {
  return (
    <div>
      <p>Week</p>
      <div class={'flex flex-row w-full'}>
        <For each={props.week.days} fallback={<p>No days</p>}>
          {
            (day) => (
              <Day day={day}/>
            )
          }
        </For>
      </div>
    </div>
  );
}


interface DayProps {
  day: ScheduleDay
}

const Day: Component<DayProps> = (props) => {
  return (
    <div class="flex flex-col flex-1">
      <DayHeader day={props.day}/>
      <For each={props.day.streams} fallback={<p>No Streams</p>}>
        {
          (stream) => (
            <div class="max-h-64">
              <ScheduleStreamCard
                stream={stream}
                type={'filled'}
                hover={true}
              />
            </div>
          )
        }
      </For>
    </div>
  );
}

const DayHeader: Component<DayProps> = (props) => {
  return (
    <div>
      <p>Date</p>
    </div>
  );
}
