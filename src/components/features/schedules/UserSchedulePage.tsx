import {type Component} from "solid-js";
import type {ScheduleUI} from "../../../lib/db/models/schedule-ui.ts";
import {ScheduleProvider} from "./common/ScheduleProvider.tsx";
import {UserSchedulePageBodyDesktop} from "./desktop/UserSchedulePageBodyDesktop.tsx";
import {UserSchedulePageBodyMobile} from "./mobile/UserSchedulePageBodyMobile.tsx";

interface UserSchedulePageProps {
  initSchedule: ScheduleUI
}

export const UserSchedulePage: Component<UserSchedulePageProps> = (props) => {
  return (
    <ScheduleProvider schedule={props.initSchedule}>
      <div class="w-full max-w-7xl mx-auto">
        <h1 class="text-3xl md:text-4xl font-bold text-white text-center mb-6 pt-4">
          {props.initSchedule.schedule?.title || "Schedule"}
        </h1>
        <UserSchedulePageBodyDesktop/>
        <UserSchedulePageBodyMobile/>
      </div>
    </ScheduleProvider>
  );
}
