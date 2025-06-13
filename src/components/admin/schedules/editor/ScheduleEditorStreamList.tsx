import {type Component, For, Index, Show} from "solid-js";
import {DateTime} from "luxon";
import {debounce} from "@solid-primitives/scheduled";
import {useScheduleEditor} from "../../providers/ScheduleEditorProvider.tsx";
import {DayCard} from "./DayCard.tsx";

// Mobile view - similar to the original editor
export const MobileStreamsList: Component = () => {
  const {
    local,
    addNewStream,
    deleteStream,
    updateStreamTitle,
    updateStreamSubtitle,
    updateStreamDescription,
    updateStreamStart,
    updateStreamEnd,
    updateStreamVisibility,
    action
  } = useScheduleEditor();

  const handleStreamTitle = debounce((id: string, title: string) => {
    updateStreamTitle(id, title);
  }, 200)

  const handleStreamSubTitle = debounce((id: string, subtitle: string) => {
    updateStreamSubtitle(id, subtitle);
  }, 200)

  const handleStreamDescription = debounce((id: string, desc: string) => {
    updateStreamDescription(id, desc);
  }, 200)

  const handleStreamStart = debounce((id: string, date: string) => {
    // Convert from local timezone input to DateTime object
    updateStreamStart(id, DateTime.fromISO(date))
  }, 200)

  const handleStreamEnd = debounce((id: string, date: string) => {
    // Convert from local timezone input to DateTime object
    updateStreamEnd(id, DateTime.fromISO(date))
  }, 200)

  const handleStreamVisibility = debounce((id: string, visible: boolean) => {
    updateStreamVisibility(id, visible);
  }, 200)

  const streams = () => Object.values(local.streams);

  // Function to determine which day number a stream belongs to
  const getStreamDayNumber = (streamStartDate: DateTime) => {
    const day = streamStartDate.day;
    return day >= 1 && day <= 14 ? day : 0;
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Streams</h2>
        <button
          onClick={() => addNewStream()}
          class="bg-accent hover:bg-accent-400 text-white px-3 py-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={action.addNewStream.actionInProgress}
        >
          {action.addNewStream.actionInProgress ? "Adding..." : "Add Stream"}
        </button>
      </div>

      <Show when={action.addNewStream.lastErrorMessage || action.deleteStream.lastErrorMessage}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {action.addNewStream.lastErrorMessage || action.deleteStream.lastErrorMessage}
        </div>
      </Show>

      <Show when={streams().length === 0}>
        <p class="text-center py-4 text-gray-500">No streams yet. Add one to get started!</p>
      </Show>

      <div class="space-y-4">
        <Index each={streams()}>
          {(stream, index) => (
            <div class={`border border-gray-200 rounded-lg p-4 bg-day-${getStreamDayNumber(stream().start)}-50`}>
              <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-2">
                  <h3 class="font-medium">Stream #{index + 1}</h3>
                  <span class="bg-primary text-white text-xs px-2 py-1 rounded-full">
                    Day {getStreamDayNumber(stream().start)}
                  </span>
                </div>
                <button
                  onClick={() => deleteStream(stream().id)}
                  class="text-red-500 hover:text-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={action.deleteStream.actionInProgress}
                >
                  {action.deleteStream.actionInProgress ? "Removing..." : "Remove"}
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="flex flex-col">
                  <label class="text-sm font-medium mb-1">Title: </label>
                  <input
                    type="text"
                    class="border border-gray-300 rounded-lg px-3 py-2"
                    value={stream().title}
                    onInput={(e) => handleStreamTitle(stream().id, e.target.value)}
                  />
                </div>
                <div class="flex flex-col">
                  <label class="text-sm font-medium mb-1">Subtitle: </label>
                  <input
                    type="text"
                    class="border border-gray-300 rounded-lg px-3 py-2"
                    value={stream().subtitle}
                    onInput={(e) => handleStreamSubTitle(stream().id, e.target.value)}
                  />
                </div>
              </div>

              <div class="mb-4">
                <label class="text-sm font-medium mb-1">Description: </label>
                <textarea
                  class="border border-gray-300 rounded-lg px-3 py-2 w-full h-24"
                  value={stream().description}
                  onInput={(e) => handleStreamDescription(stream().id, e.target.value)}
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div class="flex flex-col">
                  <label class="text-sm font-medium mb-1">Start Time: </label>
                  <input
                    type="datetime-local"
                    class="border border-gray-300 rounded-lg px-3 py-2"
                    value={stream().start.toFormat("yyyy-MM-dd'T'HH:mm") ?? ''}
                    onInput={(e) => handleStreamStart(stream().id, e.target.value)}
                  />
                  <p class="text-xs text-gray-500 mt-1">Day: {stream().start.toFormat("cccc, MMMM d")}</p>
                </div>
                <div class="flex flex-col">
                  <label class="text-sm font-medium mb-1">End Time: </label>
                  <input
                    type="datetime-local"
                    class="border border-gray-300 rounded-lg px-3 py-2"
                    value={stream().end.toFormat("yyyy-MM-dd'T'HH:mm") ?? ''}
                    onInput={(e) => handleStreamEnd(stream().id, e.target.value)}
                  />
                  <p class="text-xs text-gray-500 mt-1">Day: {stream().end.toFormat("cccc, MMMM d")}</p>
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center mb-2">
                    <label class="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stream().visible}
                        onChange={(e) => handleStreamVisibility(stream().id, e.target.checked)}
                        class="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span class="ml-2 text-sm font-medium">Visible</span>
                    </label>
                  </div>
                  <div class="text-sm">
                    <span class="font-medium">Duration: </span>
                    <span class="text-gray-700">{stream().end.diff(stream().start).toFormat("h'h' m'm'")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Index>
      </div>
    </div>
  );
}

// Desktop view - 2 rows of 7 days each
export const DesktopStreamsList: Component = () => {
  const {
    local,
    addNewStream,
    getAllDays,
    getStreamsByDay,
    action
  } = useScheduleEditor();

  // Group days into two rows
  const firstWeek = () => getAllDays().slice(0, 7);
  const secondWeek = () => getAllDays().slice(7, 14);

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h2 class="text-xl font-bold mb-4">December Schedule</h2>

      <Show when={action.addNewStream.lastErrorMessage || action.deleteStream.lastErrorMessage}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {action.addNewStream.lastErrorMessage || action.deleteStream.lastErrorMessage}
        </div>
      </Show>
      {/* First week (Dec 1-7) */}
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">December 1-7</h3>
        <div class="grid grid-cols-7 gap-4">
          <For each={firstWeek()}>
            {(day, index) => (
              <DayCard
                dayIndex={index()}
                day={day}
                streams={getStreamsByDay(day.day)}
                onAddStream={() => addNewStream(day.day)}
                isAddingStream={action.addNewStream.actionInProgress}
              />
            )}
          </For>
        </div>
      </div>

      {/* Second week (Dec 8-14) */}
      <div>
        <h3 class="text-lg font-semibold mb-2">December 8-14</h3>
        <div class="grid grid-cols-7 gap-4">
          <For each={secondWeek()}>
            {(day, index) => (
              <DayCard
                dayIndex={index()}
                day={day}
                streams={getStreamsByDay(day.day)}
                onAddStream={() => addNewStream(day.day)}
                isAddingStream={action.addNewStream.actionInProgress}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
