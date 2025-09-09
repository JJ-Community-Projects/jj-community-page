import {type Component, For, Show} from "solid-js";
import {useScheduleEditor2} from "../ScheduleEditorProvider.tsx";
import {sortByStart} from "./utils/streamFilters.ts";
import {StreamCard} from "./StreamCard.tsx";
import {useAddStreamDialog} from "./dialog/add/AddStreamDialogContext.tsx";

export const AllStreamsSection: Component = () => {
  const { state } = useScheduleEditor2();
  const dialog = useAddStreamDialog();
  const year = () => state.schedule?.year ?? new Date().getFullYear();

  const streams = () => sortByStart(state.streams);

  const addCustom = () => {
    // Default to Dec 15th at 18:00–20:00 or today if schedule year is current
    const base = new Date(year(), 11, 15);
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 18, 0, 0, 0);
    const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 20, 0, 0, 0);
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
