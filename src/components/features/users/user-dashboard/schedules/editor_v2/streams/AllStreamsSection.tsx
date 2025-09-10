import {type Component, For, Show} from "solid-js";
import {useScheduleEditor2} from "../ScheduleEditorProvider.tsx";
import {sortByStart} from "./utils/streamFilters.ts";
import {StreamCard} from "./StreamCard.tsx";
import {useAddStreamDialog} from "./dialog/add/AddStreamDialogContext.tsx";
import { latestByEnd, addHours, makeEmptyScheduleFallback } from "./utils/initialTimes.ts";

export const AllStreamsSection: Component = () => {
  const { state } = useScheduleEditor2();
  const dialog = useAddStreamDialog();
  const year = () => state.schedule?.year ?? new Date().getFullYear();

  const streams = () => sortByStart(state.streams);

  const addCustom = () => {
    // If there are any streams, continue from the end of the latest-by-end across schedule
    const all = streams();
    const last = latestByEnd(all);
    const start = last ? new Date(last.end as any) : makeEmptyScheduleFallback(year());
    const end = addHours(start, 3);
    dialog.addNew({ title: "", start, end, visible: false });
  };

  return (
    <div class="flex flex-col gap-3">
      <div class="flex justify-end">
        <button class="text-sm px-3 py-1.5 bg-accent text-white rounded hover:bg-accent-600" onClick={addCustom}>
          Add Custom Stream
        </button>
      </div>
      <Show when={streams().length > 0} fallback={<div class="text-sm text-gray-500">No streams yet.</div>}>
        <div class="flex flex-col gap-2">
          <For each={streams()}>{(s) => <StreamCard stream={s} />}</For>
        </div>
      </Show>
    </div>
  );
};

export default AllStreamsSection;
