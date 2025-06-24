import {type Component, Show} from "solid-js";
import {ScheduleEditorProvider} from "../../providers/ScheduleEditorProvider.tsx";
import {createMediaQuery} from "@solid-primitives/media";
import {Accordion} from "@kobalte/core/accordion";
import {ScheduleEditorHeader} from "./ScheduleEditorHeader.tsx";
import {ScheduleEditorSettings} from "./ScheduleEditorSettings.tsx";
import {DesktopStreamsList, MobileStreamsList} from "./ScheduleEditorStreamList.tsx";
import "./ScheduleEditorAccordion.css";

interface ScheduleEditorComponentProps {
  scheduleId: number;
  userId: number;
  username: string;
}

export const ScheduleEditorComponent: Component<ScheduleEditorComponentProps> = (props) => {

  const isDesktop = createMediaQuery("(min-width: 768px)");

  return (
    <ScheduleEditorProvider id={props.scheduleId} userId={props.userId} username={props.username}>
      <div class="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <ScheduleEditorHeader/>

        <Accordion class="schedule-accordion" collapsible={true} defaultValue={["settings"]}>
          <Accordion.Item class="schedule-accordion__item" value="settings">
            <Accordion.Header class="schedule-accordion__item-header">
              <Accordion.Trigger class="schedule-accordion__item-trigger">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                  </svg>
                  <span>Schedule Settings</span>
                </div>
                <svg class="h-5 w-5 schedule-accordion__item-trigger-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"/>
                </svg>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content class="schedule-accordion__item-content">
              <ScheduleEditorSettings/>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>

        <div class="bg-white rounded-2xl shadow-xl p-6">
          <Show when={isDesktop()} fallback={<MobileStreamsList/>}>
            <DesktopStreamsList/>
          </Show>
        </div>
      </div>
    </ScheduleEditorProvider>
  );
}
