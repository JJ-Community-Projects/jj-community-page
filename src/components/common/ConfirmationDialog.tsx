import {Dialog} from "@kobalte/core";
import {type Component} from "solid-js";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: Component<ConfirmationDialogProps> = (props) => {
  return (
    <Dialog.Root open={props.isOpen} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/50" />
        <Dialog.Content class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl">
          <Dialog.Title class="text-xl font-bold mb-4">{props.title}</Dialog.Title>
          <Dialog.Description class="mb-6">{props.text}</Dialog.Description>
          <div class="flex justify-end space-x-4">
            <button
              onClick={props.onCancel}
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={props.onConfirm}
              class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Confirm
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
