import {type Component, Show} from "solid-js";
import {useScheduleEditor} from "../../../providers/ScheduleEditorProvider.tsx";
import type {StreamType} from "./StreamType.ts";
import {StreamEditDialog} from "./StreamEditDialog.tsx";
import {createModalSignal} from "../../../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../../../common/dialogs/ConfirmationDialog.tsx";

// Component for a single stream card
interface StreamCardProps {
  stream: StreamType;
}

export const StreamCard: Component<StreamCardProps> = (props) => {
  const {
    deleteStream,
    action
  } = useScheduleEditor();

  const showEditDialog = createModalSignal();

  const deleteDialog = createModalSignal();

  const handleDelete = () => {
    deleteStream(props.stream.id);
    deleteDialog.close()
  };

  return (
    <>
      <div
        class="p-2 bg-white rounded border border-gray-100 cursor-pointer hover:bg-gray-50"
        onClick={showEditDialog.open}
      >
        <p class="font-medium text-sm truncate">{props.stream.title}</p>
        <p class="text-xs text-gray-600">
          {props.stream.start.toFormat("HH:mm")} - {props.stream.end.toFormat("HH:mm")}
        </p>
      </div>

      <StreamEditDialog
        stream={(props.stream)}
        dialog={showEditDialog}
        deleteDialog={deleteDialog}
      />

      <ConfirmationDialog
        isOpen={deleteDialog.isOpen()}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Stream"
        text={
          action.deleteStream.lastErrorMessage
            ? `Error: ${action.deleteStream.lastErrorMessage}`
            : "Are you sure you want to delete this stream? This action cannot be undone."
        }
        onConfirm={handleDelete}
        onCancel={() => {
          deleteDialog.close()
          showEditDialog.open()
        }}
      />

      {/* Display loading indicator when deleting */}
      <Show when={action.deleteStream.actionInProgress}>
        <div class="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div class="bg-white p-4 rounded-lg shadow-xl">
            <div class="flex items-center gap-2">
              <div class="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full"></div>
              <span>Deleting stream...</span>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
