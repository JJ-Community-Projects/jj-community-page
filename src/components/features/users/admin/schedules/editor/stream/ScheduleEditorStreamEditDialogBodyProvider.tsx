/**
 * ScheduleEditorStreamEditDialogBodyProvider.tsx
 *
 * This file implements a specialized provider for editing a single stream in a dialog.
 * It provides a focused API for manipulating stream properties, tags, and participants,
 * with changes only being applied to the main schedule when explicitly saved.
 *
 * The provider:
 * - Creates a local copy of the stream being edited
 * - Provides methods for updating stream properties
 * - Handles adding and removing tags and participants
 * - Saves changes back to the main schedule editor when editing is complete
 *
 * This component works in conjunction with the ScheduleEditorProvider, using its
 * saveStream method to persist changes when editing is complete.
 */

import {createContext, type ParentComponent, useContext} from "solid-js";
import {useScheduleEditor} from "../../../providers/ScheduleEditorProvider.tsx";
import {useDayCard} from "../DayCardContext.tsx";
import {DateTime} from "luxon";
import {createModalSignal, type ModalSignal} from "../../../../../../../lib/createModalSignal.ts";
import {createStore, unwrap} from "solid-js/store";
import type {
  StreamType,
  Tag,
  Participant,
  ValueOrSetter
} from "../../../../../../../lib/model/admin/user/scheduleEditor/ScheduleEditorTypes";

/**
 * Type for values that can be either a direct value or a function that computes a new value from the previous one.
 * This pattern is used in state setters to allow both direct value assignment and computed updates.
 *
 * @see ValueOrSetter in ScheduleEditorTypes.ts
 */

/**
 * The main hook that powers the stream editing dialog functionality.
 *
 * This hook:
 * 1. Creates a local copy of the stream being edited
 * 2. Provides methods for updating stream properties
 * 3. Handles date formatting and validation
 * 4. Manages tags and participants
 * 5. Saves changes back to the main schedule editor
 *
 * Changes made through this hook are only applied to the local copy until
 * the save method is called, which then updates the main schedule.
 *
 * @param props - Object containing the stream to edit and modal signals
 * @returns An object containing the stream state and methods for manipulating it
 */
const useScheduleEditorStreamEditDialogBodyHook = () => {
  const {
    saveStream,
    action,
  } = useScheduleEditor();


  const editDialog = createModalSignal();

  const deleteDialog = createModalSignal();

  // const {minStr, maxStr} = useDayCard()

  const noStream: StreamType = {
    id: -1,
    title: '',
    subtitle: '',
    description: '',
    youtubeVodUrl:   '',
    twitchVodUrl:  '',
    visible: false,
    start: DateTime.now(),
    end: DateTime.now(),
    tags:   [],
    participants:  [],
    createdBy: -1
  }

  const [stream, setStream] = createStore<StreamType>(noStream)

  const start = () => stream?.start.toLocal()
  const end = () => stream?.end.toLocal()

  const startFormated = () => start().toFormat("yyyy-MM-dd'T'HH:mm")
  const endFormated = () => end().toFormat("yyyy-MM-dd'T'HH:mm")

  const localEndDateMin = () => {
    return start().plus({
      hours: 1,
    }).toFormat("yyyy-MM-dd'T'HH:mm")
  }

  const localStartDateMax = () => {
    return end().minus({
      hours: 1,
    }).toFormat("yyyy-MM-dd'T'HH:mm")
  }

  const save = (e: Event) => {
    if (!stream){
      return
    }
    e.preventDefault(); // Prevent default form submission
    saveStream(stream);
    editDialog.close()
  }

  const setTitle = (title: ValueOrSetter<string>) => {
    setStream('title', title)
  }

  const setSubtitle = (title: ValueOrSetter<string>) => {
    setStream('subtitle', title);
  }

  const setDescription = (description: ValueOrSetter<string>) => {
    setStream('description', description);
  }

  const setStart = (date: ValueOrSetter<DateTime>) => {
    setStream('start', date)
  }

  const setEnd = (date: ValueOrSetter<DateTime>) => {
    setStream('end', date)
  }

  const setVisible = (visible: ValueOrSetter<boolean>) => {
    setStream('visible', visible)
  }

  const addParticipant = (participant: Participant) => {
    setStream('participants', (lst) => [...lst, participant])
  }

  const removeParticipant = (participantId: number) => {
    setStream('participants', (lst) => lst.filter((participant) => participant.userId !== participantId))
  }

  const addTag = (tag: Tag) => {
    setStream('tags', (lst) => [...lst, tag])
  }

  const removeTag = (tag: string) => {
    setStream('tags', (lst) => lst.filter((t) => t.tag !== tag))
  }

  const setYouTubeVodUrl = (url: ValueOrSetter<string | undefined>) => {
    setStream('youtubeVodUrl', url)
  }

  const setTwitchVodUrl = (url: ValueOrSetter<string | undefined>) => {
    setStream('twitchVodUrl', url)
  }


  const openEdit = (stream: StreamType) => {
    setStream(unwrap(stream));
    editDialog.open()
  }

  const closeEdit = () => {
    setStream(noStream);
    editDialog.close()
  }

  const openDelete = () => {
    deleteDialog.open()
    editDialog.close()
  }

  const closeDelete = () => {
    deleteDialog.close()
  }


  return {
    stream: stream,
    save: save,
    setTitle,
    setSubtitle,
    setDescription,
    setStart,
    setEnd,
    setVisible,
    addParticipant,
    removeParticipant,
    addTag,
    removeTag,
    localEndDateMin,
    localStartDateMax,
    setYouTubeVodUrl,
    setTwitchVodUrl,
    openEdit,
    closeEdit,
    openDelete,
    closeDelete,
    deleteDialog,
    editDialog
  }
}


/**
 * Context for providing the stream editor functionality to child components.
 * The context value is the return value of the useScheduleEditorStreamEditDialogBodyHook.
 */
const ScheduleEditorStreamEditDialogBodyContext = createContext<ReturnType<typeof useScheduleEditorStreamEditDialogBodyHook>>();

/**
 * Provider component that makes stream editing functionality available to its children.
 *
 * This component:
 * 1. Creates an instance of the useScheduleEditorStreamEditDialogBodyHook
 * 2. Provides the hook's return value to all children via context
 *
 * Child components can access the stream editing functionality using the useStreamEditor hook.
 *
 * @param props - Object containing the stream to edit, modal signals, and children
 * @returns A provider component with the stream editor context
 */
export const ScheduleEditorStreamEditDialogBodyProvider: ParentComponent = (props) => {
  const hook = useScheduleEditorStreamEditDialogBodyHook()
  return (
    <ScheduleEditorStreamEditDialogBodyContext.Provider value={hook}>
      {props.children}
    </ScheduleEditorStreamEditDialogBodyContext.Provider>
  );
}

/**
 * Hook for accessing the stream editor functionality from child components.
 *
 * This hook provides access to:
 * - The current stream state
 * - Methods for updating stream properties
 * - Methods for managing tags and participants
 * - The save method to persist changes
 *
 * @returns The stream editor context value
 * @throws Error if used outside of a ScheduleEditorStreamEditDialogBodyProvider
 */
export const useStreamEditor = () => useContext(ScheduleEditorStreamEditDialogBodyContext)!
