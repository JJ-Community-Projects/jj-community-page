import {type Component, Show, createSignal} from "solid-js";
import {TextField} from "@kobalte/core/text-field";
import {useScheduleEditor2} from "../../../../ScheduleEditorProvider.tsx";
import {useStreamEditorDialog} from "../StreamEditorDialogContext.tsx";

function toLocalDateTimeInputValue(d: Date | string) {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function clampToYear(date: Date, year: number) {
  const min = new Date(year, 0, 1, 0, 0, 0, 0);
  const max = new Date(year, 11, 31, 23, 59, 0, 0);
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

export const StreamTimeSection: Component<{ streamId: number }> = () => {
  const { state } = useScheduleEditor2();
  const dialog = useStreamEditorDialog();
  const draft = () => dialog.draft.stream;
  const year = () => state.schedule?.year ?? new Date().getFullYear();

  const updateStart = ((value: string) => {
    const s = draft();
    const next = new Date(value);
    if (isNaN(next.getTime())) return;
    const clamped = clampToYear(next, year());
    // Ensure start <= end
    const currentEnd = new Date(s.end);
    const nextEnd = clamped.getTime() > currentEnd.getTime() ? clamped : currentEnd;
    dialog.setStart(clamped);
    dialog.setEnd(nextEnd);
  });

  const updateEnd = ((value: string) => {
    const s = draft();
    const next = new Date(value);
    if (isNaN(next.getTime())) return;
    const clamped = clampToYear(next, year());
    // Ensure start <= end
    const currentStart = new Date(s.start);
    const nextStart = clamped.getTime() < currentStart.getTime() ? clamped : currentStart;
    dialog.setStart(nextStart);
    dialog.setEnd(clamped);
  });

  const minAttr = () => `${year()}-01-01T00:00`;
  const maxAttr = () => `${year()}-12-31T23:59`;

  // Relative end-date toggle (default to Relative like Add dialog)
  const [relativeEndDate, setRelativeEndDate] = createSignal<boolean>(true);

  // Year-based min/max Date objects
  const minDate = () => new Date(year(), 0, 1, 0, 0, 0, 0);
  const maxDate = () => new Date(year(), 11, 31, 23, 59, 0, 0);

  // Helpers for relative end controls
  const startDate = () => new Date(draft().start);
  const endDate = () => new Date(draft().end);

  const oneMinuteMs = 60 * 1000;
  const minutesToMs = (m: number) => m * oneMinuteMs;

  const setEndToDuration = (minutes: number) => {
    const s = startDate();
    let candidate = new Date(s.getTime() + minutesToMs(minutes));
    candidate = clampToYear(candidate, year());
    // Ensure end strictly after start
    if (candidate.getTime() <= s.getTime()) {
      candidate = new Date(s.getTime() + oneMinuteMs);
    }
    dialog.setEnd(candidate);
  };

  const updateEndByDelta = (deltaMinutes: number) => {
    const s = startDate();
    let candidate = new Date(endDate().getTime() + minutesToMs(deltaMinutes));
    candidate = clampToYear(candidate, year());
    // Ensure end strictly after start
    if (candidate.getTime() <= s.getTime()) {
      candidate = new Date(s.getTime() + oneMinuteMs);
    }
    dialog.setEnd(candidate);
  };

  const disableEndMinus15 = () => {
    const cand = new Date(endDate().getTime() - minutesToMs(15));
    return cand.getTime() <= startDate().getTime() || cand.getTime() < minDate().getTime();
  };
  const disableEndMinus30 = () => {
    const cand = new Date(endDate().getTime() - minutesToMs(30));
    return cand.getTime() <= startDate().getTime() || cand.getTime() < minDate().getTime();
  };
  const disableEndPlus15 = () => {
    const cand = new Date(endDate().getTime() + minutesToMs(15));
    return cand.getTime() > maxDate().getTime();
  };
  const disableEndPlus30 = () => {
    const cand = new Date(endDate().getTime() + minutesToMs(30));
    return cand.getTime() > maxDate().getTime();
  };

  return (
    <Show when={draft()}>
      {(s) => (
        <div class="space-y-3">
          <h3 class="text-sm font-semibold">Time</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField value={toLocalDateTimeInputValue(s().start)} onChange={updateStart}>
              <TextField.Label class="text-xs font-medium mb-1">Start</TextField.Label>
              <TextField.Input type="datetime-local" min={minAttr()} max={maxAttr()} class="w-full px-3 py-2 border rounded" />
            </TextField>
            <TextField value={toLocalDateTimeInputValue(s().end)} onChange={updateEnd}>
              <TextField.Label class="text-xs font-medium mb-1">
                <div class={'flex flex-row gap-1 items-start'}>
                  <span>End</span>
                  <div class="inline-flex rounded bg-gray-200 p-0.5">
                    <button
                      type="button"
                      class={`${relativeEndDate() ? 'bg-white shadow' : 'hover:bg-gray-300'} rounded-l px-2 py-1 text-xxs`}
                      onClick={() => setRelativeEndDate(true)}
                    >
                      Relative
                    </button>
                    <button
                      type="button"
                      class={`${!relativeEndDate() ? 'bg-white shadow' : 'hover:bg-gray-300'} rounded-r px-2 py-1 text-xxs`}
                      onClick={() => setRelativeEndDate(false)}
                    >
                      Absolute
                    </button>
                  </div>
                </div>
              </TextField.Label>
              <Show
                when={relativeEndDate()}
                fallback={
                  <TextField.Input
                    type="datetime-local"
                    min={minAttr()}
                    max={maxAttr()}
                    class="w-full px-3 py-2 border rounded"
                  />
                }
              >
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="rounded bg-accent px-3 py-2 text-xxs text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={disableEndMinus30()}
                    onClick={() => updateEndByDelta(-30)}
                  >
                    -30m
                  </button>
                  <button
                    type="button"
                    class="rounded bg-accent px-3 py-2 text-xxs text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={disableEndMinus15()}
                    onClick={() => updateEndByDelta(-15)}
                  >
                    -15m
                  </button>
                  <button
                    type="button"
                    class="rounded bg-accent px-3 py-2 text-xxs text-white hover:bg-accent-600"
                    onClick={() => setEndToDuration(180)}
                  >
                    3h
                  </button>
                  <button
                    type="button"
                    class="rounded bg-accent px-3 py-2 text-xxs text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={disableEndPlus15()}
                    onClick={() => updateEndByDelta(15)}
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    class="rounded bg-accent px-3 py-2 text-xxs text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={disableEndPlus30()}
                    onClick={() => updateEndByDelta(30)}
                  >
                    +30m
                  </button>
                </div>
                <TextField.Description class="text-xxs text-gray-500 mt-1">
                  End: {new Date(s().end).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </TextField.Description>
              </Show>
            </TextField>
          </div>
        </div>
      )}
    </Show>
  );
};

export default StreamTimeSection;
