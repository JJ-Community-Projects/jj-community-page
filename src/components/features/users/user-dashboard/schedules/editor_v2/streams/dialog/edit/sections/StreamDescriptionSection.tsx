import {type Component} from "solid-js";
import {TextField} from "@kobalte/core/text-field";
import {useStreamEditorDialog} from "../StreamEditorDialogContext.tsx";

export const StreamDescriptionSection: Component<{ streamId: number }> = () => {
  const dialog = useStreamEditorDialog();

  const updateDescription =  ((v: string) => {
    dialog.setDescription(v || null);
  });

  return (
    <div class="space-y-3">
      <h3 class="text-sm font-semibold">Description</h3>
      <TextField value={dialog.draft.stream.description ?? ""} onChange={updateDescription}>
        <TextField.Label class="text-xs font-medium mb-1">Description</TextField.Label>
        <TextField.TextArea class="w-full px-3 py-2 border rounded min-h-28" placeholder="Longer description..." />
      </TextField>
    </div>
  );
};

export default StreamDescriptionSection;
