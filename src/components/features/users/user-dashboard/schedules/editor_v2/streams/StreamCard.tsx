import { type Component, Show } from 'solid-js'
import { formatTimeRange } from './utils/dateUtils.ts'
import { StreamEditorDialogProvider, useStreamEditorDialog } from './dialog/edit/StreamEditorDialogContext.tsx'
import StreamEditDialog from './dialog/edit/StreamEditDialog.tsx'
import { FaRegularEye, FaRegularEyeSlash, FaSolidLock } from 'solid-icons/fa'
import { useScheduleEditor2 } from '../ScheduleEditorProvider.tsx'

export type DraftStream = {
  id: number;
  title: string;
  visible: boolean;
  start: Date | string;
  end: Date | string;
};


const StreamCardBody: Component<{ stream: DraftStream; showDate?: boolean; whiteBackground?: boolean }> = (props) => {
  const dialog = useStreamEditorDialog();
  const { state, selfId, lockHolderName } = useScheduleEditor2();
  const s = () => props.stream;
  // Another editor has this stream open in their Edit dialog (F-64)
  const lockedBy = () => {
    const by = state.streams.find((x) => x.id === props.stream.id)?.lockedBy ?? null;
    return by !== null && by !== selfId() ? by : null;
  };

  return (
    <button
      class={`w-full text-left rounded-lg border p-3 hover:shadow transition bg-white`}
      onClick={() => dialog.open()}
    >
      <div class="flex items-center justify-between">
        <div class="font-medium truncate">{s().title || "Untitled stream"} ({props.stream.id})</div>
        <span
          class={`text-xs px-2 py-0.5 rounded-full ${s().visible ? 'bg-success-100 text-success-700' : 'bg-neutral-200 text-neutral-700'}`}>
          {s().visible ? <FaRegularEye/> : <FaRegularEyeSlash/>}
        </span>
      </div>
      <div class="text-xs text-gray-600 mt-1">{formatTimeRange(s().start, s().end)}</div>
      <Show when={lockedBy()}>
        {(holder) => (
          <div class="text-xs text-amber-700 mt-1 flex items-center gap-1">
            <FaSolidLock/> editing: {lockHolderName(holder())}
          </div>
        )}
      </Show>
    </button>
  );
};

export const StreamCard: Component<{
  stream: DraftStream;
  showDate?: boolean;
  whiteBackground?: boolean
}> = (props) => {

  return (
    <StreamEditorDialogProvider id={props.stream.id}>
      <StreamCardBody stream={props.stream} showDate={props.showDate} whiteBackground={props.whiteBackground}/>
      <StreamEditDialog/>
    </StreamEditorDialogProvider>
  );
};
