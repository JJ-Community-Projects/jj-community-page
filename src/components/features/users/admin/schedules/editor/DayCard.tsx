import {type Component, For, Show} from "solid-js";
import {DateTime} from "luxon";
import {StreamCard} from "./stream/StreamCard.tsx";
import type {StreamType} from "../../../../../../lib/model/admin/user/scheduleEditor/ScheduleEditorTypes.ts";


// Component for a single day card in the desktop view
interface DayCardProps {
  dayIndex: number;
  day: DateTime;
  streams: StreamType[];
  onAddStream: () => void;
  isAddingStream?: boolean;
}

export const DayCard: Component<DayCardProps> = (props) => {
  // Function to get the background color class based on the day number
  const getDayBackgroundColor = () => {
    switch (props.dayIndex) {
      case 0:
        return 'bg-day-1-50'
      case 1:
        return 'bg-day-2-50'
      case 2:
        return 'bg-day-3-50'
      case 3:
        return 'bg-day-4-50'
      case 4:
        return 'bg-day-5-50'
      case 5:
        return 'bg-day-6-50'
      case 6:
        return 'bg-day-7-50'
      default:
        return 'bg-white'
    }
  };

  return (
    <div class={`border border-gray-200 rounded-lg p-3 ${getDayBackgroundColor()}`}>
      <div class="flex justify-between items-center mb-2">
        <h4 class="font-bold">{props.day.toFormat("ccc d")}</h4>
        <button
          onClick={props.onAddStream}
          class="text-accent hover:text-accent-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={props.isAddingStream}
        >
          {props.isAddingStream ? "Adding..." : "+ Add"}
        </button>
      </div>

      <div class="space-y-2">
        <Show when={props.streams.length > 0} fallback={
          <p class="text-xs text-gray-500">No streams</p>
        }>
          <For each={props.streams}>
            {(stream) => (
              <StreamCard stream={(stream)} showDate={false} whiteBackground={true}/>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}
