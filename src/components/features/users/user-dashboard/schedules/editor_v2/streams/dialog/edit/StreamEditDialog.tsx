import {type Component, Show} from "solid-js";
import {Dialog} from "@kobalte/core/dialog";
import {useScheduleEditor2} from "../../../ScheduleEditorProvider.tsx";
import {useStreamEditorDialog} from "./StreamEditorDialogContext.tsx";
import {StreamEditFormBody} from "./StreamEditFormBody.tsx";
import {StreamDialogControls} from "./StreamDialogControls.tsx";

export const StreamEditDialog: Component = () => {
  const { state } = useScheduleEditor2();
  const dialog = useStreamEditorDialog();

  const stream = () => {
    const id = dialog.streamId();
    if (id == null) return null;
    return state.streams.find((s) => s.id === id) ?? null;
  };

  return (
    <Dialog open={dialog.isOpen()} onOpenChange={(o) => (!o ? dialog.close() : void 0)}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/50 z-40" />
        <div class="fixed inset-0 flex items-center justify-center z-50">
          <Dialog.Content class="bg-white rounded-xl shadow-xl p-0 w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div class="px-5 py-4 border-b flex items-center justify-between">
              <Dialog.Title class="text-lg font-bold">Edit</Dialog.Title>
              <button class="text-sm text-gray-600 hover:text-gray-800" onClick={dialog.close}>Close</button>
            </div>

            <div class="p-5 overflow-y-auto flex-1">
              <Show when={stream()} fallback={<div class="text-sm text-gray-600">No stream selected.</div>}>
                {(s) => <StreamEditFormBody streamId={s().id} />}
              </Show>
            </div>

            <div class="border-t p-4">
              <Show when={stream()}>{(s) => <StreamDialogControls streamId={s().id} onClose={dialog.close} />}</Show>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
};

export default StreamEditDialog;
