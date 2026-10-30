import {type Component, type JSX, Show} from "solid-js";
import {useScheduleEditor2} from "../ScheduleEditorProvider.tsx";
import {WeekSection} from "./WeekSection.tsx";
import {AllStreamsSection} from "./AllStreamsSection.tsx";
import {AddStreamDialogProvider} from "./dialog/add/AddStreamDialogContext.tsx";
import {AddStreamDialog} from "./dialog/add/AddStreamDialog.tsx";
import {Section} from "../../../../../../ui/Tile";
import {cn, focusRing, groupSurface} from "../../../../../../ui/cn";
import {FaSolidChevronDown} from "solid-icons/fa";

/** A collapsible group of the panel (a week, or the full list). */
const PanelGroup: Component<{ label: string; hint?: string; open?: boolean; children: JSX.Element }> = (props) => (
  <details open={props.open} class={cn(groupSurface, "group")}>
    <summary
      class={cn(
        "flex cursor-pointer list-none items-center gap-2 rounded-group px-3 py-2.5 text-sm font-semibold select-none [&::-webkit-details-marker]:hidden",
        focusRing,
      )}
    >
      <span class="flex-1">{props.label}</span>
      <Show when={props.hint}>
        <span class="text-fg-muted text-xs font-normal">{props.hint}</span>
      </Show>
      <FaSolidChevronDown class="text-fg-muted size-3 transition-transform group-open:rotate-180" aria-hidden="true" />
    </summary>
    <div class="px-2 pb-2 sm:px-3 sm:pb-3">{props.children}</div>
  </details>
);

export const StreamsPanel: Component = () => {
  const {state, noAccess} = useScheduleEditor2();
  const year = () => state.schedule?.year ?? new Date().getFullYear();
  const minDate = () => new Date(year(), 0, 1, 0, 0, 0, 0);
  const maxDate = () => new Date(year(), 11, 31, 23, 59, 0, 0);

  return (
    <Section title="Streams">
      <Show
        when={state.isReady}
        fallback={<p class="text-fg-muted text-sm">{noAccess() ? 'No access to this schedule.' : 'Loading streams…'}</p>}
      >
        <AddStreamDialogProvider start={minDate()} end={maxDate()}>
          <div class="flex flex-col gap-2">
            <PanelGroup label="December 1–7" hint="Week 1" open>
              <WeekSection title="Week 1" startDay={1} endDay={7}/>
            </PanelGroup>
            <PanelGroup label="December 8–14" hint="Week 2">
              <WeekSection title="Week 2" startDay={8} endDay={14}/>
            </PanelGroup>
            <PanelGroup label="All Streams">
              <AllStreamsSection/>
            </PanelGroup>
          </div>

          {/* Dialogs live at panel root */}
          <AddStreamDialog/>
        </AddStreamDialogProvider>
      </Show>
    </Section>
  );
};

export default StreamsPanel;
