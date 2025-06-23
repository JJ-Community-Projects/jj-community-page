import { type Component, Show } from "solid-js";
import { type ModalSignal } from "../../../../../../../lib/createModalSignal.ts";
import { useScheduleEditor } from "../../../providers/ScheduleEditorProvider.tsx";
import { useStreamEditor } from "./ScheduleEditorStreamEditDialogBodyProvider.tsx";

interface StreamDialogControlsProps {
  editStreamDialog: ModalSignal;
  deleteDialog: ModalSignal;
}

export const StreamDialogControls: Component<StreamDialogControlsProps> = (props) => {
  const { action } = useScheduleEditor();
  const { save } = useStreamEditor();

  return (
    <div class="flex justify-between pt-4 border-t border-gray-200">
      <button
        onClick={() => {
          props.editStreamDialog.close();
          props.deleteDialog.open();
        }}
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={action.saveStream.actionInProgress}
        type="button"
      >
        Delete
      </button>
      <button
        onClick={save}
        type="button"
        class="bg-accent hover:bg-accent-600 text-white px-6 py-2 rounded-lg transition-all shadow-sm hover:shadow font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={action.saveStream.actionInProgress}
      >
        {action.saveStream.actionInProgress ? "Saving..." : "Save"}
      </button>

      {/* Display loading indicator when saving */}
      <Show when={action.saveStream.actionInProgress}>
        <div class="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
            <div class="animate-spin h-10 w-10 border-3 border-accent border-t-transparent rounded-full mb-4"></div>
            <span class="text-lg font-medium">Saving your stream...</span>
          </div>
        </div>
      </Show>
    </div>
  );
};
