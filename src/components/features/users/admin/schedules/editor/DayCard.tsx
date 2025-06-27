import {type Component, createMemo, For, Show} from "solid-js";
import {DateTime} from "luxon";
import {StreamCard} from "./stream/StreamCard.tsx";
import {useScheduleEditor} from "../../providers/ScheduleEditorProvider.tsx";
import {FaRegularCalendarPlus, FaRegularEye, FaRegularEyeSlash, FaRegularTrashCan} from "solid-icons/fa";
import {createModalSignal} from "../../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../../common/dialogs/ConfirmationDialog.tsx";


// Component for a single day card in the desktop view
interface DayCardProps {
  dayIndex: number;
  day: DateTime;
}

export const DayCard: Component<DayCardProps> = (props) => {

  const {
    addNewStream,
    getAllDays,
    getStreamsByDay,
    hideStreams,
    showStreams,
    deleteStreams,
    action,
  } = useScheduleEditor();

  const deleteConfirmDialog = createModalSignal();

  const handleDeleteStreams = () => {
    deleteStreams(ids());
    deleteConfirmDialog.close();
  };

  // Function to get the background color class based on the day number
  const getDayBackgroundColor = () => {
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
    }
  };

  const streams = () => getStreamsByDay(props.day.day)

  const ids = () => streams().map((stream) => stream.id)

  const disableHideAll = createMemo(() => {
    const s = streams()
    return s.length === 0 || s.every(stream => !stream.visible)
  })

  const disableShowAll = createMemo(() => {
    const s = streams()
    return s.length === 0 || s.every(stream => stream.visible)
  })

  return (
    <div class={`border border-gray-200 rounded-lg p-3 ${getDayBackgroundColor()}`}>
      <div class="flex justify-between items-center mb-2">
        <h4 class="font-bold">{props.day.toFormat("ccc d")}</h4>
        <button
          onClick={() => addNewStream(props.day.day)}
          class="text-accent hover:text-accent-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={action.addNewStream.actionInProgress}
          title="Add stream"
        >
          <FaRegularCalendarPlus/>
        </button>

        <button
          onClick={deleteConfirmDialog.open}
          class="text-primary hover:text-primary-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={streams().length === 0}
          title="Delete All stream"
        ><FaRegularTrashCan/>
        </button>
      </div>
      <div class="flex justify-around items-center mb-2">
        <button
          onClick={() => hideStreams(ids())}
          disabled={disableHideAll()}
          class="text-accent hover:text-accent-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Hide All Streams"
        ><FaRegularEyeSlash/>
        </button>
        <button
          onClick={() => showStreams(ids())}
          disabled={disableShowAll()}
          class="text-accent hover:text-accent-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Show All Streams"
        ><FaRegularEye/>
        </button>
      </div>

      <div class="space-y-2">
        <Show when={streams().length > 0} fallback={
          <p class="text-xs text-gray-500">No streams</p>
        }>
          <For each={streams()}>
            {(stream) => (
              <StreamCard stream={(stream)} showDate={false} whiteBackground={true}/>
            )}
          </For>
        </Show>
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirmDialog.isOpen()}
        onOpenChange={deleteConfirmDialog.setOpen}
        title="Delete All Streams"
        text={`Are you sure you want to delete all streams for ${props.day.toFormat("ccc d")}? This action cannot be undone.`}
        onConfirm={handleDeleteStreams}
        onCancel={deleteConfirmDialog.close}
      />
    </div>
  );
}
