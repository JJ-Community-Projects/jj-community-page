import {type Component, Show} from "solid-js";
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
              <TextField.Label class="text-xs font-medium mb-1">End</TextField.Label>
              <TextField.Input type="datetime-local" min={minAttr()} max={maxAttr()} class="w-full px-3 py-2 border rounded" />
            </TextField>
          </div>
        </div>
      )}
    </Show>
  );
};

export default StreamTimeSection;
