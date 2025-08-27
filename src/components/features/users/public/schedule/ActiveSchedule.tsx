import {type Component} from "solid-js";
import type {ScheduleInfo} from "../../../../../lib/orpc/public/schemas/schedules.ts";

interface ActiveScheduleProps {
  initSchedule: ScheduleInfo
}

export const ActiveSchedule: Component<ActiveScheduleProps> = (props) => {
  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-xl font-bold">Primary Schedule</h2>

      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-semibold">{props.initSchedule.title}</h3>
        <p class="text-gray-600">Year: {props.initSchedule.year}</p>
        {props.initSchedule.visible ? (
          <span class="text-green-600 text-sm">✓ Publicly visible</span>
        ) : (
          <span class="text-gray-500 text-sm">Private schedule</span>
        )}
      </div>

      <div class="mt-4 text-center">
        <a
          href={`/schedules/${props.initSchedule.slug}`}
          class="text-accent hover:underline font-medium"
        >
          View Full Schedule
        </a>
      </div>
    </div>
  );
}
