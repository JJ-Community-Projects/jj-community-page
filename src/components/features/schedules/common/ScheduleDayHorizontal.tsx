import {type Component, For} from "solid-js";
import type {ScheduleDayUI} from "../../../../lib/db/models/schedule-ui.ts";
import {DateTime} from "luxon";
import {rangeFromData} from "../../../../lib/utils/rangeFromData.ts";
import {ScheduleStreamCard} from "./StreamCard.tsx";

interface ScheduleDayProps {
  day: ScheduleDayUI
}

export const ScheduleDayHorizontal: Component<ScheduleDayProps> = (props) => {
  return (
    <div class="day-container flex flex-col">
      <ScheduleDayHeader day={props.day}/>
      <ScheduleDayBody day={props.day}/>
    </div>
  );
}

interface ScheduleDayBodyProps {
  day: ScheduleDayUI
}

const ScheduleDayBody: Component<ScheduleDayBodyProps> = props => {
  return (
    <div class="mt-2 flex flex-row">
      <div class={"pb-2 flex flex-wrap gap-2"}>
        <For each={props.day.streams}>
          {
            (stream) => (
              <div class="w-64 h-40 flex-shrink-0">
                <ScheduleStreamCard stream={stream} type="filled" hover={false}/>
              </div>
            )
          }
        </For>
      </div>
    </div>
  )
}

interface ScheduleDayHeaderProps {
  day: ScheduleDayUI
}

const ScheduleDayHeader: Component<ScheduleDayHeaderProps> = props => {

  const dateString = () => {
    const range = rangeFromData(props.day.streams)
    if (range) {
      return DateTime.fromJSDate(range.start).toFormat("EEE',' MMM d")
    }
    // Ensure day.date is a DateTime object
    const dayDate = props.day.date instanceof DateTime
      ? props.day.date
      : DateTime.fromISO(props.day.date as unknown as string);
    return dayDate.toFormat("EEE',' MMM d")
  }

  return (
    <div class="day p-1">
      <div class="w-full h-full bg-white rounded-2xl flex flex-row items-center justify-center">
        <p class="text-xl xl:text-2xl">{dateString()}</p>
      </div>
    </div>
  )
}
