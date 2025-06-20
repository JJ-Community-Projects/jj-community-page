import {type Component} from "solid-js";
import {DateTime} from "luxon";
import {Dialog} from "@kobalte/core/dialog";
import {type ModalSignal} from "../../../../../../../lib/createModalSignal.ts";
import {ScheduleEditorStreamEditDialogBody} from "./ScheduleEditorStreamEditDialogBody.tsx";


// Dialog for editing a stream
interface StreamEditDialogProps {
  stream: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    start: DateTime;
    end: DateTime;
    visible: boolean;
    createdBy: number
  };
  dialog: ModalSignal;
  deleteDialog: ModalSignal;
}

export const StreamEditDialog: Component<StreamEditDialogProps> = (props) => {
  return (
    <Dialog open={props.dialog.isOpen()} onOpenChange={props.dialog.setOpen} modal={true}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/50"/>
        <Dialog.Content
          class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <Dialog.Title class="text-xl font-bold">Edit Stream</Dialog.Title>
            <Dialog.CloseButton class="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </Dialog.CloseButton>
          </div>

          <ScheduleEditorStreamEditDialogBody
            stream={props.stream}
            editStreamDialog={props.dialog}
            deleteDialog={props.deleteDialog}
          />

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
