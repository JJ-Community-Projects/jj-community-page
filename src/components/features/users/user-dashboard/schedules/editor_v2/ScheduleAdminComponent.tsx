import {type Component} from "solid-js";
import {QueryClient} from "@tanstack/query-core";
import {QueryClientProvider} from "@tanstack/solid-query";
import {ScheduleEditorProvider} from "./ScheduleEditorProvider.tsx";
import {ScheduleAdminSettingsEditor} from "./ScheduleAdminSettingsEditor.tsx";

interface ScheduleEditorComponentProps {
  scheduleId: number;
}

export const ScheduleAdminComponent: Component<ScheduleEditorComponentProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ScheduleEditorProvider scheduleId={props.scheduleId}>
        <ScheduleAdminSettingsEditor/>
      </ScheduleEditorProvider>
    </QueryClientProvider>
  );
}
