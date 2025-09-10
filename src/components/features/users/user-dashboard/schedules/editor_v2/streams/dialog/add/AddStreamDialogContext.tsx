import {createContext, createSignal, type ParentComponent, useContext} from "solid-js";
import {createStore} from "solid-js/store";
import {useScheduleEditor2} from "../../../ScheduleEditorProvider.tsx";
import type {DraftParticipant, DraftTag, LocalDraftStream} from "../types/uiDraftTypes.ts";

// Use the same local draft shape as the edit dialog
export type LocalDialogDraft = {
  stream: LocalDraftStream;
  tags: DraftTag[];
  participants: DraftParticipant[];
};

// Encapsulate dialog logic in a hook to match the pattern used by ScheduleEditorProvider
const useAddStreamDialogHook = (start: Date, end: Date) => {
  const { addStream } = useScheduleEditor2();

  const [isOpen, setIsOpen] = createSignal(false);
  const [draft, setDraft] = createStore<LocalDialogDraft>({
    stream: {
      id: -1,
      title: "",
      visible: false,
      start,
      end,
    },
    tags: [],
    participants: [],
  });
  const [isSaving, setIsSaving] = createSignal(false);

  const openWith = (input: LocalDialogDraft) => {
    // shallow clone to detach references
    setDraft({
      stream: { ...input.stream },
      tags: input.tags?.map(t => ({ ...t })) ?? [],
      participants: input.participants?.map(p => ({ ...p })) ?? [],
    });
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setDraft({
      stream: {
        id: -1,
        title: "",
        visible: false,
        start,
        end,
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
  const addTagLocal = (tag: DraftTag) => setDraft("tags", (prev) => prev.some((t) => t.id === tag.id) ? prev : [...prev, { ...tag }]);
  const removeTagLocal = (tagId: number) => setDraft("tags", (prev) => prev.filter((t) => t.id !== tagId));
  const addParticipantLocal = (p: DraftParticipant) => setDraft("participants", (prev) => prev.some((x) => x.userId === p.userId) ? prev : [...prev, { ...p }]);
  const removeParticipantLocal = (userId: number) => setDraft("participants", (prev) => prev.filter((p) => p.userId !== userId));

  const save = async () => {
    try {
      setIsSaving(true);
      const d = draft.stream as LocalDraftStream;
      await addStream({
        title: d.title,
        start: d.start as Date,
        end: d.end as Date,
        visible: d.visible,
        subtitle: (d as any).subtitle ?? undefined,
        description: (d as any).description ?? undefined,
        youtubeVodUrl: (d as any).youtubeVodUrl ?? undefined,
        twitchVodUrl: (d as any).twitchVodUrl ?? undefined,
      });
      setIsOpen(false);
      setDraft({
        stream: {
          id: -1,
          title: "",
          visible: false,
          start,
          end,
        },
        tags: [],
        participants: [],
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addNew = (input: {
    title?: string;
    start: Date;
    end: Date;
    visible?: boolean;
    subtitle?: string | null;
    description?: string | null;
    youtubeVodUrl?: string | null;
    twitchVodUrl?: string | null;
  }) => {
    openWith({
      stream: {
        id: -1,
        title: input.title ?? "",
        start: input.start,
        end: input.end,
        visible: input.visible ?? false,
        subtitle: input.subtitle ?? null,
        description: input.description ?? null,
        youtubeVodUrl: input.youtubeVodUrl ?? null,
        twitchVodUrl: input.twitchVodUrl ?? null,
      },
      tags: [],
      participants: [],
    });
  };

  return {
    isOpen,
    // return draft directly (store proxy)
    draft,
    openWith,
    close,
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
    isSaving,
    save,
    addNew,
    minDate: () => start,
    maxDate: () => end,
  };
};

const AddCtx = createContext<ReturnType<typeof useAddStreamDialogHook>>();

export const AddStreamDialogProvider: ParentComponent<{ start: Date; end: Date }> = (props) => {
  const hook = useAddStreamDialogHook(props.start, props.end);
  return <AddCtx.Provider value={hook}>{props.children}</AddCtx.Provider>;
};

export const useAddStreamDialog = () => {
  const ctx = useContext(AddCtx);
  if (!ctx) throw new Error("useAddStreamDialog must be used within AddStreamDialogProvider");
  return ctx;
};
