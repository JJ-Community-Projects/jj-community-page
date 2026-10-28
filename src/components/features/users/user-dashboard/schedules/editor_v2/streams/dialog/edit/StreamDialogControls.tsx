import {type Component} from "solid-js";
import {useScheduleEditor2} from "../../../ScheduleEditorProvider.tsx";
import {useStreamEditorDialog} from "./StreamEditorDialogContext.tsx";

export const StreamDialogControls: Component<{ streamId: number; onClose: () => void }> = (props) => {
  const {state, deleteStream, deleteStreamMutation} = useScheduleEditor2();
  const dialog = useStreamEditorDialog();
  const stream = () => state.streams.find((s) => s.id === props.streamId);

  // A refused save or delete keeps the dialog open with the server's message (F-66)
  const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

  const handleDelete = async () => {
    if (!confirm("Delete this stream? This cannot be undone.")) return;
    dialog.setError(null);
    try {
      await deleteStream(props.streamId);
    } catch (error) {
      dialog.setError(errorMessage(error));
      return;
    }
    props.onClose();
  };

  const handleSave = async () => {
    dialog.setError(null);
    try {
      await dialog.save();
    } catch (error) {
      dialog.setError(errorMessage(error));
      return;
    }
    props.onClose();
  };

  return (
    <div class="flex justify-between items-center">
      <div class="text-xs text-gray-500">
        {dialog.isSaving() ? "Saving…" : ""}
      </div>
      <div class="flex gap-2">
        <button
          class="px-3 py-1.5 bg-primary text-white rounded-sm hover:bg-primary-600 disabled:opacity-50"
          onClick={handleSave}
          disabled={dialog.isSaving()}
        >
          {dialog.isSaving() ? "Saving…" : "Save"}
        </button>
        <button class="px-3 py-1.5 border rounded-sm hover:bg-gray-50" onClick={dialog.close}>Close</button>
        <button
          class="px-3 py-1.5 bg-danger text-white rounded-sm hover:bg-danger-600 disabled:opacity-50"
          onClick={handleDelete}
          disabled={deleteStreamMutation.isPending}
        >
          {deleteStreamMutation.isPending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
};

export default StreamDialogControls;
