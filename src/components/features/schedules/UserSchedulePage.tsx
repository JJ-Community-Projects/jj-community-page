import {type Component} from "solid-js";
import {ScheduleProvider} from "./common/ScheduleProvider.tsx";
import {UserSchedulePageBodyDesktop} from "./desktop/UserSchedulePageBodyDesktop.tsx";
import type {FullSchedule} from "../../../lib/orpc/public/schemas/schedules.ts";

interface UserSchedulePageProps {
  initSchedule: FullSchedule
}

export const UserSchedulePage: Component<UserSchedulePageProps> = (props) => {
  return (
    <ScheduleProvider schedule={props.initSchedule}>
      <div class="w-full max-w-7xl mx-auto">
        <h1 class="text-3xl md:text-4xl font-bold text-white text-center mb-6 pt-4">
          {props.initSchedule.data?.title || "Schedule"}
        </h1>
        <UserSchedulePageBodyDesktop/>
      </div>
    </ScheduleProvider>
  );
}
