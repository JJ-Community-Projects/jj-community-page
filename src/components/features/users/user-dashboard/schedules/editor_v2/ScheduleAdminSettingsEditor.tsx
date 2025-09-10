import {type Component} from "solid-js";
import {ScheduleAdminEditorHeader} from "./ScheduleAdminEditorHeader.tsx";
import {ScheduleEditorSettings} from "./ScheduleEditorSettings.tsx";
import {StreamsPanel} from "./streams/StreamsPanel.tsx";

export const ScheduleAdminSettingsEditor: Component = () => {
  return (
    <div class="space-y-6">
      <ScheduleAdminEditorHeader/>
      <ScheduleEditorSettings/>
      <StreamsPanel/>
    </div>
  );
}
