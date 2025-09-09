import {type Component, Show} from "solid-js";
import {useScheduleEditor2} from "../ScheduleEditorProvider.tsx";
import {WeekSection} from "./WeekSection.tsx";
import {AllStreamsSection} from "./AllStreamsSection.tsx";
import {AddStreamDialogProvider} from "./dialog/add/AddStreamDialogContext.tsx";
import {AddStreamDialog} from "./dialog/add/AddStreamDialog.tsx";

export const StreamsPanel: Component = () => {
  const {state, addStreamMutation} = useScheduleEditor2();
  const year = () => state.schedule?.year ?? new Date().getFullYear();
  const minDate = () => new Date(year(), 0, 1, 0, 0, 0, 0);
  const maxDate = () => new Date(year(), 11, 31, 23, 59, 0, 0);

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h2 class="text-xl font-bold mb-4">Streams</h2>

      <Show when={state.isReady} fallback={<div class="text-sm text-gray-600">Loading streams…</div>}>
        <AddStreamDialogProvider start={minDate()} end={maxDate()}>
          <div class="space-y-4">
            {/* Week 1 */}
            <details open class="group border rounded-lg">
              <summary class="cursor-pointer select-none px-4 py-3 font-medium flex justify-between items-center">
                <span>December 1–7</span>
                <span class="text-xs text-gray-500">Week 1</span>
              </summary>
              <div class="px-4 pb-4">
                <WeekSection
                  title="Week 1"
                  startDay={1}
                  endDay={7}
                />
              </div>
            </details>

            {/* Week 2 */}
            <details class="group border rounded-lg">
              <summary class="cursor-pointer select-none px-4 py-3 font-medium flex justify-between items-center">
                <span>December 8–14</span>
                <span class="text-xs text-gray-500">Week 2</span>
              </summary>
              <div class="px-4 pb-4">
                <WeekSection
                  title="Week 2"
                  startDay={8}
                  endDay={14}
                />
              </div>
            </details>

            {/* All Streams */}
            <details class="group border rounded-lg">
              <summary class="cursor-pointer select-none px-4 py-3 font-medium">All Streams</summary>
              <div class="px-4 pb-4">
                <AllStreamsSection/>
              </div>
            </details>
          </div>

          {/* Dialogs live at panel root */}
          <AddStreamDialog/>
        </AddStreamDialogProvider>
      </Show>

      <Show when={addStreamMutation.isError}>
        <pre>{JSON.stringify(addStreamMutation.error, null, 2)}</pre>
      </Show>
    </div>
  );
};

export default StreamsPanel;
