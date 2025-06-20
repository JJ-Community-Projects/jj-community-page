import {type Component} from "solid-js";
import {YogsScheduleProvider} from "./provider/YogsScheduleProvider.tsx";
import {YogsScheduleWeek} from "./YogsScheduleWeek.tsx";
import {CreatorFilterProvider} from "./provider/CreatorFilterProvider.tsx";
import type {FullCreator, FullSchedule} from "../../../lib/model/ContentTypes.ts";

interface YogsScheduleComponentProps {
  schedule: FullSchedule
  creators: FullCreator[]
}

export const YogsScheduleComponent: Component<YogsScheduleComponentProps> = (props) => {
  return (
    <YogsScheduleProvider
      schedule={props.schedule}
      creators={props.creators}
    >
      <CreatorFilterProvider>
        <YogsScheduleWeek/>
      </CreatorFilterProvider>
    </YogsScheduleProvider>
  );
}
