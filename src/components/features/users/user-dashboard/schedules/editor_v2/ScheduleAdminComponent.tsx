import {type Component} from "solid-js";
import {QueryClient} from "@tanstack/query-core";
import {QueryClientProvider} from "@tanstack/solid-query";
import {ScheduleEditorProvider} from "./ScheduleEditorProvider.tsx";
import {ScheduleAdminSettingsEditor} from "./ScheduleAdminSettingsEditor.tsx";
import {TagCatalogContext} from "../../../../../../lib/useTagSearch.ts";
import type {CatalogTag} from "../../../../../../lib/tagCatalog.ts";

interface ScheduleEditorComponentProps {
  scheduleId: number;
  tagCatalog?: CatalogTag[];
}

export const ScheduleAdminComponent: Component<ScheduleEditorComponentProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <TagCatalogContext.Provider value={props.tagCatalog}>
        <ScheduleEditorProvider scheduleId={props.scheduleId}>
          <ScheduleAdminSettingsEditor/>
        </ScheduleEditorProvider>
      </TagCatalogContext.Provider>
    </QueryClientProvider>
  );
}
