import { type Component, Show } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { useAddStreamDialog } from "./AddStreamDialogContext.tsx";
import { AddStreamFormBody } from "./AddStreamFormBody.tsx";
import { AddStreamDialogControls } from "./AddStreamDialogControls.tsx";

export const AddStreamDialog: Component = () => {
  const dialog = useAddStreamDialog();
  const hasDraft = () => Boolean(dialog.draft);

  return (
    <Dialog open={dialog.isOpen()} onOpenChange={(o) => (!o ? dialog.close() : void 0)}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/50 z-40" />
        <div class="fixed inset-0 flex items-center justify-center z-50">
          <Dialog.Content class="bg-white rounded-xl shadow-xl p-0 w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div class="px-5 py-4 border-b flex items-center justify-between">
              <Dialog.Title class="text-lg font-bold">Add Stream</Dialog.Title>
              <button class="text-sm text-gray-600 hover:text-gray-800" onClick={dialog.close}>Close</button>
            </div>

            <div class="p-5 overflow-y-auto flex-1">
              <Show when={hasDraft()} fallback={<div class="text-sm text-gray-600">No stream draft.</div>}>
                <AddStreamFormBody />
              </Show>
            </div>

            <div class="border-t p-4">
              <AddStreamDialogControls />
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
};

export default AddStreamDialog;
