import {createContext, createEffect, createSignal, on, type ParentComponent, useContext} from "solid-js";
import {useMutation, useQuery} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../../lib/orpc/client.ts";
import {createStore} from "solid-js/store";
import type {
  EditChannelMessage,
  InitDraftStream,
  InitTag
} from "../../../../../../lib/orpc/private/scheduleEditing/scheduleEditingTypes.ts";
import {normalizeInitPayloadDates} from "../../../../../../lib/orpc/private/scheduleEditing/scheduleEditingTypes.ts";
import type {EditScheduleMetaPatch} from "../../../../../../lib/orpc/private/scheduleEditing/scheduleMeta/contract.ts";
import type {UserDisplay} from "../../../../../../lib/orpc/private/schemas/users.ts";

// Shared schedule-editing types; UI-only tempId extension
type DraftStream = InitDraftStream // & { tempId?: string }
type DraftTag = InitTag

export type ScheduleDraftState = {
  schedule: {
    id: number
    title: string
    slug: string
    year: number
    visible: boolean
    updatedAt: Date | string
  } | null
  streams: DraftStream[]
  tagsByStream: Record<number, DraftTag[]>
  participantsByStream: Record<number, UserDisplay[]>
  isReady: boolean
}

const initialState: ScheduleDraftState = {
  schedule: null,
  streams: [],
  tagsByStream: {},
  participantsByStream: {},
  isReady: false,
}

const useScheduleEditor2Hook = (scheduleId: number) => {
  const [state, setState] = createStore<ScheduleDraftState>(initialState)
  const [events, setEvents] = createSignal<EditChannelMessage[]>([])
  const addEvent = (event: EditChannelMessage) => {
    setEvents((prevState) => {
      return [...prevState, event]
    })
  }

  const scheduleEditing = orpcPrivate.scheduleEditingWS
  const users = orpcPrivate.users
  const sse = useQuery(() => scheduleEditing.streamDraftWS
    .experimental_liveOptions({
      input: {scheduleId},
    })
  )

  const ensureArray = <T, >(v: T[] | undefined) => v ?? []
  const ensureMap = <T, >(m: Record<string, T[]> | undefined) => m ?? {}

  const handleEvents = (msg: EditChannelMessage) => {
    addEvent(msg)
    switch (msg.event) {
      case 'init': {
        const snap = normalizeInitPayloadDates(msg.payload as any)
        setState((prev) => ({
          ...prev,
          schedule: snap.schedule ?? null,
          streams: ensureArray(snap.streams).map((s) => ({...s, tempId: (s as any).tempId})),
          tagsByStream: ensureMap(snap.tagsByStream),
          participantsByStream: ensureMap(snap.participantsByStream),
          isReady: true,
        }))
        break
      }
      case 'schedule_updated': {
        const patch = msg.payload.patch as Partial<ScheduleDraftState['schedule']>
        if (patch) {
          setState('schedule', (prev) => {
            return prev ? ({...prev, ...patch}) : prev
          })
        }
        break
      }
      case 'stream_added': {
        const stream = msg.payload as DraftStream
        if (stream && typeof (stream as any).id === 'number') {
          setState('streams', (prev) => prev.some(s => s.id === stream.id) ? prev : [...prev, stream])
        }
        break
      }
      case 'stream_updated': {
        const {id, patch} = msg.payload
        if (id != null && patch) {
          const idx = state.streams.findIndex(s => s.id === id)
          if (idx >= 0) {
            setState('streams', idx, (prev) => ({...(prev as DraftStream), ...(patch as Partial<DraftStream>)}))
          }
        }
        break
      }
      case 'stream_updated_with_details': {
        const {id, patch, tags, participants} = msg.payload
        const idx = state.streams.findIndex(s => s.id === id)
        if (idx >= 0 && patch) {
          setState('streams', idx, (prev) => ({...prev, ...patch}))
        }
        if (tags) {
          setState('tagsByStream', id, tags)
        }
        if (participants) {
          setState('participantsByStream', id, participants)
        }
        break
      }
      case 'stream_deleted': {
        const {id} = msg.payload
        if (id != null) {
          setState('streams', (prev) => prev.filter(s => s.id !== id))
          // cleanup maps
          setState('tagsByStream', (prev) => {
            const nm = {...prev}
            delete nm[id]
            return nm
          })
          setState('participantsByStream', (prev) => {
            const nm = {...prev}
            delete nm[id]
            return nm
          })
        }
        break
      }
      case 'tag_added': {
        const {streamId, id, slug, name} = msg.payload
        setState('tagsByStream', streamId, (prev) => {
          return [...prev, {
            name, slug, id,
          }]
        })
        break
      }
      case 'tag_removed': {
        const {streamId, id} = msg.payload
        const key = String(streamId)
        setState('tagsByStream', streamId, (prev) => {
          return prev.filter(s => s.id !== id)
        })
        break
      }
      case 'participant_added': {
        const {streamId, user} = msg.payload
        setState('participantsByStream', streamId, (prev) => {
          return [...prev, user]
        })
        break
      }
      case 'participant_removed': {
        const {streamId, userId} = msg.payload
        setState('participantsByStream', streamId, (prev) => {
          return prev.filter(s => s.userId !== userId)
        })
        break
      }
      case 'draft_published': {
        console.log('draft_published')
        /*
        const idMap = msg.payload.idMap
        if (idMap && Object.keys(idMap).length > 0) {
          // Remap stream ids
          setState('streams', (prev) => prev.map(s => ({...s, id: idMap[s.id] ?? s.id})))
          // Remap tags map keys
          setState('tagsByStream', (prev) => {
            const nm: Record<string, DraftTag[]> = {}
            for (const [k, v] of Object.entries(prev)) {
              const newKey = String(idMap[Number(k)] ?? Number(k))
              nm[newKey] = v
            }
            return nm
          })
          // Remap participants map keys
          setState('participantsByStream', (prev) => {
            const nm: Record<string, UserDisplay[]> = {}
            for (const [k, v] of Object.entries(prev)) {
              const newKey = String(idMap[Number(k)] ?? Number(k))
              nm[newKey] = v
            }
            return nm
          })
        }
        // Touch schedule.updatedAt to now
        setState('schedule', (prev) => prev ? ({...prev, updatedAt: new Date()}) : prev)
        */
        break
      }
      case 'draft_discarded': {
        // Clear draft state but keep schedule meta untouched (optional design)
        /*
        setState((prev) => ({
          ...prev,
          schedule: prev.schedule,
          streams: [],
          tagsByStream: {},
          participantsByStream: {},
          isReady: true,
        }))
        */
        console.log('draft_discarded')
        break
      }
      case 'lock': {
        const {streamId, userId} = msg.payload
        const idx = state.streams.findIndex(s => s.id === streamId)
        if (idx >= 0) {
          // setState('streams', idx, (prev) => ({...(prev as DraftStream), lockedBy: userId}))
          setState('streams', idx, 'lockedBy', userId)
        }
        break
      }
      case 'unlock': {
        const {streamId} = msg.payload
        const idx = state.streams.findIndex(s => s.id === streamId)
        if (idx >= 0) {
          // setState('streams', idx, (prev) => ({...(prev as DraftStream), lockedBy: null}))
          setState('streams', idx, 'lockedBy', null)
        }
        break
      }
      default:
        break
    }

  }

  // Apply incoming SSE events to the local store
  createEffect(on(() => sse.data, (event) => {
    if (event !== undefined) {
      const payload = event.payload
      if (payload) {
        handleEvents(event)
      }
    }
  }))

  // Mutations
  const deleteMutation = useMutation(
    () => orpcPrivate.schedules.delete.mutationOptions()
  )

  const deleteSchedule = () => deleteMutation.mutateAsync(scheduleId)


  // Schedule meta
  const updateMetaMutation = useMutation(
    () => scheduleEditing.upsertScheduleMeta.mutationOptions()
  )
  // @ts-ignore
  const updateMeta = (input: EditScheduleMetaPatch) => updateMetaMutation.mutateAsync(input)

  const startEditingSessionMutation = useMutation(
    () => scheduleEditing.startEditingSession.mutationOptions()
  )
  // @ts-ignore
  const startEditingSession = () => startEditingSessionMutation.mutateAsync({scheduleId})

  const publishDraftMutation = useMutation(
    () => scheduleEditing.publishDraft.mutationOptions()
  )
  // @ts-ignore
  const publishDraft = () => publishDraftMutation.mutateAsync({scheduleId})

  const discardDraftMutation = useMutation(
    () => scheduleEditing.discardDraft.mutationOptions()
  )
  // @ts-ignore
  const discardDraft = () => discardDraftMutation.mutateAsync({scheduleId})

  // Streams
  let tempIdCounter = -1
  const addStreamMutation = useMutation(
    () => scheduleEditing.addStream.mutationOptions(),
  )
  const addStream = (input: {
    title: string;
    start: Date;
    end: Date;
    visible?: boolean;
    subtitle?: string;
    description?: string;
    youtubeVodUrl?: string;
    twitchVodUrl?: string;
  }) =>
    addStreamMutation.mutateAsync({scheduleId, ...input})

  /*
  const addStreamWithDetailsMutation = useMutation(
    () => scheduleEditing.addStreamWithDetails.mutationOptions(),
  )

  const addStreamWithDetails = (input: {
    title: string;
    start: Date;
    end: Date;
    visible?: boolean;
    subtitle?: string | null;
    description?: string | null;
    youtubeVodUrl?: string | null;
    twitchVodUrl?: string | null;
    participants?: number[];
    tags?: number[];
  }) =>
    // @ts-ignore
    addStreamWithDetailsMutation.mutateAsync({scheduleId, ...input})*/

  const createLocalStream = (input: {
    title: string;
    start: Date;
    end: Date;
    visible?: boolean;
    subtitle?: string | null;
    description?: string | null;
    youtubeVodUrl?: string | null;
    twitchVodUrl?: string | null;
  }) => {
    const id = tempIdCounter--
    const placeholder: DraftStream = {
      id,
      scheduleId,
      createdBy: 0,
      title: input.title ?? '',
      visible: input.visible ?? false,
      subtitle: input.subtitle ?? null,
      description: input.description ?? null,
      youtubeVodUrl: input.youtubeVodUrl ?? null,
      twitchVodUrl: input.twitchVodUrl ?? null,
      start: input.start,
      end: input.end,
      updatedAt: undefined,
      lockedBy: null,
    }
    setState('streams', (prev) => [...prev, placeholder])
    return id
  }

  const saveLocalStream = async (id: number) => {
    const idx = state.streams.findIndex(s => s.id === id)
    if (idx < 0) return null
    const s = state.streams[idx]
    const res = await addStream({
      title: s.title,
      start: s.start,
      end: s.end,
      visible: s.visible,
      subtitle: s.subtitle ?? undefined,
      description: s.description ?? undefined,
      youtubeVodUrl: s.youtubeVodUrl ?? undefined,
      twitchVodUrl: s.twitchVodUrl ?? undefined,
    })
    // replace temp with real id
    setState('streams', idx, (prev) => ({...(prev as DraftStream), id: res.id, tempId: undefined}))
    return res.id
  }

  const updateStreamMutation = useMutation(
    () => scheduleEditing.updateStreamWithDetails.mutationOptions()
  )
  const updateStream = (input: {
    id: number;
    patch?: Partial<{
      title: string;
      visible: boolean;
      subtitle?: string | null;
      description?: string | null;
      youtubeVodUrl?: string | null;
      twitchVodUrl?: string | null;
      start: Date;
      end: Date
    }>;
    participants?: number[];
    tags?: number[];
  }) => {
    const idx = state.streams.findIndex(s => s.id === input.id)
    // local-only patch for temporary streams
    if (input.patch) {
      setState('streams', idx, (prev) => ({...(prev as DraftStream), ...(input.patch as any)}))
    }
    console.log('updateStream', input)
    // @ts-ignore
    return updateStreamMutation.mutateAsync({scheduleId, ...input})
  }

  const updateStreamsMutation = useMutation(
    () => scheduleEditing.updateStreamsWithDetails.mutationOptions()
  )

  const updateStreams = (inputs: {
    id: number;
    patch?: Partial<{
      title: string;
      visible: boolean;
      subtitle?: string | null;
      description?: string | null;
      youtubeVodUrl?: string | null;
      twitchVodUrl?: string | null;
      start: Date;
      end: Date
    }>;
    participants?: number[];
    tags?: number[];
  }[]) => {
    for (const input of inputs) {
      const idx = state.streams.findIndex(s => s.id === input.id)
      // local-only patch for temporary streams
      if (input.patch) {
        setState('streams', idx, (prev) => ({...(prev as DraftStream), ...(input.patch as any)}))
      }
      console.log('updateStream', input)
    }
    
    return updateStreamsMutation.mutateAsync({scheduleId, streams: inputs})
  }


  const deleteStreamMutation = useMutation(
    () => scheduleEditing.deleteStream.mutationOptions()
  )
  const deleteStream = (id: number) => {
    // remove locally
    setState('streams', (prev) => prev.filter(s => s.id !== id))
    // @ts-ignore
    return deleteStreamMutation.mutateAsync({scheduleId, id})
  }

  // Tags
  const addTagToStreamMutation = useMutation(
    () => scheduleEditing.addTagToStream.mutationOptions()
  )
  const addTagToStream = (input: { streamId: number, tag: string }) =>
    addTagToStreamMutation.mutateAsync({scheduleId, ...input})

  const removeTagFromStreamMutation = useMutation(
    () => scheduleEditing.removeTagFromStream.mutationOptions()
  )
  const removeTagFromStream = (input: { streamId: number; tagId: number }) =>
    removeTagFromStreamMutation.mutateAsync({scheduleId, streamId: input.streamId, id: input.tagId})

  // Participants
  const addParticipantMutation = useMutation(
    () => scheduleEditing.addParticipant.mutationOptions()
  )
  const addParticipant = (input: { streamId: number; userId: number }) =>
    addParticipantMutation.mutateAsync({scheduleId, ...input})

  const removeParticipantMutation = useMutation(
    () => scheduleEditing.removeParticipant.mutationOptions()
  )
  const removeParticipant = (input: { streamId: number; userId: number }) =>
    removeParticipantMutation.mutateAsync({scheduleId, ...input})

  // Stream editing lock
  const lockStreamMutation = useMutation(
    () => scheduleEditing.lockStream.mutationOptions()
  )
  const unlockStreamMutation = useMutation(
    () => scheduleEditing.unlockStream.mutationOptions()
  )
  // @ts-ignore
  const lockStream = (streamId: number) => lockStreamMutation.mutateAsync({scheduleId, streamId})
  // @ts-ignore
  const unlockStream = (streamId: number) => unlockStreamMutation.mutateAsync({scheduleId, streamId})

  createEffect(() => {
    void startEditingSession()
  })


  const relations = useQuery(
    () => users.getRelations.queryOptions()
  )

  return {
    state,
    deleteSchedule, deleteMutation,
    // meta
    updateMeta, updateMetaMutation,
    startEditingSession, startEditingSessionMutation,
    publishDraft, publishDraftMutation,
    discardDraft, discardDraftMutation,
    // streams
    addStream, addStreamMutation,
    // addStreamWithDetails, addStreamWithDetailsMutation,
    createLocalStream, saveLocalStream,
    updateStream, updateStreamMutation,
    updateStreams, updateStreamsMutation,
    deleteStream, deleteStreamMutation,
    // tags
    addTagToStream, addTagToStreamMutation,
    removeTagFromStream, removeTagFromStreamMutation,
    // participants
    addParticipant, addParticipantMutation,
    removeParticipant, removeParticipantMutation,
    // locks
    lockStream, lockStreamMutation,
    unlockStream, unlockStreamMutation,
    events,

    // relations
    relations,
  }
}

interface ScheduleEditorProps {
  scheduleId: number
}

const ScheduleEditorContext = createContext<ReturnType<typeof useScheduleEditor2Hook>>();

export const ScheduleEditorProvider: ParentComponent<ScheduleEditorProps> = (props) => {
  const hook = useScheduleEditor2Hook(props.scheduleId)
  return (
    <ScheduleEditorContext.Provider value={hook}>
      {props.children}
    </ScheduleEditorContext.Provider>
  );
}

// @ts-ignore
export const useScheduleEditor2 = () => useContext(ScheduleEditorContext)!
