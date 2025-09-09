import {type Component, For} from "solid-js";
import {useScheduleEditor2} from "../ScheduleEditorProvider.tsx";
import {DayColumn} from "./DayColumn.tsx";

export const WeekSection: Component<{ title: string; startDay: number; endDay: number }> = (props) => {
  const { state } = useScheduleEditor2();
  const year = () => state.schedule?.year ?? new Date().getFullYear();

  const days = () => {
    const ds: Date[] = [];
    for (let d = props.startDay; d <= props.endDay; d++) {
      ds.push(new Date(year(), 11, d));
    }
    return ds;
  };

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
      <For each={days()}>{(date, idx) => <DayColumn date={date} dayIndex={idx()} />}</For>
    </div>
  );
};

export default WeekSection;
