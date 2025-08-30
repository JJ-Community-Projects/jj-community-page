import {type Component, For} from "solid-js";
import {ScheduleStreamCard} from "../../../schedules/common/StreamCard.tsx";
import type {Stream} from "../../../../../lib/orpc/public/schemas/schedules.ts";

export const NextThreeStreams: Component<{
  streams: Stream[];
}> = (props) => {

  return (
    <div class="w-full">
      <h2 class="text-2xl font-bold text-white mb-4">Next Streams</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <For each={props.streams}>
          {(stream) => (
            <ScheduleStreamCard
              stream={stream}
              type="top-bar"
              hover={true}
            />
          )}
        </For>
      </div>
    </div>
  )
}
