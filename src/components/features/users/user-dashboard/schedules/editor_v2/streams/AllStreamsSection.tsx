import {type Component, For, Show} from "solid-js";
import {useScheduleEditor2} from "../ScheduleEditorProvider.tsx";
import {sortByStart} from "./utils/streamFilters.ts";
import {StreamCard} from "./StreamCard.tsx";
import {useAddStreamDialog} from "./dialog/add/AddStreamDialogContext.tsx";
import { latestByEnd, addHours, makeEmptyScheduleFallback } from "./utils/initialTimes.ts";
import {Button} from "../../../../../../ui/Button";
import {FaSolidPlus} from "solid-icons/fa";

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
    <div class="flex flex-col gap-2">
      <div class="flex justify-end">
        <Button variant="accent" size="sm" onClick={addCustom}>
          <FaSolidPlus aria-hidden="true" />
          Add Custom Stream
        </Button>
      </div>
      <Show when={streams().length > 0} fallback={<p class="text-fg-muted text-sm">No streams yet.</p>}>
        <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          <For each={streams()}>{(s) => <StreamCard stream={s} />}</For>
        </div>
      </Show>
    </div>
  );
};

export default AllStreamsSection;
