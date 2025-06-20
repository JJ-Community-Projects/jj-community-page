import {type Component, For, Show} from "solid-js";
import type {ScheduleDayUI, ScheduleWeekUI} from "../../../../lib/db/repos/ScheduleModel.ts";
import {ScheduleStreamCard} from "../common/StreamCard.tsx";

interface WeekScheduleDesktopComponentProps {
  week: ScheduleWeekUI
}

export const WeekScheduleDesktopComponent: Component<WeekScheduleDesktopComponentProps> = (props) => {
  return (
    <div>
      <p>Week</p>
      <div class={'flex flex-row w-full'}>
        <Show when={props.week.times}>
          <div class={'h-full w-12 gap-2'}>
            <For each={props.week.times}>
              {
                (time) => (
                  <div class={'bg-white flex-1 p-2 rounded-md shadow-sm flex flex-col justify-around'}>
                    <p>{time.start.hours}:{time.start.minutes}</p>
                    <p>{time.end.hours}:{time.end.minutes}</p>
                  </div>
                )
              }
            </For>
          </div>
        </Show>
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
  day: ScheduleDayUI
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
