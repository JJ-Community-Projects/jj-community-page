import {type Component} from "solid-js";
import {TextField} from "@kobalte/core/text-field";
import {Checkbox} from "@kobalte/core/checkbox";
import {useStreamEditorDialog} from "../StreamEditorDialogContext.tsx";

export const StreamMetaSection: Component<{ streamId: number }> = (_props) => {
  const dialog = useStreamEditorDialog();

  const updateTitle = ((v: string) => {
    dialog.setTitle(v || "");
  });

  const updateSubtitle = ((v: string) => {
    dialog.setSubtitle(v || null);
  });

  const updateVisible = (checked: boolean) => {
    dialog.setVisible(checked);
  };

  return (
    <div class="space-y-3">
      <h3 class="text-sm font-semibold">Details</h3>
      <div class="flex gap-3">
        <TextField class="flex-1" value={dialog.draft.stream.title} onChange={updateTitle}>
          <TextField.Label class="text-xs font-medium mb-1">Title</TextField.Label>
          <TextField.Input class="w-full px-3 py-2 border rounded" placeholder="Stream title" />
        </TextField>
        <Checkbox checked={dialog.draft.stream.visible} onChange={updateVisible} class="flex items-center gap-2">
          <Checkbox.Input class="sr-only" />
          <Checkbox.Control class="h-5 w-5 rounded border border-gray-300 bg-white data-[checked]:bg-blue-600 data-[checked]:border-blue-600">
            <Checkbox.Indicator>
              <svg class="h-4 w-4 text-white" viewBox="0 0 8 8">
                <path stroke="currentColor" stroke-width="1.5" fill="none" d="M1,4 L3,6 L7,2" />
              </svg>
            </Checkbox.Indicator>
          </Checkbox.Control>
          <Checkbox.Label class="text-sm">Visible</Checkbox.Label>
        </Checkbox>
      </div>

      <TextField value={dialog.draft.stream.subtitle ?? ""} onChange={updateSubtitle}>
        <TextField.Label class="text-xs font-medium mb-1">Subtitle (optional)</TextField.Label>
        <TextField.Input class="w-full px-3 py-2 border rounded" placeholder="Optional subtitle" />
      </TextField>
    </div>
  );
};

export default StreamMetaSection;
