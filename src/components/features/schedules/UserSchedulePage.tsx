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
        <div class="text-center mb-6 bg-white block w-fit px-6 py-4 rounded-lg shadow mx-auto">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900">
            {props.initSchedule.data?.title || "Schedule"}
          </h1>
          <div class="mt-1">
            <a href={`/${props.initSchedule.owner.tiltifySlug}`} class={"text-primary hover:underline"}>{props.initSchedule.owner.username}</a>
          </div>
        </div>
        <UserSchedulePageBodyDesktop/>
      </div>
    </ScheduleProvider>
  );
}
