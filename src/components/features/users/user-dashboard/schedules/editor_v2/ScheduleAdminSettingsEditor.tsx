import {type Component} from "solid-js";
import {useScheduleEditor2} from "./ScheduleEditorProvider.tsx";
import {ScheduleAdminEditorHeader} from "./ScheduleAdminEditorHeader.tsx";
import {ScheduleEditorSettings} from "./ScheduleEditorSettings.tsx";
import {StreamsPanel} from "./streams/StreamsPanel.tsx";

export const ScheduleAdminSettingsEditor: Component = () => {
  useScheduleEditor2();
  return (
    <div class="space-y-6">
      <ScheduleAdminEditorHeader/>
      <ScheduleEditorSettings/>
      <StreamsPanel/>
    </div>
  );
}
