import {type Component} from "solid-js";
import {YogsScheduleWeekBody} from "./YogsScheduleWeekBody.tsx";
import {YogsScheduleTimeColumn} from "./YogsScheduleTimeColumn.tsx";
import {YogsScheduleHeader} from "./header/YogsScheduleHeader.tsx";

export const YogsScheduleWeek: Component = (props) => {
  return (
    <div class={'flex flex-col font-babas'}>
      <YogsScheduleHeader/>
      <div class={'flex flex-row'}>
        <YogsScheduleTimeColumn/>
        <YogsScheduleWeekBody/>
      </div>
    </div>
  );
}
