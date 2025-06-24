import {type Component, Show} from "solid-js";
import {useScheduleEditor} from "../../../providers/ScheduleEditorProvider.tsx";
import type {StreamType} from "./StreamType.ts";
import {StreamEditDialog} from "./StreamEditDialog.tsx";
import {createModalSignal} from "../../../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../../../common/dialogs/ConfirmationDialog.tsx";
import {getStreamColors} from "../../../../../../../functions/jjDatesToColors.ts";
import {twMerge} from "tailwind-merge";

// Component for a single stream card
interface StreamCardProps {
  stream: StreamType;
  showDate: boolean
  whiteBackground: boolean
}

export const StreamCard: Component<StreamCardProps> = (props) => {
  const {
    deleteStream,
    action
  } = useScheduleEditor();

  const getDayBackgroundColor = () => {
    if (props.whiteBackground) {
      return undefined
    }
    return getStreamColors(props.stream.start)['50']
    /*
    switch (props.dayIndex) {
      case 0:
        return 'bg-day-1-50'
      case 1:
        return 'bg-day-2-50'
      case 2:
        return 'bg-day-3-50'
      case 3:
        return 'bg-day-4-50'
      case 4:
        return 'bg-day-5-50'
      case 5:
        return 'bg-day-6-50'
      case 6:
        return 'bg-day-7-50'
      default:
        return 'bg-white'
    }*/
  };

  const showEditDialog = createModalSignal();

  const deleteDialog = createModalSignal();

  const handleDelete = () => {
    deleteStream(props.stream.id);
    deleteDialog.close()
  };

  return (
    <>
      <div
        class={twMerge(
          getDayBackgroundColor(),
          "p-2 bg-white rounded border border-gray-100 cursor-pointer hover:bg-gray-50",
          !props.stream.visible && "opacity-70"
        )}
        onClick={showEditDialog.open}
      >
        <p class="font-medium text-sm truncate">{props.stream.title}</p>
        <div
          class={`text-xs px-1.5 py-0.5 rounded-full ml-1 ${props.stream.visible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {props.stream.visible ? 'Visible' : 'Hidden'}
        </div>
        <Show when={props.showDate}>
          <p class="text-xs text-gray-600">
            {props.stream.start.toFormat("EEE',' MMM dd")} {props.stream.start.toFormat("HH:mm")} - {props.stream.end.toFormat("HH:mm")}
          </p>
        </Show>
        <Show when={!props.showDate}>
          <p class="text-xs text-gray-600">
            {props.stream.start.toFormat("HH:mm")} - {props.stream.end.toFormat("HH:mm")}
          </p>
        </Show>
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
