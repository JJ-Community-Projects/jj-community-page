import {type Component} from "solid-js";
import {TextField} from "@kobalte/core/text-field";
import {useAddStreamDialog} from "../AddStreamDialogContext.tsx";

function toLocalDateTimeInputValue(d: Date) {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function clampToRange(date: Date, min: Date, max: Date) {
  const minTime = min.getTime();
  const maxTime = max.getTime();
  const t = date.getTime();
  if (t < minTime) return new Date(minTime);
  if (t > maxTime) return new Date(maxTime);
  return date;
}

export const AddStreamTimeSection: Component = () => {
  const dialog = useAddStreamDialog();
  const minDate = () => dialog.minDate();
  const maxDate = () => dialog.maxDate();

  const updateStart = ((value: string) => {
    const next = new Date(value);
    if (isNaN(next.getTime())) return;
    const clamped = clampToRange(next, minDate(), maxDate());
    // Ensure start <= end
    const currentEnd = new Date(dialog.draft.stream.end);
    const nextEnd = clamped.getTime() > currentEnd.getTime() ? clamped : currentEnd;
    dialog.setStart(clamped);
    dialog.setEnd(nextEnd);
  });

  const updateEnd = ((value: string) => {
    const next = new Date(value);
    if (isNaN(next.getTime())) return;
    const clamped = clampToRange(next, minDate(), maxDate());
    // Ensure start <= end
    const currentStart = new Date(dialog.draft.stream.start);
    const nextStart = clamped.getTime() < currentStart.getTime() ? clamped : currentStart;
    dialog.setStart(nextStart);
    dialog.setEnd(clamped);
  });

  const toAttr = (d: Date) => toLocalDateTimeInputValue(d);
  const minAttr = () => toAttr(minDate());
  const maxAttr = () => toAttr(maxDate());

  return (
    <div class="space-y-3">
      <h3 class="text-sm font-semibold">Time</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField value={toLocalDateTimeInputValue(dialog.draft.stream.start)} onChange={updateStart}>
          <TextField.Label class="text-xs font-medium mb-1">Start</TextField.Label>
          <TextField.Input type="datetime-local" min={minAttr()} max={maxAttr()}
                           class="w-full px-3 py-2 border rounded"/>
        </TextField>
        <TextField value={toLocalDateTimeInputValue(dialog.draft.stream.end)} onChange={updateEnd}>
          <TextField.Label class="text-xs font-medium mb-1">End</TextField.Label>
          <TextField.Input type="datetime-local" min={minAttr()} max={maxAttr()}
                           class="w-full px-3 py-2 border rounded"/>
        </TextField>
      </div>
    </div>
  );
};

export default AddStreamTimeSection;
