import { type Component, createSignal, Show } from "solid-js";
import { useAddStreamDialog } from "./AddStreamDialogContext.tsx";
import { Dialog } from "../../../../../../../../ui/Dialog";
import { Button } from "../../../../../../../../ui/Button";
import { Alert } from "../../../../../../../../ui/Status";
import {
  StreamDetailsFields,
  StreamLinksFields,
  StreamTagsField,
  StreamTimeFields,
} from "../shared/StreamFields.tsx";

export const AddStreamDialog: Component = () => {
  const dialog = useAddStreamDialog();
  // A refused create keeps the dialog open with the server's message
  const [error, setError] = createSignal<string | null>(null);

  const close = () => {
    setError(null);
    dialog.close();
  };

  const onCreate = async () => {
    setError(null);
    try {
      await dialog.save();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Dialog
      open={dialog.isOpen()}
      onOpenChange={(o) => (!o ? close() : void 0)}
      title="Add Stream"
      size="lg"
      footer={
        <>
          <Button size="sm" onClick={close}>Cancel</Button>
          <Button size="sm" variant="primary" onClick={onCreate} disabled={dialog.isSaving()}>
            {dialog.isSaving() ? "Creating…" : "Create"}
          </Button>
        </>
      }
    >
      <div class="flex flex-col gap-6">
        <Show when={error()}>
          {(message) => <Alert tone="danger">{message()}</Alert>}
        </Show>
        <StreamDetailsFields api={dialog} />
        <StreamTimeFields api={dialog} minDate={dialog.minDate()} maxDate={dialog.maxDate()} />
        <StreamTagsField api={dialog} />
        <StreamLinksFields api={dialog} />
      </div>
    </Dialog>
  );
};

export default AddStreamDialog;
