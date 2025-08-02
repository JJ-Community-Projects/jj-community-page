import {type Component, For, Show} from "solid-js";
import type {DetailedStream} from "../../../../../lib/db/models/schedule-ui.ts";
import {ScheduleStreamCard} from "../../../schedules/common/StreamCard.tsx";

interface OtherStreamsProps {
  streams: DetailedStream[]
}

export const OtherStreams: Component<OtherStreamsProps> = (props) => {
  // Only render if there are streams to display
  return (
    <Show when={props.streams && props.streams.length > 0}>
      <div class="flex flex-col gap-4">
        <h2 class="text-xl font-bold">Other Streams</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <For each={props.streams}>
            {(stream) => (
              <div class="w-full">
                <ScheduleStreamCard
                  stream={stream}
                  type="top-bar"
                  hover={true}
                />
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
