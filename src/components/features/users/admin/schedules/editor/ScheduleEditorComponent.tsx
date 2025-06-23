import {type Component, createResource, createSignal, Show} from "solid-js";
import {debounce} from "@solid-primitives/scheduled";
import {ScheduleEditorProvider, useScheduleEditor} from "../../providers/ScheduleEditorProvider.tsx";
import {actions} from "astro:actions";
import {createMediaQuery} from "@solid-primitives/media";
import {TextField} from "@kobalte/core/text-field";
import {ScheduleEditorHeader} from "./ScheduleEditorHeader.tsx";
import {ScheduleEditorSettings} from "./ScheduleEditorSettings.tsx";
import {DesktopStreamsList, MobileStreamsList} from "./ScheduleEditorStreamList.tsx";

interface ScheduleEditorComponentProps {
  scheduleId: number;
  userId: number;
  username: string;
}

export const ScheduleEditorComponent: Component<ScheduleEditorComponentProps> = (props) => {

  const isDesktop = createMediaQuery("(min-width: 768px)");

  return (
    <ScheduleEditorProvider id={props.scheduleId} userId={props.userId} username={props.username}>

      <div class="max-w-6xl mx-auto px-4 py-8">
        <ScheduleEditorHeader/>

        <ScheduleEditorSettings/>

        <Show when={isDesktop()} fallback={<MobileStreamsList/>}>
          <DesktopStreamsList/>
        </Show>

      </div>
    </ScheduleEditorProvider>
  );
}
