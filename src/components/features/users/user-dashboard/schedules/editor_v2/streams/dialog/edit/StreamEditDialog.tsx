import {type Component, createSignal, Show} from "solid-js";
import {useScheduleEditor2} from "../../../ScheduleEditorProvider.tsx";
import {useStreamEditorDialog} from "./StreamEditorDialogContext.tsx";
import {StreamParticipantsSection} from "./StreamParticipantsSection.tsx";
import {
  StreamDetailsFields,
  StreamLinksFields,
  StreamTagsField,
  StreamTimeFields,
} from "../shared/StreamFields.tsx";
import {ConfirmDialog, Dialog} from "../../../../../../../../ui/Dialog";
import {Button} from "../../../../../../../../ui/Button";
import {Alert} from "../../../../../../../../ui/Status";

export const StreamEditDialog: Component = () => {
  const { state, lockHolderName, deleteStream, deleteStreamMutation } = useScheduleEditor2();
  const dialog = useStreamEditorDialog();
  const [confirmDelete, setConfirmDelete] = createSignal(false);

  const stream = () => {
    const id = dialog.streamId();
    if (id == null) return null;
    return state.streams.find((s) => s.id === id) ?? null;
  };

  const year = () => state.schedule?.year ?? new Date().getFullYear();

  // A refused save or delete keeps the dialog open with the server's message (F-66)
  const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

  const handleDelete = async (streamId: number) => {
    setConfirmDelete(false);
    dialog.setError(null);
    try {
      await deleteStream(streamId);
    } catch (error) {
      dialog.setError(errorMessage(error));
      return;
    }
    dialog.close();
  };

  const handleSave = async () => {
    dialog.setError(null);
    try {
      await dialog.save();
    } catch (error) {
      dialog.setError(errorMessage(error));
      return;
    }
    dialog.close();
  };

  return (
    <Dialog
      open={dialog.isOpen()}
      onOpenChange={(o) => (!o ? dialog.close() : void 0)}
      title="Edit"
      size="lg"
      footer={
        <Show when={stream()}>
          {(s) => (
            <>
              <Show when={dialog.error()}>
                {(message) => <Alert tone="danger" class="basis-full">{message()}</Alert>}
              </Show>
              <Button
                size="sm"
                variant="danger"
                class="mr-auto"
                onClick={() => setConfirmDelete(true)}
                disabled={deleteStreamMutation.isPending}
              >
                {deleteStreamMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
              <Button size="sm" onClick={dialog.close}>Close</Button>
              <Button size="sm" variant="primary" onClick={handleSave} disabled={dialog.isSaving()}>
                {dialog.isSaving() ? "Saving…" : "Save"}
              </Button>
              <ConfirmDialog
                open={confirmDelete()}
                onOpenChange={setConfirmDelete}
                title="Delete Stream"
                text="Delete this stream? This cannot be undone."
                confirmLabel="Delete"
                pending={deleteStreamMutation.isPending}
                onConfirm={() => handleDelete(s().id)}
              />
            </>
          )}
        </Show>
      }
    >
      <div class="flex flex-col gap-6">
        <Show when={dialog.lockedBy()}>
          {(holder) => (
            <Alert tone="warning" role="status">
              {lockHolderName(holder())} is editing this stream. Saving is refused until they close it.
            </Alert>
          )}
        </Show>
        <Show when={stream()} fallback={<p class="text-fg-muted text-sm">No stream selected.</p>}>
          <StreamDetailsFields api={dialog} />
          <StreamTimeFields
            api={dialog}
            minDate={new Date(year(), 0, 1, 0, 0, 0, 0)}
            maxDate={new Date(year(), 11, 31, 23, 59, 0, 0)}
          />
          <StreamParticipantsSection />
          <StreamTagsField api={dialog} />
          <StreamLinksFields api={dialog} />
        </Show>
      </div>
    </Dialog>
  );
};

export default StreamEditDialog;
