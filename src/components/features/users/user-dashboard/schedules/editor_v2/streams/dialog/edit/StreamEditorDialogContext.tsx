import {createContext, createEffect, createSignal, on, onCleanup, type ParentComponent, useContext} from "solid-js";
import {useScheduleEditor2} from "../../../ScheduleEditorProvider.tsx";
import {createStore} from "solid-js/store";
import type {DraftParticipant, DraftTag, LocalDraftStream} from "../types/uiDraftTypes.ts";

type LocalDialogDraft = {
  stream: LocalDraftStream;
  tags: DraftTag[];
  participants: DraftParticipant[];
};

// The open dialog renews its edit lock this often; the server drops one not renewed for 3 minutes (KV-30)
const LOCK_RENEW_MS = 60_000;

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
  // The server's message when it refused a save or delete from this dialog (F-66)
  const [error, setError] = createSignal<string | null>(null);
  // What the dialog opened with: the save sends only what the user changed since (F-65)
  let opened: { stream: LocalDraftStream; tags: number[]; participants: number[] } | null = null;

  // Edit lock (F-64): taken on open, renewed while open, released on close (save, cancel, delete)
  const {lockStream, unlockStream, selfId} = useScheduleEditor2();
  const [holdsLock, setHoldsLock] = createSignal(false);
  let renewTimer: ReturnType<typeof setInterval> | undefined;
  const takeLock = () => {
    lockStream(id).then(
      () => {
        // Closed while the request was on its way: give it back
        if (isOpen()) setHoldsLock(true);
        else unlockStream(id).catch(() => {});
      },
      () => setHoldsLock(false),
    );
  };
  const releaseLock = () => {
    clearInterval(renewTimer);
    renewTimer = undefined;
    if (!holdsLock()) return;
    setHoldsLock(false);
    unlockStream(id).catch(() => {});
  };
  // Another editor's lock on this stream while the dialog is open: their saves win until they close it
  const lockedBy = () => {
    const by = state.streams.find((x) => x.id === id)?.lockedBy ?? null;
    return isOpen() && !holdsLock() && by !== selfId() ? by : null;
  };
  // The lock was released (their dialog closed, their tab gone, or our other tab saved): take it now
  createEffect(on(() => state.streams.find((x) => x.id === id)?.lockedBy, (by) => {
    if (by == null && isOpen()) takeLock();
  }, {defer: true}));
  onCleanup(releaseLock);

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
    opened = {stream: {...draft.stream}, tags: tags.map((t) => t.id), participants: participants.map((p) => p.userId)};
    setError(null);
    setStreamId(id);
    setIsOpen(true);
    takeLock();
    clearInterval(renewTimer);
    renewTimer = setInterval(takeLock, LOCK_RENEW_MS);
  };

  const close = () => {
    releaseLock();
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
      // Only start / end are times; any other string compared as a date was NaN, so always "changed"
      const time = (v: unknown) => v instanceof Date || typeof v === 'string' ? new Date(v).getTime() : v;
      const changed = k === 'start' || k === 'end' ? time(ov) !== time(nv) : ov !== nv;
      if (changed) {
        // @ts-ignore
        patch[k] = next[k as keyof typeof next] ?? null;
      }
    });
    return patch;
  };

  // The live ids with the user's additions and removals since the dialog opened applied, so
  // ids others added or removed meanwhile stay as they are (F-65)
  const mergeIds = (live: number[], orig: number[], next: number[]) => {
    const removed = orig.filter((x) => !next.includes(x));
    const added = next.filter((x) => !orig.includes(x) && !live.includes(x));
    return [...live.filter((x) => !removed.includes(x)), ...added];
  };

  const save = async () => {
    if (!isOpen() || streamId() == null || !draft) return;
    try {
      setIsSaving(true);
      const id = streamId()!;
      const orig = opened;
      if (!orig || !state.streams.some((s) => s.id === id)) return;
      // Diff against the copy the dialog opened with, not the live stream (F-65)
      const patch = buildPatch(orig.stream, draft.stream);
      // For temp streams, provider.updateStream applies locally without backend

      const participants = mergeIds(
        (state.participantsByStream[id] ?? []).map((p) => p.userId),
        orig.participants,
        draft.participants.map((p) => p.userId),
      );
      const tags = mergeIds(
        (state.tagsByStream[id] ?? []).map((t) => t.id),
        orig.tags,
        draft.tags.map((t) => t.id),
      );

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
    error,
    setError,
    lockedBy,
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
