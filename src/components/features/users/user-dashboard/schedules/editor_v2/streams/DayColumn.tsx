import {type Component, For, Show} from "solid-js";
import {useScheduleEditor2} from "../ScheduleEditorProvider.tsx";
import {byDay} from "./utils/streamFilters.ts";
import {StreamCard} from "./StreamCard.tsx";
import {useAddStreamDialog} from "./dialog/add/AddStreamDialogContext.tsx";

export const DayColumn: Component<{ date: Date; dayIndex: number }> = (props) => {
  const {state} = useScheduleEditor2();
  const dialog = useAddStreamDialog();
  const year = () => state.schedule?.year ?? props.date.getFullYear();

  const streamsToday = () => byDay(state.streams, props.date);

  const addNew = () => {
    const start = new Date(year(), 11, props.date.getDate(), 18, 0, 0, 0);
    const end = new Date(year(), 11, props.date.getDate(), 20, 0, 0, 0);
    dialog.addNew({ title: "", start, end, visible: false });
  };

  const header = () => {
    const d = props.date;
    return d.toLocaleDateString(undefined, {weekday: "short", day: "numeric"});
  };

  return (
    <div class="rounded-lg border p-3 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <div class="text-sm font-semibold">{header()}</div>
        <button class="text-xs px-2 py-1 bg-accent text-white rounded hover:bg-accent-600" onClick={addNew}>
          Add Stream
        </button>
      </div>

      <Show when={streamsToday().length > 0} fallback={<div class="text-xs text-gray-500">No streams</div>}>
        <div class="flex flex-col gap-2">
          <For each={streamsToday()}>{(stream) => (
            <StreamCard stream={stream}/>
          )}</For>
        </div>
      </Show>
    </div>
  );
};

export default DayColumn;
