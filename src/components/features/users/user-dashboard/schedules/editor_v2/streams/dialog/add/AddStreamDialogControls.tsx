import { type Component } from "solid-js";
import { useAddStreamDialog } from "./AddStreamDialogContext.tsx";

export const AddStreamDialogControls: Component = () => {
  const dialog = useAddStreamDialog();

  const onCreate = async () => {
    await dialog.save();
  };

  return (
    <div class="flex justify-between items-center">
      <div class="text-xs text-gray-500">
        {dialog.isSaving() ? "Creating…" : ""}
      </div>
      <div class="flex gap-2">
        <button
          class="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-600 disabled:opacity-50"
          onClick={onCreate}
          disabled={dialog.isSaving()}
        >
          {dialog.isSaving() ? "Creating…" : "Create"}
        </button>
        <button class="px-3 py-1.5 border rounded hover:bg-gray-50" onClick={dialog.close}>Cancel</button>
      </div>
    </div>
  );
};

export default AddStreamDialogControls;
