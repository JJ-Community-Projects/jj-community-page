import {createContext, createSignal, type ParentComponent, useContext} from "solid-js";
import {useScheduleEditor2} from "../../../ScheduleEditorProvider.tsx";
import {createStore} from "solid-js/store";
import type {DraftParticipant, DraftTag, LocalDraftStream} from "../types/uiDraftTypes.ts";

type LocalDialogDraft = {
  stream: LocalDraftStream;
  tags: DraftTag[];
  participants: DraftParticipant[];
};

// Encapsulate dialog logic in a hook to match the pattern used by ScheduleEditorProvider
const useStreamEditorDialogHook = (id: number) => {

  const {state, updateStream, saveLocalStream, deleteStream} = useScheduleEditor2();

  const [isOpen, setIsOpen] = createSignal(false);
  const [streamId, setStreamId] = createSignal<number | null>(null);
  const [draft, setDraft] = createStore<LocalDialogDraft>({
    stream: {
      id: -1,
      title: "",
      visible: false,
      start: new Date(),
      end: new Date(),
    },
    tags: [],
    participants: [],
  });
  const [isSaving, setIsSaving] = createSignal(false);

  const open = () => {
    const s = state.streams.find((x) => x.id === id);
    if (!s) return;

    const tags = state.tagsByStream[s.id] ?? [];
    const participants = state.participantsByStream[s.id] ?? [];

    // clone into local store
    setDraft({
      stream: {
        id: s.id,
        title: s.title,
        visible: s.visible,
        subtitle: s.subtitle ?? null,
        description: s.description ?? null,
        youtubeVodUrl: s.youtubeVodUrl ?? null,
        twitchVodUrl: s.twitchVodUrl ?? null,
        start: s.start,
        end: s.end,
      },
      tags: tags,
      participants: participants,
    });
    setStreamId(id);
    setIsOpen(true);
  };

  const close = () => {
    // If a temp stream was created and user closes without saving, remove it
    // if (draft?.stream?.tempId && streamId() != null) {
    // deleteStream will remove locally for temp streams per provider logic
    // void deleteStream(streamId()!);
    // }
    setIsOpen(false);
    setStreamId(null);
    setDraft({
      stream: {
        id: -1,
        title: "",
        visible: false,
        start: new Date(),
        end: new Date(),
      },
      tags: [],
      participants: [],
    });
  };

  // Explicit setters per field (no generic setField)
  const setTitle = (value: string) => setDraft("stream", "title", value ?? "");
  const setVisible = (value: boolean) => setDraft("stream", "visible", Boolean(value));
  const setSubtitle = (value: string | null) => setDraft("stream", "subtitle", value ?? null);
  const setDescription = (value: string | null) => setDraft("stream", "description", value ?? null);
  const setYoutubeVodUrl = (value: string | null) => setDraft("stream", "youtubeVodUrl", value ?? null);
  const setTwitchVodUrl = (value: string | null) => setDraft("stream", "twitchVodUrl", value ?? null);
  const setStart = (value: Date) => setDraft("stream", "start", value);
  const setEnd = (value: Date) => setDraft("stream", "end", value);

  // Local-only mutations for tags and participants
  const addTagLocal = (tag: DraftTag) => setDraft("tags", (prev) => prev.some((t) => t.id === tag.id) ? prev : [...prev, {...tag}]);
  const removeTagLocal = (tagId: number) => setDraft("tags", (prev) => prev.filter((t) => t.id !== tagId));
  const addParticipantLocal = (p: DraftParticipant) => setDraft("participants", (prev) => prev.some((x) => x.userId === p.userId) ? prev : [...prev, {...p}]);
  const removeParticipantLocal = (userId: number) => setDraft("participants", (prev) => prev.filter((p) => p.userId !== userId));

  const buildPatch = (orig: any, next: any) => {
    const patch: any = {};
    (['title', 'visible', 'subtitle', 'description', 'youtubeVodUrl', 'twitchVodUrl', 'start', 'end'] as const).forEach((k) => {
      const ov = orig[k as keyof typeof orig];
      const nv = next[k as keyof typeof next];
      const ovt = ov instanceof Date ? ov.getTime() : (typeof ov === 'string' ? new Date(ov).getTime() : ov);
      const nvt = nv instanceof Date ? nv.getTime() : (typeof nv === 'string' ? new Date(nv).getTime() : nv);
      const changed = (ov instanceof Date || typeof ov === 'string')
        ? ovt !== nvt
        : ov !== nv;
      if (changed) {
        // @ts-ignore
        patch[k] = next[k as keyof typeof next] ?? null;
      }
    });
    return patch;
  };

  const save = async () => {
    if (!isOpen() || streamId() == null || !draft) return;
    try {
      setIsSaving(true);
      const id = streamId()!;
      const orig = state.streams.find((s) => s.id === id);
      if (!orig) return;
      const patch = buildPatch(orig, draft.stream);
      // For temp streams, provider.updateStream applies locally without backend

      const participants = draft.participants.map(p => p.userId)
      const tags = draft.tags.map(t => t.id);

      await updateStream({id, patch, participants: participants, tags: tags});

      setIsOpen(false);
      setStreamId(null);
      setDraft({
        stream: {
          id: -1,
          title: "",
          visible: false,
          start: new Date(),
          end: new Date(),
        },
        tags: [],
        participants: [],
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isOpen,
    streamId,
    // return draft directly (store proxy)
    draft,
    // dedicated setters
    setTitle,
    setVisible,
    setSubtitle,
    setDescription,
    setYoutubeVodUrl,
    setTwitchVodUrl,
    setStart,
    setEnd,
    // local-only mutations for tags/participants (no backend side effects)
    addTagLocal,
    removeTagLocal,
    addParticipantLocal,
    removeParticipantLocal,
    open,
    close,
    isSaving,
    save,
  };
};

const Ctx = createContext<ReturnType<typeof useStreamEditorDialogHook>>();

export const StreamEditorDialogProvider: ParentComponent<{ id: number }> = (props) => {
  const hook = useStreamEditorDialogHook(props.id);
  return (
    <Ctx.Provider value={hook}>
      {props.children}
    </Ctx.Provider>
  );
};

export const useStreamEditorDialog = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStreamEditorDialog must be used within StreamEditorDialogProvider");
  return ctx;
};
