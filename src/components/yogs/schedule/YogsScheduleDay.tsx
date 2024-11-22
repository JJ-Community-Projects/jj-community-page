import {type Component, For} from "solid-js";
import {YogsStreamTile} from "./YogsStreamTile.tsx";
import {DateTime} from "luxon";
import type {FullDay} from "../../../lib/model/ContentTypes.ts";
import {rangeFromData} from "../../../lib/utils/rangeFromData.ts";

interface YogsScheduleDayProps {
  day: FullDay
}

export const YogsScheduleDay: Component<YogsScheduleDayProps> = (props) => {
  return (
    <div class="day-container flex flex-col">
      <ScheduleDayHeader day={props.day}/>
      <ScheduleDayBody day={props.day}/>
    </div>
  );
}

interface ScheduleDayBodyProps {
  day: FullDay
}

const ScheduleDayBody: Component<ScheduleDayBodyProps> = props => {
  return (
    <For each={props.day.streams}>{stream => <YogsStreamTile stream={stream}/>}</For>
  )
}


interface ScheduleDayHeaderProps {
  day: FullDay
}

const ScheduleDayHeader: Component<ScheduleDayHeaderProps> = props => {

  const dateString = () => {
    const range = rangeFromData(props.day.streams)
    if (range) {
      return DateTime.fromJSDate(range.start).toFormat("EEE',' MMM d")
    }
    return DateTime.fromJSDate(props.day.date).toFormat("EEE',' MMM d")
  }

  return (
    <div class={'day p-1'}>
      <div class={'w-full h-full bg-white rounded-2xl flex flex-row items-center justify-center'}>
        <p class={'text-xl xl:text-2xl'}>{dateString()}</p>
      </div>
    </div>
  )
}
