import {type Component} from "solid-js";
import {YogsScheduleProvider} from "../provider/YogsScheduleProvider.tsx";
import type {FullCreator, FullSchedule} from "../../../../lib/model/ContentTypes.ts";
import {CreatorFilterProvider} from "../provider/CreatorFilterProvider.tsx";
import {MobileYogsSchedule} from "./MobileYogsSchedule.tsx";

interface YogsScheduleComponentProps {
  schedule: FullSchedule
  creators: FullCreator[]
}

export const MobileYogsScheduleComponent: Component<YogsScheduleComponentProps> = (props) => {
  return (
    <YogsScheduleProvider
      schedule={props.schedule}
      creators={props.creators}
    >
      <CreatorFilterProvider>
        <MobileYogsSchedule/>
      </CreatorFilterProvider>
    </YogsScheduleProvider>
  );
}
