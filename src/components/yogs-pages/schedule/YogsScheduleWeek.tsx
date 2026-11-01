import {type Component} from "solid-js";
import {YogsScheduleWeekBody} from "./YogsScheduleWeekBody.tsx";
import {YogsScheduleTimeColumn} from "./YogsScheduleTimeColumn.tsx";
import {YogsScheduleHeader} from "./header/YogsScheduleHeader.tsx";
import {useYogsSchedule} from "./provider/YogsScheduleProvider.tsx";
import "./yogs-schedule.css";

export const YogsScheduleWeek: Component = (props) => {
  const {times} = useYogsSchedule()
  // Height in units (header row, day row, 3 per slot): full screen fits the grid to the screen's height
  return (
    <div class={'yogs-grid flex flex-col font-babas'} style={{'--yogs-rows': 2 + 3 * times().length}}>
      <YogsScheduleHeader/>
      <div class={'flex flex-row'}>
        <YogsScheduleTimeColumn/>
        <YogsScheduleWeekBody/>
      </div>
    </div>
  );
}
