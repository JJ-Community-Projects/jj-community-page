import { type Component, Show } from 'solid-js'
import { formatTimeRange } from './utils/dateUtils.ts'
import { StreamEditorDialogProvider, useStreamEditorDialog } from './dialog/edit/StreamEditorDialogContext.tsx'
import StreamEditDialog from './dialog/edit/StreamEditDialog.tsx'
import { FaRegularEye, FaRegularEyeSlash, FaSolidLock } from 'solid-icons/fa'
import { useScheduleEditor2 } from '../ScheduleEditorProvider.tsx'
import { cn, focusRing } from '../../../../../../ui/cn'

export type DraftStream = {
  id: number;
  title: string;
  visible: boolean;
  start: Date | string;
  end: Date | string;
};


const StreamCardBody: Component<{ stream: DraftStream }> = (props) => {
  const dialog = useStreamEditorDialog();
  const { state, selfId, lockHolderName } = useScheduleEditor2();
  const s = () => props.stream;
  // Another editor has this stream open in their Edit dialog (F-64)
  const lockedBy = () => {
    const by = state.streams.find((x) => x.id === props.stream.id)?.lockedBy ?? null;
    return by !== null && by !== selfId() ? by : null;
  };

  // The browser tests read the title line as "<title> (<id>)" and the button's name starts with it
  return (
    <button
      type="button"
      class={cn(
        'rounded-media bg-surface-strong text-fg shadow-tile ring-line hover:ring-accent-300 w-full cursor-pointer p-2 text-left ring-1 transition-shadow',
        !s().visible && 'bg-surface-strong/70',
        focusRing,
      )}
      onClick={() => dialog.open()}
    >
      <div class="text-sm leading-snug font-semibold wrap-break-word">
        {s().title || "Untitled stream"}{' '}
        <span class="text-fg-muted text-xs font-normal">({props.stream.id})</span>
      </div>
      <div class="text-fg-muted mt-1 flex items-center gap-1.5 text-xs">
        <Show
          when={s().visible}
          fallback={<FaRegularEyeSlash class="size-3 shrink-0" aria-hidden="true" />}
        >
          <FaRegularEye class="text-success-text size-3 shrink-0" aria-hidden="true" />
        </Show>
        <span>{formatTimeRange(s().start, s().end)}</span>
        <span class="sr-only">{s().visible ? 'Visible' : 'Hidden'}</span>
      </div>
      <Show when={lockedBy()}>
        {(holder) => (
          <div class="text-warning-800 mt-1 flex items-center gap-1 text-xs font-semibold">
            <FaSolidLock class="size-3 shrink-0" aria-hidden="true" /> editing: {lockHolderName(holder())}
          </div>
        )}
      </Show>
    </button>
  );
};

export const StreamCard: Component<{ stream: DraftStream }> = (props) => {

  return (
    <StreamEditorDialogProvider id={props.stream.id}>
      <StreamCardBody stream={props.stream}/>
      <StreamEditDialog/>
    </StreamEditorDialogProvider>
  );
};
